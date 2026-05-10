import {
  LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";

export async function loader({ }: LoaderFunctionArgs) {
  const contents = await prisma.pageContent.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return { contents };
}

export default function SiteContentAdminPage() {
  const { contents } = useLoaderData<typeof loader>();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold text-gray-800">Site Content</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 mt-6 rounded-xl">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Slug</th>
              <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Title</th>
              <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Last Updated</th>
              <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contents.map((item) => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="py-3 px-6 text-sm text-gray-700">{item.slug}</td>
                <td className="py-3 px-6 text-sm text-gray-900 font-medium">{item.title}</td>
                <td className="py-3 px-6 text-sm text-gray-500">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-6 text-sm">
                  <Link
                    to={`/admin/site-content/${item.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {contents.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-400">
                  No content available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
