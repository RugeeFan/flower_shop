import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
} from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";


export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  if (!id) throw new Response("Not Found", { status: 404 });

  const product = await prisma.product.findUnique({
    where: { id },
    include: { categories: true },
  });

  if (!product) throw new Response("Not Found", { status: 404 });

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return json({ product, categories });
};


export const action = async ({ request, params }: ActionFunctionArgs) => {
  const id = params.id;
  const form = await request.formData();

  const name = form.get("name")?.toString().trim();
  const description = form.get("description")?.toString().trim();
  const price = parseFloat(form.get("price") as string);
  const imgUrl = form.get("imgUrl")?.toString().trim();
  const categoryIds = form.getAll("categories") as string[];

  if (!id || !name || isNaN(price) || !imgUrl) {
    return json({ error: "请填写所有必填字段。" }, { status: 400 });
  }

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || "",
        price,
        imgUrl,
        categories: {
          set: [], // 先清空
          connect: categoryIds.map((id) => ({ id })),
        },
      },
    });

    return redirect("/admin/products");
  } catch (err) {
    console.error("编辑失败", err);
    return json({ error: "更新失败，请重试" }, { status: 500 });
  }
};

export default function EditProductPage() {
  const { product, categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { state } = useNavigation();
  const loading = state !== "idle";

  const selectedCategoryIds = new Set(product.categories.map((c) => c.id));

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">编辑商品</h1>

      {actionData?.error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{actionData.error}</div>
      )}

      <Form method="post" className="space-y-4">
        <div>
          <label className="block font-medium">商品名称 *</label>
          <input
            name="name"
            defaultValue={product.name}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">价格 *</label>
          <input
            name="price"
            type="number"
            step="0.01"
            defaultValue={product.price}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">图片地址 *</label>
          <input
            name="imgUrl"
            type="url"
            defaultValue={product.imgUrl}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">分类</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  name="categories"
                  value={cat.id}
                  defaultChecked={selectedCategoryIds.has(cat.id)}
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium">描述</label>
          <textarea
            name="description"
            defaultValue={product.description}
            className="w-full border rounded px-3 py-2"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "提交中..." : "保存更改"}
        </button>
      </Form>
    </div>
  );
}
