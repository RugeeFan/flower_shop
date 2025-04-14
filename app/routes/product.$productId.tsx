import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import Comments from "~/components/store/Comments";
import FAQs from "~/components/store/FAQs";
import ProductContainer from "~/components/store/ProductContainer";
import SimilarProducts from "~/components/store/SimilarProducts";
import { ApiResponse, Product } from '~/types';
import { apiService } from "~/utils/apiService";
import { formatProduct, RawProduct } from "~/utils/formData";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { productId } = params;

  if (!productId) {
    return ({ products: [], error: "Product not found" });
  }

  try {
    const url = `products/${productId}?populate=*`;

    const response = await apiService.get<ApiResponse>(url);
    // console.log("response", response.data);
    // 格式化产品数据
    const formattedProduct = formatProduct(response.data as RawProduct);
    console.log("formattedProducts", formattedProduct);

    return ({
      product: formattedProduct,
      category: formattedProduct.category,
      success: true
    });
  } catch (error) {
    console.error("Error loading products:", error);
    return ({
      product: [],
      error: "Failed to load products",
      category: null,
      success: false
    });
  }
}

export default function ProductPage() {
  const { product, error, success } = useLoaderData<typeof loader>();
  return <div>
    <ProductContainer product={product as Product} />
    {/* <SimilarProducts /> */}
    <Comments />
    <FAQs />
  </div>;
}
