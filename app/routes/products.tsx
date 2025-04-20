import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import ProductItem from "~/components/store/ProductItem";
import { prisma } from "~/lib/prisma.server";
import { ProductListItem } from "~/types/product";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const pageSize = 25;
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2">Our Flower Collection</h1>
      <p className="text-gray-600 text-center mb-8">
        {`Showing ${products.length} of ${pagination.total} beautiful arrangements`}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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

      <div className="flex justify-center mt-12 gap-2 flex-wrap items-center">
        <Link
          to={`?page=${currentPage - 1}`}
          className={`px-4 py-2 border rounded-md ${currentPage === 1 ? "pointer-events-none opacity-50" : ""}`}
        >
          Previous
        </Link>

        {pageNumbers.map((page) => (
          <Link
            key={page}
            to={`?page=${page}`}
            className={`w-10 h-10 flex items-center justify-center rounded-md ${page === currentPage ? "bg-primary text-white" : "border hover:bg-gray-100"
              }`}
          >
            {page}
          </Link>
        ))}

        <Link
          to={`?page=${currentPage + 1}`}
          className={`px-4 py-2 border rounded-md ${currentPage === totalPages ? "pointer-events-none opacity-50" : ""}`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
