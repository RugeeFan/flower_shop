// In-memory sliding-window rate limiter. Single-VPS, single-process —
// good enough for the small store this project targets. If the app ever
// scales to multiple instances or serverless, swap in a Redis-backed
// implementation by re-exporting check/reset against an external store.
//
// Each bucket is keyed by a caller-supplied string (e.g. "login:ip:email").
// Buckets are pruned lazily on read; nothing else needs to clean them up.

type Entry = {
  // Unix-ms timestamps of failures in the current window. Oldest first.
  hits: number[];
};

const buckets = new Map<string, Entry>();

export interface RateLimitOptions {
  /** Maximum number of failures within the window before blocking. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitDecision {
  /** True if the action is currently blocked. */
  limited: boolean;
  /** Number of failures already counted (after pruning). */
  hits: number;
  /** Number of failures still allowed before the next attempt is blocked. */
  remaining: number;
  /** Unix-ms when the oldest hit ages out. 0 if no hits yet. */
  retryAt: number;
}

function prune(entry: Entry, cutoff: number) {
  while (entry.hits.length > 0 && entry.hits[0] < cutoff) {
    entry.hits.shift();
  }
}

/** Inspect a bucket without recording a hit. Useful for `if blocked return early`. */
export function inspect(key: string, opts: RateLimitOptions): RateLimitDecision {
  const now = Date.now();
  const cutoff = now - opts.windowMs;
  const entry = buckets.get(key);
  if (!entry) {
    return { limited: false, hits: 0, remaining: opts.max, retryAt: 0 };
  }
  prune(entry, cutoff);
  return {
    limited: entry.hits.length >= opts.max,
    hits: entry.hits.length,
    remaining: Math.max(0, opts.max - entry.hits.length),
    retryAt: entry.hits.length === 0 ? 0 : entry.hits[0] + opts.windowMs,
  };
}

/** Record a failure. Returns the post-record decision. */
export function recordFailure(key: string, opts: RateLimitOptions): RateLimitDecision {
  const now = Date.now();
  const cutoff = now - opts.windowMs;
  let entry = buckets.get(key);
  if (!entry) {
    entry = { hits: [] };
    buckets.set(key, entry);
  }
  prune(entry, cutoff);
  entry.hits.push(now);
  return {
    limited: entry.hits.length >= opts.max,
    hits: entry.hits.length,
    remaining: Math.max(0, opts.max - entry.hits.length),
    retryAt: entry.hits[0] + opts.windowMs,
  };
}

/** Clear a key. Call this after a verified success so the user isn't punished for prior typos. */
export function reset(key: string): void {
  buckets.delete(key);
}

/** Visible for tests / admin tooling; not used in normal flow. */
export function __debug_size(): number {
  return buckets.size;
}
