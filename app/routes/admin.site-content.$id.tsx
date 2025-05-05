// app/routes/admin.site-content.$id.tsx
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { useTranslation } from "react-i18next";

export async function loader({ params }: LoaderFunctionArgs) {
  const content = await prisma.pageContent.findUnique({
    where: { id: Number(params.id) },
  });

  if (!content) {
    throw new Response("Not Found", { status: 404 });
  }

  return { content };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();

  const title = formData.get("title") as string;
  const subtitle = formData.get("subtitle") as string;
  const content = formData.get("content") as string;
  const imageUrl = formData.get("imageUrl") as string;

  await prisma.pageContent.update({
    where: { id: Number(params.id) },
    data: {
      title,
      subtitle,
      content,
      imageUrl,
    },
  });

  return redirect("/admin/site-content");
}

export default function EditSiteContent() {
  const { content } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { t } = useTranslation("admin");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t("editContent")}</h1>
      <Form method="post" className="space-y-6">
        {/* Slug（只读） */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("slug")} ({t("cannotEdit")})
          </label>
          <input
            type="text"
            value={content.slug}
            disabled
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">{t("title")}</label>
          <input
            type="text"
            name="title"
            defaultValue={content.title || ""}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-medium text-gray-700">{t("subtitle")}</label>
          <input
            type="text"
            name="subtitle"
            defaultValue={content.subtitle || ""}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700">{t("content")}</label>
          <textarea
            name="content"
            rows={4}
            defaultValue={content.content || ""}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700">{t("imageUrl")}</label>
          <input
            type="text"
            name="imageUrl"
            defaultValue={content.imageUrl || ""}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t("save")}
          </button>
        </div>
      </Form>
    </div>
  );
}
