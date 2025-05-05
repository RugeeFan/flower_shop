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
import { GoogleOAuthProvider } from "@react-oauth/google";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getSession } from "./lib/session.server";
import { useLoaderData } from "@remix-run/react";
// app/root.tsx
import "~/i18n"; // 👈 初始化 i18next（只需引入一次）
import tailwindStyles from "./tailwind.css?url"; // ✅ 正确加载方式
import "./tailwind.css";
import "remixicon/fonts/remixicon.css";
import { prisma } from "./lib/prisma.server";
import BackToTop from "./components/store/BackToTop";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStyles },
  {
    rel: "stylesheet",
    href: "https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css",
  },
  {
    rel: "preconnect", href: "https://fonts.googleapis.com"
  },
  {
    rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous"
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap"
  },
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
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  const clientId = process.env.PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Missing PUBLIC_GOOGLE_CLIENT_ID in environment");

  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
  }

  return json({ user, clientId });
}


export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const { user, clientId } = useLoaderData<typeof loader>();

  const appContent = (
    <>
      {!isAdminRoute && <Header />}
      <BackToTop />
      <Outlet />
      {!isAdminRoute && <Footer />}
    </>
  );

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Layout>{appContent}</Layout>
    </GoogleOAuthProvider>
  );
}



