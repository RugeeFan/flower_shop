// Catalogue of editable homepage content blocks. Both the admin list page
// and the per-slug editor read from this — the slug is the single source of
// truth, the title/description are human labels, and `area` lets us group in
// the admin UI ("Homepage", "Footer", ...).
//
// To add a new editable block:
//   1. Insert/seed a row in PageContent with the matching slug.
//   2. Add an entry here.
//   3. (Optional) Add a typed editor in admin.site-content.$id.tsx.
//      Without a typed editor you still get the generic title/subtitle/content
//      + dynamic-image-slot form as fallback.

export type ContentArea = "homepage" | "other";

export interface ContentBlockMeta {
  slug: string;
  area: ContentArea;
  label: string;
  description: string;
}

export const CONTENT_BLOCKS: ContentBlockMeta[] = [
  {
    slug: "home-banner",
    area: "homepage",
    label: "Hero (顶部大图区)",
    description:
      "首页最上方分屏区：左侧 eyebrow + 标题 + 段落 + 主/次按钮，右侧大图。",
  },
  {
    slug: "home-promotion-bar",
    area: "homepage",
    label: "顶部滚动条 (promotion bar)",
    description:
      '页面顶部黑色滚动 marquee。最多 3 行短文案，按顺序循环。可整体关闭。',
  },
  {
    slug: "home-information",
    area: "homepage",
    label: "Information 区块 (首页底部大 banner)",
    description:
      "首页底部全图分屏：左侧大背景图，右侧 logo + 主标题 + 副标题。常用于公告 / 季节促销 / 品牌介绍。",
  },
  {
    slug: "home-content-section",
    area: "homepage",
    label: "内容板块（通用）",
    description: "通用文案块，预留位。",
  },
  {
    slug: "home-feature-1",
    area: "homepage",
    label: "特色块 1",
    description: "通用文案块，预留位。",
  },
  {
    slug: "home-feature-2",
    area: "homepage",
    label: "特色块 2",
    description: "通用文案块，预留位。",
  },
];

export function getMeta(slug: string): ContentBlockMeta | undefined {
  return CONTENT_BLOCKS.find((c) => c.slug === slug);
}

// ─── Typed data shapes per slug ──────────────────────────────────────────────
// Stored in PageContent.data as JSON.

export interface HomeBannerData {
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export interface PromotionBarData {
  enabled?: boolean; // default true when null/undefined
}

export interface HomeInformationData {
  showLogo?: boolean; // default false
}
