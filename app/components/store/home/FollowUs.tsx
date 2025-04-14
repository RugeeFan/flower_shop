export default function FollowUs() {
  const handleClick = () => {
    window.location.href = "https://rugee.vercel.app";
  };

  return (
    <div className="mt-10 md:mt-20 bg-[#F4F7F7] px-4 md:px-20 lg:px-40 py-6 md:py-10 flex justify-center items-center">
      <div
        className="w-full md:w-3/4 lg:w-1/2 h-48 md:h-80 bg-[#2E2E2E] flex justify-center items-center cursor-pointer hover:bg-[#3a3a3a] transition-colors"
        onClick={handleClick}
      >
        <div className="text-white text-center">
          <div className="text-xl md:text-2xl font-semibold">FOLLOW US ON INSTAGRAM</div>
          <div className="text-xl md:text-2xl font-bold underline flex justify-center items-center mt-2">
            @FLORIQUE
          </div>
        </div>
      </div>
    </div>
  );
}
