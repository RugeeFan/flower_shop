import { prisma } from "./prisma.server";

export interface InformationBanner {
  imageUrl: string;
  title: string;
  subtitle: string;
  showLogo: boolean;
}

const INFORMATION_BANNER_KEY = "home_information_banner";

const DEFAULT_INFORMATION_BANNER: InformationBanner = {
  imageUrl:
    "https://res.cloudinary.com/djwau0xeb/image/upload/v1742699053/bg-school-a4c3bbae2125a416790a17e6e9908b5fde1d6711_psrsxq.jpg",
  title: "",
  subtitle: "",
  showLogo: true,
};

export async function getInformationBanner(): Promise<InformationBanner> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: INFORMATION_BANNER_KEY },
  });
  if (!row) return DEFAULT_INFORMATION_BANNER;
  try {
    const parsed = JSON.parse(row.value) as Partial<InformationBanner>;
    return { ...DEFAULT_INFORMATION_BANNER, ...parsed };
  } catch {
    return DEFAULT_INFORMATION_BANNER;
  }
}

export async function setInformationBanner(value: InformationBanner): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: INFORMATION_BANNER_KEY },
    create: { key: INFORMATION_BANNER_KEY, value: JSON.stringify(value) },
    update: { value: JSON.stringify(value) },
  });
}
