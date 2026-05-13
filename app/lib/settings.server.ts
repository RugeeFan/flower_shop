import { prisma } from "./prisma.server";

export interface InformationBanner {
  imageUrl: string;
  title: string;
  subtitle: string;
  showLogo: boolean;
}

const INFORMATION_BANNER_KEY = "home_information_banner";

const DEFAULT_INFORMATION_BANNER: InformationBanner = {
  imageUrl: "/brand/homepage/banner-default.jpg",
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

// ── Admin notification email ─────────────────────────────────────────────────
// Recipient address for "new paid order" notifications. Admin-editable in
// /admin/settings. If the row is missing OR the value is empty, the email
// sender falls back to process.env.NOTIFICATION_EMAIL (and finally skips).

const NOTIFICATION_EMAIL_KEY = "admin_notification_email";

export async function getNotificationEmail(): Promise<string> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: NOTIFICATION_EMAIL_KEY },
  });
  return row?.value?.trim() ?? "";
}

export async function setNotificationEmail(email: string): Promise<void> {
  const value = email.trim();
  await prisma.siteSetting.upsert({
    where: { key: NOTIFICATION_EMAIL_KEY },
    create: { key: NOTIFICATION_EMAIL_KEY, value },
    update: { value },
  });
}
