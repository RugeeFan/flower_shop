import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import ProductItem from "~/components/store/ProductItem";
import Sidebar from "~/components/store/SideBar";
import { prisma } from "~/lib/prisma.server";
import { ProductListItem } from "~/types/product";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const pageSize = 28;
  const skip = (page - 1) * pageSize;
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        imgUrl: true,
      },
    }),
    prisma.product.count(),
  ]);

  return {
    products,
    pagination: {
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
      total,
    },
    success: true,
  };
}

export default function Products() {
  const { products, pagination } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page") || "1");
  const totalPages = pagination.pageCount;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const pageBtn =
    "min-w-[40px] h-10 inline-flex items-center justify-center text-[13px] tabular-nums border border-border text-charcoal hover:border-charcoal transition-colors";

  return (
    <section className="bg-bone min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12 md:py-20">
        {/* Page header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="eyebrow mb-3">Shop all</div>
          <h1 className="font-display text-charcoal text-[40px] md:text-[56px] leading-display tracking-tight">
            Our flower collection.
          </h1>
          <p className="text-ink-muted text-[14px] mt-4">
            Showing {products.length} of {pagination.total} arrangements.
          </p>
        </div>

        {/* Sidebar + grid */}
        <div className="flex flex-col md:flex-row gap-10 lg:gap-14">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-ink-muted text-[14px]">
                  No flowers in the collection right now. Check back soon.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-6 md:gap-y-14">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-16 flex flex-wrap justify-center items-center gap-2">
            <Link
              to={`?page=${currentPage - 1}`}
              className={`${pageBtn} px-4 ${
                currentPage === 1 ? "pointer-events-none opacity-40" : ""
              }`}
            >
              ← Prev
            </Link>

            {pageNumbers.map((p) => (
              <Link
                key={p}
                to={`?page=${p}`}
                className={`${pageBtn} ${
                  p === currentPage
                    ? "bg-charcoal text-bone border-charcoal"
                    : ""
                }`}
              >
                {p}
              </Link>
            ))}

            <Link
              to={`?page=${currentPage + 1}`}
              className={`${pageBtn} px-4 ${
                currentPage === totalPages ? "pointer-events-none opacity-40" : ""
              }`}
            >
              Next →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
