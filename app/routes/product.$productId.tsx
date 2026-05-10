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
      error: null as string | null,
    };
  } catch (error) {
    console.error("Error loading product:", error);
    return {
      product: null,
      error: "Failed to load product" as string | null,
      category: null,
      success: false,
    };
  }
}

export default function ProductPage() {
  const { product, error, success } = useLoaderData<typeof loader>();

  if (!success || !product) {
    return (
      <div className="bg-bone min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="eyebrow mb-3">Not found</div>
          <h1 className="font-display text-charcoal text-[36px] leading-display">
            {error || "We couldn't find that flower."}
          </h1>
          <p className="text-ink-muted text-[14px] mt-4">
            It may have been retired for the season — try our full collection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ProductContainer product={product} />
      <Comments />
      <FAQs />
    </>
  );
}
