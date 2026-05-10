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
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-primary py-6 px-4">{displayName}</h1>
      <div className="flex flex-col md:flex-row">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="container mx-auto px-4 py-8">
          {!success && error && (
            <p className="text-red-500 mb-4">{error}</p>
          )}

          {products.length === 0 && !error ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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


  );
}
