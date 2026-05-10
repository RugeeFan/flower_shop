import { useParams, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import ProductItem from "~/components/store/ProductItem";
import { prisma } from "~/lib/prisma.server";
import { ProductListItem } from "~/types/product";
import Sidebar from "~/components/store/SideBar";

// 格式化分类名称以便显示
function formatCategoryName(category: string) {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { category } = params;

  if (!category) {
    return {
      products: [] as { id: string; name: string; price: number; imgUrl: string }[],
      category,
      success: false,
      error: "Category not found" as string | null,
    };
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        categories: {
          some: {
            name: {
              equals: category,
              mode: "insensitive",
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        price: true,
        imgUrl: true,
      },
    });

    return {
      products,
      category,
      success: true,
      error: null as string | null,
    };
  } catch (error) {
    console.error("Error loading category products:", error);
    return {
      products: [] as { id: string; name: string; price: number; imgUrl: string }[],
      category,
      success: false,
      error: "Failed to load products" as string | null,
    };
  }
}

export default function CategoryPage() {
  const { category } = useParams();
  const { products, error, success } = useLoaderData<typeof loader>();
  const displayName = category ? formatCategoryName(category) : "";

  return (
    <section className="bg-bone min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12 md:py-20">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <div className="eyebrow mb-3">Category</div>
          <h1 className="font-display text-charcoal text-[40px] md:text-[56px] leading-display tracking-tight">
            {displayName}
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-10 lg:gap-14">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <div className="flex-1">
            {!success && error && (
              <div className="mb-8 border border-border bg-cream/50 p-4 text-[13px] text-ink-muted">
                <span className="eyebrow text-terracotta mr-2">Heads up</span>
                {error}
              </div>
            )}

            {products.length === 0 && !error ? (
              <div className="text-center py-20 max-w-md mx-auto">
                <div className="eyebrow mb-3">Empty for now</div>
                <p className="font-display text-charcoal text-[24px] leading-display">
                  No flowers in this category yet.
                </p>
                <p className="text-ink-muted text-[14px] mt-3">
                  Try another occasion in the sidebar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 md:gap-x-6 md:gap-y-14">
                {products.map((product: ProductListItem) => (
                  <ProductItem
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    imgUrl={product.imgUrl}
                    price={product.price}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
