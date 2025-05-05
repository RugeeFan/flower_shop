import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
  json,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { useTranslation } from "react-i18next";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return json({ categories });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const price = parseFloat(formData.get("price") as string);
  const imgUrl = formData.get("imgUrl")?.toString().trim();
  const categoryIds = formData.getAll("categories") as string[];

  if (!name || isNaN(price) || !imgUrl) {
    return json({ error: "missingFields" }, { status: 400 });
  }

  try {
    await prisma.product.create({
      data: {
        name,
        description: description || "",
        price,
        imgUrl,
        categories: {
          connect: categoryIds.map((id) => ({ id })),
        },
      },
    });
    return redirect("/admin/products");
  } catch (err) {
    return json({ error: "createFailed" }, { status: 500 });
  }
};

export default function NewProductPage() {
  const actionData = useActionData<typeof action>();
  const { state } = useNavigation();
  const loading = state !== "idle";
  const { t } = useTranslation("admin");

  const categories = useLoaderData<typeof loader>().categories;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{t("addProduct")}</h1>

      {actionData?.error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {t(actionData.error)}
        </div>
      )}

      <Form method="post" className="space-y-4">
        <div>
          <label className="block font-medium">{t("productName")} *</label>
          <input
            name="name"
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">{t("price")} (AUD) *</label>
          <input
            name="price"
            type="number"
            step="0.01"
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">{t("imageUrl")} *</label>
          <input
            name="imgUrl"
            type="url"
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">{t("category")}</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-1">
                <input type="checkbox" name="categories" value={cat.id} />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium">{t("description")}</label>
          <textarea
            name="description"
            className="w-full border rounded px-3 py-2"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("submitting") : t("submit")}
        </button>
      </Form>
    </div>
  );
}
