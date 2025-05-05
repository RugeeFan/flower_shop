import CommentItem from "./CommentItem";

const comments = [
  {
    name: "Ava Thompson",
    city: "Paramatta, NSW",
    title: "AT",
    review: "Absolutely stunning flowers and seamless delivery! The team was extremely helpful and made the whole process easy. Highly recommend to anyone needing something special.",
    reply: "Thank you for your kind words, Ava! We're so happy we could make your experience seamless. Hope to serve you again soon!",
    timeAgo: "1 month ago",
  },
  {
    name: "Lucas Hernández",
    city: "ChatsWood, NSW",
    title: "LH",
    review: "Beautiful arrangement and very fresh flowers. My partner was overjoyed! Thank you for making the day extra memorable with such quality service.",
    reply: "Thank you, Lucas! We're thrilled to hear that your partner loved the flowers. We look forward to delivering happiness again!",
    timeAgo: "2 weeks ago",
  },
  {
    name: "Sophia Chang",
    city: "Moscot, NSW",
    title: "SC",
    review: "Quick delivery and amazing presentation! The flowers looked even better in person. It was my first time ordering, but definitely not my last.",
    reply: "Hi Sophia, thank you for trusting us with your first order! We're so glad you loved the presentation. See you again soon!",
    timeAgo: "3 weeks ago",
  },
];

export default function Comments() {
  return (
    <div className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40">
      <div className="text-xl sm:text-2xl font-bold pt-4 sm:pt-6 flex items-center">
        4.95
        <span className="pl-2 sm:pl-4 flex">
          {[...Array(5)].map((_, index) => (
            <i key={index} className="ri-star-fill text-[#FCBF02]"></i>
          ))}
        </span>
      </div>
      <div className="text-xs sm:text-[0.8rem] pt-1 sm:pt-2">
        Based On 102 Reviews
      </div>
      <div className="pt-6 sm:pt-10">
        <hr />
      </div>
      <div className="py-3 sm:py-4">Sort <i className="ri-arrow-down-s-line"></i></div>
      <hr />
      <div className="flex justify-end pt-3 sm:pt-4 font-bold underline">PRODUCT REVIEWS</div>
      <div className="space-y-4 sm:space-y-6">
        {comments.map((comment, index) => (
          <CommentItem key={index} comment={comment} />
        ))}
      </div>
    </div>
  );
}
