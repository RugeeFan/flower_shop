// English-only date picker for AU storefront.
//
// Why this exists: native <input type="date"> renders its calendar overlay in
// the iOS system language regardless of the document's `lang` attribute. AU
// customers on a Chinese-locale iPhone otherwise see Chinese month names
// inside the checkout form. This wraps react-day-picker with the enAU locale
// so the calendar UI is always English, on every browser and device.
//
// Contract:
//   value:    "" or "YYYY-MM-DD" (ISO local date)
//   onChange: receives the same shape ("" when user clears, "YYYY-MM-DD" on pick)
//   minDate:  optional ISO "YYYY-MM-DD" lower bound (inclusive)
//
// SSR-safe: react-day-picker renders fine on the server, and we gate the
// popover open state behind useState so the initial server render shows the
// trigger button only.

import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { enAU } from "react-day-picker/locale";
import "react-day-picker/style.css";

function parseIso(s: string): Date | undefined {
  if (!s) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return undefined;
  const y = Number(m[1]),
    mo = Number(m[2]) - 1,
    d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (isNaN(dt.getTime())) return undefined;
  return dt;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function formatHuman(d: Date | undefined): string {
  if (!d) return "";
  // e.g. "Sat, 17 May 2026" — AU-style day-month-year, English
  return d.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export interface EnDatePickerProps {
  value: string;
  onChange: (iso: string) => void;
  onBlur?: () => void;
  minDate?: string; // ISO YYYY-MM-DD
  placeholder?: string;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

export default function EnDatePicker({
  value,
  onChange,
  onBlur,
  minDate,
  placeholder = "Pick a date",
  className,
  id,
  ariaLabel,
}: EnDatePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => parseIso(value), [value]);
  const minDt = useMemo(() => parseIso(minDate ?? ""), [minDate]);

  // Click-outside to close.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onBlur]);

  const trigger = formatHuman(selected) || placeholder;
  const isEmpty = !selected;

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel ?? "Pick a date"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`input-style w-full text-left flex items-center justify-between ${
          isEmpty ? "text-ink-muted" : "text-charcoal"
        }`}
      >
        <span>{trigger}</span>
        <i className="ri-calendar-line text-base text-ink-muted ml-2" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute z-30 mt-2 bg-white border border-border shadow-lg p-2"
        >
          <DayPicker
            mode="single"
            locale={enAU}
            weekStartsOn={1}
            selected={selected}
            defaultMonth={selected ?? minDt ?? new Date()}
            disabled={minDt ? { before: minDt } : undefined}
            onSelect={(d) => {
              if (d) {
                onChange(toIso(d));
                setOpen(false);
                onBlur?.();
              } else {
                // user cleared selection
                onChange("");
              }
            }}
            classNames={{
              today: "rdp-today text-terracotta font-semibold",
              selected:
                "rdp-selected !bg-charcoal !text-bone hover:!bg-charcoal/90",
              chevron: "rdp-chevron fill-charcoal",
            }}
          />
        </div>
      )}
    </div>
  );
}
