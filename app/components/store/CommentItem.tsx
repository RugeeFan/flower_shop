export default function CommentItem() {
  return (
    <div className="bg-white rounded-lg py-6 sm:py-10">
      {/* Rating and title */}
      <div className="flex items-center justify-between">
        <div className="text-xl sm:text-2xl font-bold">IO</div>
        <div className="text-xs sm:text-sm text-gray-500">Verified Customer</div>
      </div>

      {/* User information */}
      <div className="mt-3 sm:mt-4">
        <div className="flex items-center">
          {/* User avatar */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600"
            >
              <path
                fillRule="evenodd"
                d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-2 sm:ml-3">
            <div className="text-sm sm:font-semibold">I. Orrego</div>
            <div className="text-xs sm:text-sm text-gray-500">Parramatta, Australia</div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-3 sm:my-4 border-t border-gray-200"></div>

      {/* Rating stars */}
      <div className="flex items-center text-yellow-500">
        {[...Array(6)].map((_, i) => (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 sm:w-5 sm:h-5"
          >
            <path
              fillRule="evenodd"
              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
              clipRule="evenodd"
            />
          </svg>
        ))}
      </div>

      {/* Comment content */}
      <div className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-700">
        <p>
          If you are looking for reliable, high quality flower delivery, I
          wholeheartedly recommend Pearson Florist. They exceed all my
          expectations and made the occasion even more special.
        </p>
      </div>

      {/* Reply section */}
      <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <div className="text-xs sm:text-sm font-semibold">Reply:</div>
        <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
          Thank you for your wonderful 5-star review, Isabel! We're thrilled to
          hear that we could make your occasion even more special. Your support
          means everything to us, and we look forward to bringing joy to your
          future celebrations!
        </div>
        <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
          Warm regards,<br />
          The Pearsons Team
        </div>
      </div>

      {/* Help and date */}
      <div className="mt-3 sm:mt-4 flex items-center justify-between">
        <div className="text-xs sm:text-sm text-gray-500">
          Was this review helpful?{' '}
          <button className="hover:underline">Yes</button>{' '}
          <button className="hover:underline">Report</button>
        </div>
        <div className="text-xs sm:text-sm text-gray-500">2 months ago</div>
      </div>
    </div>
  );
}