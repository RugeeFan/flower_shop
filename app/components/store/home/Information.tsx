interface InformationProps {
  banner: {
    imageUrl: string;
    title: string;
    subtitle: string;
    showLogo: boolean;
  };
}

export default function Information({ banner }: InformationProps) {
  return (
    <div
      style={{
        backgroundImage: `url('${banner.imageUrl}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="flex justify-center items-center min-h-[280px] md:min-h-[420px]"
    >
      <div className="flex flex-col justify-center items-center px-4 md:px-0 py-16 md:py-24">
        {banner.showLogo && (
          <div className="w-1/2 md:w-1/4">
            <img src="/logo.png" alt="Royal Rose Logo" className="w-full" />
          </div>
        )}
        {(banner.title || banner.subtitle) && (
          <div className="text-primary text-center mt-6">
            {banner.title && (
              <div className="text-2xl md:text-3xl font-semibold py-2">
                {banner.title}
              </div>
            )}
            {banner.subtitle && (
              <div className="text-base md:text-lg">{banner.subtitle}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
