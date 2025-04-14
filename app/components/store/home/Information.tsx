import React from "react";

export default function Information() {
  return <div style={{
    backgroundImage: "url('https://res.cloudinary.com/djwau0xeb/image/upload/v1742699053/bg-school-a4c3bbae2125a416790a17e6e9908b5fde1d6711_psrsxq.jpg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }} className="flex justify-center items-center">
    <div className="flex flex-col justify-center items-center px-4 md:px-0">

      <div className="w-1/2 md:w-1/4 pt-20 md:pt-40">
        <img src="/logo.png" alt="Florique School Logo" className="w-full" />
      </div>
      <div className="text-primary text-center">
        <div className="text-2xl md:text-3xl font-semibold py-2">
          Florique School of Floristry
        </div>
        <div className="text-base md:text-lg pb-16 md:pb-28">
          Certificate III in Floristry & Short Courses
        </div>
      </div>

    </div>
  </div>;
}
