import CommentItem from "./CommentItem";

const comments = [
  {
    name: "Ava Thompson",
    city: "Parramatta, NSW",
    title: "AT",
    review:
      "Absolutely stunning flowers and seamless delivery. The team was extremely helpful and made the whole process easy. Highly recommend to anyone needing something special.",
    reply:
      "Thank you for your kind words, Ava! We're so glad we could make your experience seamless. Hope to send flowers your way again soon.",
    timeAgo: "1 month ago",
  },
  {
    name: "Lucas Hernández",
    city: "Chatswood, NSW",
    title: "LH",
    review:
      "Beautiful arrangement and very fresh flowers. My partner was overjoyed — thank you for making the day extra memorable with such quality service.",
    reply:
      "Thank you, Lucas. We're thrilled to hear your partner loved them. We look forward to delivering happiness again.",
    timeAgo: "2 weeks ago",
  },
  {
    name: "Sophia Chang",
    city: "Mosman, NSW",
    title: "SC",
    review:
      "Quick delivery and beautiful presentation. The flowers looked even better in person. It was my first time ordering, but definitely not my last.",
    reply:
      "Hi Sophia — thank you for trusting us with your first order. So glad you loved the presentation. See you again soon.",
    timeAgo: "3 weeks ago",
  },
];

export default function Comments() {
  return (
    <section className="bg-bone">
      <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-24">
        {/* Summary */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <div className="eyebrow mb-3">Reviews</div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-charcoal text-[44px] leading-none tabular-nums">
                4.95
              </span>
              <span className="text-ink-muted text-[13px]">/ 5</span>
            </div>
            <p className="text-ink-muted text-[13px] mt-2">
              Based on 102 reviews from real customers.
            </p>
          </div>
          <div className="flex items-center gap-2 text-terracotta">
            {[...Array(5)].map((_, i) => (
              <i key={i} className="ri-star-fill text-base"></i>
            ))}
          </div>
        </div>

        <div className="hairline mb-2" />
        <div className="flex items-center justify-between py-4 text-[12px] text-ink-muted">
          <button className="inline-flex items-center gap-2 uppercase tracking-eyebrow hover:text-charcoal transition-colors">
            Sort
            <i className="ri-arrow-down-s-line"></i>
          </button>
          <span className="uppercase tracking-eyebrow">Verified product reviews</span>
        </div>
        <div className="hairline" />

        <ul className="divide-y divide-border">
          {comments.map((comment, index) => (
            <CommentItem key={index} comment={comment} />
          ))}
        </ul>
      </div>
    </section>
  );
}
