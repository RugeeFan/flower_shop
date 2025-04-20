import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useRouteError,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import Header from "./components/store/header";
import Footer from "./components/store/footer";
import { ErrorPage } from "./components/ErrorPage";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { useDropdownStore } from "~/lib/useDropdownStore";

import "./tailwind.css";
import "remixicon/fonts/remixicon.css";
export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap",
  },
  // {
  //   rel: "stylesheet",
  //   href: "../app/tailwind.css",
  // },
  // {
  //   rel: "stylesheet",
  //   href: "../node_modules/remixicon/fonts/remixicon.css",
  // },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster richColors position="top-center" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function CatchBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <ErrorPage status={error.status} message={error.statusText} />;
  }
  return <ErrorPage message="未知错误" />;
}

export function ErrorBoundary({ error }: { error: unknown }) {
  console.error("💥 Uncaught error:", error);
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "未知错误";
  return <ErrorPage message={message} />;
}

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const close = useDropdownStore((state) => state.close);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      close(); // 点击任何地方关闭菜单
    };
    document.body.addEventListener("click", handleClickOutside);
    return () => document.body.removeEventListener("click", handleClickOutside);
  }, [close]);

  return (
    <>
      {!isAdminRoute && <Header />}
      <Outlet />
      {!isAdminRoute && <Footer />}
    </>
  );
}
