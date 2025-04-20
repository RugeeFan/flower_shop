import {
  LoaderFunctionArgs,
  json,
  ActionFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  useLoaderData,
  Link,
  Form,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { prisma } from "~/lib/prisma.server";
import { formatCurrency } from "~/utils/money";

const PAGE_SIZE = 12;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const page = parseInt(url.searchParams.get("page") ?? "1");

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      include: { categories: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
    }),
  ]);

  return json({ products, q, page, total });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = form.get("_action");
  const productId = form.get("productId")?.toString();

  if (intent === "delete" && productId) {
    await prisma.product.delete({ where: { id: productId } });
  }

  return redirect("/admin/products");
};

// 分页页码处理函数
function getResponsivePageNumbers(current: number, total: number, maxPages: number) {
  const pages: (number | "...")[] = [];

  if (total <= maxPages) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  pages.push(1);

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("...");

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < total - 1) pages.push("...");

  pages.push(total);
  return pages;
}

export default function AdminProductList() {
  const { products, q, page, total } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  const [maxVisiblePages, setMaxVisiblePages] = useState(10);

  // 响应式设置分页最大页数显示
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setMaxVisiblePages(5);
      } else {
        setMaxVisiblePages(10);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const pageList = getResponsivePageNumbers(page, totalPages, maxVisiblePages);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 标题 + 新增按钮 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <Link
          to="/admin/products/new"
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition"
        >
          新增商品
        </Link>
      </div>

      {/* 搜索栏 */}
      <Form method="get" className="mb-6 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <input
          type="text"
          name="q"
          placeholder="搜索商品名称"
          defaultValue={q}
          className="w-full max-w-md border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          搜索
        </button>
      </Form>

      {/* 商品列表 */}
      <div className="space-y-6">
        {products.length === 0 ? (
          <p className="text-gray-500">没有找到符合条件的商品</p>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col md:flex-row justify-between items-start gap-4 border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              {/* 左侧：商品信息 */}
              <div className="flex-1 space-y-1">
                <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
                <p className="text-sm text-gray-500">
                  分类：{product.categories.map((c) => c.name).join(", ") || "无"}
                </p>
                <p className="text-primary font-bold">{formatCurrency(product.price)}</p>
                <div className="flex gap-4 pt-2">
                  <Link
                    to={`/admin/products/${product.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    编辑
                  </Link>
                  <Form
                    method="post"
                    onSubmit={(e) => {
                      if (!confirm("确定要删除这个商品吗？")) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="_action" value="delete" />
                    <input type="hidden" name="productId" value={product.id} />
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      disabled={navigation.state !== "idle"}
                    >
                      删除
                    </button>
                  </Form>
                </div>
              </div>

              {/* 右侧：商品图片 */}
              {product.imgUrl?.length > 0 && (
                <div className="w-[120px] md:w-[150px] aspect-[370/460] shrink-0 rounded-md border overflow-hidden">
                  <img
                    src={product.imgUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 分页器 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-10 gap-2 flex-wrap">
          {prevPage && (
            <Link
              to={`?${new URLSearchParams({ q, page: prevPage.toString() })}`}
              className="px-4 py-2 rounded border bg-white hover:bg-gray-50"
            >
              « 上一页
            </Link>
          )}

          {pageList.map((p, idx) =>
            p === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-3 py-2 text-gray-400 select-none"
              >
                ...
              </span>
            ) : (
              <Link
                key={p}
                to={`?${(() => {
                  const params = new URLSearchParams(searchParams);
                  params.set("page", String(p));
                  return params.toString();
                })()}`}
                className={`px-4 py-2 rounded border ${p === page
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-800 hover:bg-gray-50"
                  }`}
              >
                {p}
              </Link>
            )
          )}

          {nextPage && (
            <Link
              to={`?${new URLSearchParams({ q, page: nextPage.toString() })}`}
              className="px-4 py-2 rounded border bg-white hover:bg-gray-50"
            >
              下一页 »
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
