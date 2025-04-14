import { Link } from "@remix-run/react";

export function ErrorPage({ status, message }: { status?: number; message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold text-red-600">出错了</h1>
      {status && (
        <p className="text-xl mt-2">
          错误代码: <span className="font-mono">{status}</span>
        </p>
      )}
      {message && <p className="mt-2 text-gray-700">{message}</p>}

      <Link
        to="/"
        className="mt-6 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        返回首页
      </Link>
    </div>
  );
}
