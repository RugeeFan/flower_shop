import { LoaderFunctionArgs, json, ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Link, Form, useNavigation, useSearchParams } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { formatCurrency } from "~/utils/money";

// ✅ 搜索 + 加载数据
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: q,
        mode: "insensitive", // 不区分大小写
      },
    },
    include: { categories: true },
    orderBy: { createdAt: "desc" },
  });

  return json({ products, q });
};

// ✅ 删除 action（保持原样）
export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = form.get("_action");
  const productId = form.get("productId")?.toString();

  if (intent === "delete" && productId) {
    await prisma.product.delete({ where: { id: productId } });
  }

  return redirect("/admin/products");
};

export default function AdminProductList() {
  const { products, q } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <Link
          to="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          新增商品
        </Link>
      </div>

      {/* 搜索栏 */}
      <Form method="get" className="mb-4 flex gap-2">
        <input
          type="text"
          name="q"
          placeholder="搜索商品名称"
          defaultValue={q}
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          type="submit"
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          搜索
        </button>
      </Form>

      {/* 结果列表 */}
      <div className="overflow-x-auto border rounded shadow-sm">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="text-left p-3">名称</th>
              <th className="text-left p-3">分类</th>
              <th className="text-left p-3">价格</th>
              <th className="text-left p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-4 text-gray-500">
                  没有找到符合条件的商品
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3 text-sm text-gray-700">
                    {product.categories.map((c) => c.name).join(", ")}
                  </td>
                  <td className="p-3">{formatCurrency(product.price)}</td>
                  <td className="p-3 space-x-2">
                    <Link
                      to={`/admin/products/${product.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      编辑
                    </Link>

                    <Form
                      method="post"
                      onSubmit={(e) => {
                        if (!confirm("确定要删除这个商品吗？")) e.preventDefault();
                      }}
                      className="inline"
                    >
                      <input type="hidden" name="_action" value="delete" />
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        className="text-red-600 hover:underline disabled:opacity-50"
                        disabled={navigation.state !== "idle"}
                      >
                        删除
                      </button>
                    </Form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
