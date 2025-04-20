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
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-sm rounded-xl">
      <h1 className="text-2xl font-bold mb-6">编辑商品</h1>

      {product.imgUrl && (
        <div className="mb-6 max-w-[370px] mx-auto">
          <div className="aspect-[370/460] w-full border rounded-md overflow-hidden shadow-sm">
            <img
              src={product.imgUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {actionData?.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{actionData.error}</div>
      )}

      <Form method="post" className="space-y-5">
        <div>
          <label className="block font-medium text-gray-700 mb-1">商品名称 *</label>
          <input
            name="name"
            defaultValue={product.name}
            className="input-style"
            required
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">价格 *</label>
          <input
            name="price"
            type="number"
            step="0.01"
            defaultValue={product.price}
            className="input-style"
            required
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">图片地址 *</label>
          <input
            name="imgUrl"
            type="url"
            defaultValue={product.imgUrl}
            className="input-style"
            required
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">分类</label>
          <div className="flex flex-wrap gap-3 mt-1">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <input
                  type="checkbox"
                  name="categories"
                  value={cat.id}
                  defaultChecked={selectedCategoryIds.has(cat.id)}
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">描述</label>
          <textarea
            name="description"
            defaultValue={product.description}
            rows={4}
            className="input-style"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition"
        >
          {loading ? "提交中..." : "保存更改"}
        </button>
      </Form>
    </div>
  );
}
