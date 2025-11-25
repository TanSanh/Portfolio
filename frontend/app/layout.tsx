import type { Metadata } from "next";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "react-hot-toast";
import { FallingEffects } from "@/components/FallingEffects";
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
    icon: "/assets/logo.png",
    apple: "/assets/logo.png",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,500,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} font-display bg-background-dark text-text-dark-primary antialiased`}
      >
        <AuthProvider>
          <SmoothScrollProvider>
            <FallingEffects type="stars" color="#22d3ee" intensity="low" />
            {/* <FallingEffects type="snow" color="#22d3ee" intensity="low" /> */}
            {/* <FallingEffects type="flowers" color="#22d3ee" intensity="low" /> */}
            {/* <FallingEffects type="rain" color="#22d3ee" intensity="low" /> */}
            {/* <FallingEffects type="leaves" color="#22d3ee" intensity="low" /> */}
            {/* <FallingEffects type="bubbles" color="#22d3ee" intensity="low" /> */}
            {/* <FallingEffects type="confetti" color="#22d3ee" intensity="low" /> */}
            {children}
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
