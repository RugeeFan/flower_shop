// app/routes/admin.site-content._index.tsx
import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { useTranslation } from "react-i18next";

export async function loader({ }: LoaderFunctionArgs) {
  const contents = await prisma.pageContent.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return { contents };
}

export default function SiteContentAdmin() {
  const { contents } = useLoaderData<typeof loader>();
  const { t } = useTranslation("admin");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t("siteContentTitle")}</h1>

      {/* ✅ 桌面端表格 */}
      <div className="overflow-x-auto hidden sm:block">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-6 border-b text-left">{t("slug")}</th>
              <th className="py-3 px-6 border-b text-left">{t("title")}</th>
              <th className="py-3 px-6 border-b text-left">{t("lastUpdated")}</th>
              <th className="py-3 px-6 border-b text-left">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {contents.map((content) => (
              <tr key={content.id} className="hover:bg-gray-50">
                <td className="py-3 px-6 border-b">{content.slug}</td>
                <td className="py-3 px-6 border-b">{content.title || "-"}</td>
                <td className="py-3 px-6 border-b">
                  {new Date(content.updatedAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-6 border-b">
                  <Link
                    to={`/admin/site-content/${content.id}`}
                    className="text-blue-500 underline"
                  >
                    {t("edit")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ 移动端卡片式展示 */}
      <div className="sm:hidden space-y-4">
        {contents.map((content) => (
          <div key={content.id} className="border rounded-lg p-4 bg-white shadow-sm text-sm">
            <div className="mb-2">
              <strong>{t("slug")}:</strong> {content.slug}
            </div>
            <div className="mb-2">
              <strong>{t("title")}:</strong> {content.title || "-"}
            </div>
            <div className="mb-2">
              <strong>{t("lastUpdated")}:</strong>{" "}
              {new Date(content.updatedAt).toLocaleDateString()}
            </div>
            <Link
              to={`/admin/site-content/${content.id}`}
              className="inline-block text-blue-600 hover:underline mt-2"
            >
              {t("edit")}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
