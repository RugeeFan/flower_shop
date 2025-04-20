import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Comments from "~/components/store/Comments";
import FAQs from "~/components/store/FAQs";
import ProductContainer from "~/components/store/ProductContainer";
import { Product } from "~/types/product";
import { prisma } from "~/lib/prisma.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { productId } = params;

  if (!productId) {
    return {
      product: null,
      error: "Product not found",
      category: null,
      success: false,
    };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        categories: {
          select: { id: true, name: true },
        },
      },
    });

    if (!product) {
      return {
        product: null,
        error: "Product not found",
        category: null,
        success: false,
      };
    }

    const formattedProduct: Product = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      imgUrl: product.imgUrl,
      categories: product.categories,
    };

    return {
      product: formattedProduct,
      category: product.categories.length > 0 ? product.categories[0].name : null,
      success: true,
    };
  } catch (error) {
    console.error("Error loading product:", error);
    return {
      product: null,
      error: "Failed to load product",
      category: null,
      success: false,
    };
  }
}

export default function ProductPage() {
  const { product, error, success } = useLoaderData<typeof loader>();

  if (!success || !product) {
    return <div className="text-center py-20 text-red-500">{error || "Product not found"}</div>;
  }

  return (
    <div>
      <ProductContainer product={product} />
      <Comments />
      <FAQs />
    </div>
  );
}
