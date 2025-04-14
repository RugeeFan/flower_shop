import CommentItem from "./CommentItem";

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
        {
          [...Array(10)].map((_, index) => (
            <CommentItem key={index} />
          ))
        }
      </div>
    </div>
  );
}