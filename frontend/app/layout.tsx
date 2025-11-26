/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "react-hot-toast";
import { EffectsLayer } from "@/components/client/EffectsLayer";
import { ChatWidgetPortal } from "@/components/client/ChatWidgetPortal";
import { inter } from "./fonts";

export const metadata: Metadata = {
  title: "Portfolio-TanSanh",
  description:
    "Lập trình viên backend chuyên phát triển các hệ thống mạnh mẽ, an toàn và hiệu quả. Xây dựng APIs, quản lý database và tối ưu hóa hiệu suất hệ thống.",
  keywords: [
    "portfolio",
    "backend",
    "API",
    "database",
    "lập trình",
    "developer",
    "NestJS",
    "Node.js",
  ],
  authors: [{ name: "Backend Developer" }],
  icons: {
    icon: "/assets/logo.webp",
    apple: "/assets/logo.webp",
  },
  openGraph: {
    title: "Lập Trình Viên Backend - Portfolio",
    description:
      "Lập trình viên backend chuyên phát triển các hệ thống mạnh mẽ, an toàn và hiệu quả",
    type: "website",
    locale: "vi_VN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lập Trình Viên Backend - Portfolio",
    description:
      "Lập trình viên backend chuyên phát triển các hệ thống mạnh mẽ, an toàn và hiệu quả",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,500,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} font-display bg-background-dark text-text-dark-primary antialiased overflow-x-hidden`}
      >
        <AuthProvider>
          <SmoothScrollProvider>
            <EffectsLayer />
            {children}
            <ChatWidgetPortal />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#1b1f27",
                  color: "#f8f9fa",
                  border: "1px solid #3b4354",
                },
              }}
            />
          </SmoothScrollProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
