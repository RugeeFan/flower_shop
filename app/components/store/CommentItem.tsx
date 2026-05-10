interface Comment {
  name: string;
  city: string;
  title: string;
  review: string;
  reply: string;
  timeAgo: string;
}

export default function CommentItem({ comment }: { comment: Comment }) {
  return (
    <li className="py-8 first:pt-6 last:pb-6">
      {/* Header: avatar + name + verified */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-cream flex items-center justify-center">
            <span className="font-display text-charcoal text-[14px]">
              {comment.title}
            </span>
          </div>
          <div>
            <div className="font-display text-charcoal text-[16px] leading-tight">
              {comment.name}
            </div>
            <div className="text-ink-muted text-[12px] mt-0.5">
              {comment.city}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-ink-muted uppercase tracking-eyebrow">
          Verified
        </div>
      </div>

      {/* Stars */}
      <div className="flex gap-0.5 text-terracotta mb-3">
        {[...Array(5)].map((_, i) => (
          <i key={i} className="ri-star-fill text-[13px]"></i>
        ))}
      </div>

      {/* Review */}
      <p className="text-charcoal text-[15px] leading-body">{comment.review}</p>

      {/* Reply */}
      {comment.reply && (
        <div className="mt-5 border-l-2 border-terracotta/40 pl-4 py-1">
          <div className="eyebrow mb-2">Royal Rose replied</div>
          <p className="text-ink-muted text-[14px] leading-body">{comment.reply}</p>
          <p className="text-ink-muted/80 text-[12px] mt-3 italic">
            Warm regards, the Royal Rose team.
          </p>
        </div>
      )}

      {/* Footer: helpful + date */}
      <div className="mt-5 flex items-center justify-between text-[12px] text-ink-muted">
        <div className="flex items-center gap-4">
          <span>Was this review helpful?</span>
          <button className="hover:text-charcoal underline underline-offset-2 transition-colors">
            Yes
          </button>
          <button className="hover:text-charcoal underline underline-offset-2 transition-colors">
            Report
          </button>
        </div>
        <span>{comment.timeAgo}</span>
      </div>
    </li>
  );
}
