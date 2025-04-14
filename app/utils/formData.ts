/**
 * 处理产品数据，使其更适合前端展示
 */

// 定义原始产品数据接口
export interface RawProduct {
  id: number;
  documentId: string;
  name: string;
  price: number;
  description: any[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  imgUrl: string;
  image: any;
  categories: {
    id: number;
    documentId: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    title: string;
  }[];
}

// 定义格式化后的产品数据接口
export interface FormattedProduct {
  id: number;
  documentId: string;
  name: string;
  price: number;
  description: string;
  imgUrl: string[];
  category: string[];
}

/**
 * 从描述数组中提取纯文本
 */
export function extractTextFromDescription(description: any[]): string {
  if (!description || !Array.isArray(description)) return '';

  let text = '';

  description.forEach(block => {
    if (block.type === 'paragraph' && Array.isArray(block.children)) {
      block.children.forEach((child: any) => {
        if (child.type === 'text') {
          text += child.text + ' ';
        }
      });
    }
  });

  return text.trim();
}

/**
 * 将描述数组转换为段落数组
 */
export function convertDescriptionToParagraphs(description: any[]): string[] {
  if (!description || !Array.isArray(description)) return [];

  const paragraphs: string[] = [];

  description.forEach(block => {
    if (block.type === 'paragraph' && Array.isArray(block.children)) {
      let paragraph = '';

      block.children.forEach((child: any) => {
        if (child.type === 'text') {
          paragraph += child.text;
        }
      });

      if (paragraph.trim()) {
        paragraphs.push(paragraph.trim());
      }
    }
  });

  return paragraphs;
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

/**
 * 处理产品数据
 */
export function formatProduct(product: RawProduct): FormattedProduct {
  // 提取分类标题
  const category = product.categories.map(category => category.title);

  // 提取描述文本
  const description = extractTextFromDescription(product.description);

  return {
    id: product.id,
    documentId: product.documentId,
    name: product.name,
    price: product.price,
    description,
    imgUrl: [product.imgUrl],
    category
  };
}

/**
 * 处理产品数组
 */
export function formatProducts(products: RawProduct[]): FormattedProduct[] {
  if (!products || !Array.isArray(products)) return [];
  return products.map(product => formatProduct(product));
}
