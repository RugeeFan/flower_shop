import { useParams, useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { apiService } from "~/utils/apiService";
import { formatProducts, RawProduct, FormattedProduct } from "~/utils/formData";
import ProductItem from "~/components/store/ProductItem";
import { ApiResponse } from '~/types';

// 定义 API 响应类型


// 格式化分类名称以便显示
function formatCategoryName(category: string) {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { category } = params;

  if (!category) {
    return ({ products: [], error: "Category not found" });
  }

  try {
    const url = `products?populate=*&filters[categories][title][$eq]=${category}`;

    const response = await apiService.get<ApiResponse>(url);

    // 格式化产品数据
    const formattedProducts = formatProducts(response.data as RawProduct[]);

    return ({
      products: formattedProducts,
      category,
      success: true
    });
  } catch (error) {
    console.error("Error loading products:", error);
    return ({
      products: [],
      category,
      error: "Failed to load products",
      success: false
    });
  }
}

export default function CategoryPage() {
  const { category } = useParams();
  const { products, error, success } = useLoaderData<typeof loader>();

  const displayName = category ? formatCategoryName(category) : "";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-primary">{displayName}</h1>

      {!success && error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      {products.length === 0 && !error ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products?.map(product => (
            <ProductItem
              key={product.id}
              documentId={product.documentId}
              name={product.name}
              imgUrl={product.imgUrl}
              price={product.price}
            />
          ))}
        </div>
      )}
    </div>
  );
}