export default function Hero() {
  return <div>
    <div className="relative h-[300px] md:h-[400px] lg:h-[488px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://res.cloudinary.com/djwau0xeb/image/upload/v1742647466/flowerHBG_jtco02.jpg')"
        }}
      ></div>

      <div className="absolute inset-0 flex items-center justify-center text-white z-10 flex-col px-4 text-center">
        <div className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-widest pb-2 md:pb-4">
          FLOWERS, PLANTS AND GIFT HAMPERS
        </div>
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold">
          DELIVERED WITH LOVE!
        </div>
        <button className="mt-4 md:mt-8 bg-white text-black px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors">
          ORDER NOW
        </button>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
    </div>
  </div>;
}
