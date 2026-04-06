import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { LayoutProvider } from "@/context/LayoutContext";

export const metadata: Metadata = {
  title: "产品 Sense 训练系统",
  description: "每日15-30分钟，系统训练产品感和判断力",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,   // 禁止双指缩放，防止 iOS 输入框触发
  userScalable: false,
  viewportFit: "cover",  // 支持刘海屏 safe-area
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <LayoutProvider>
          <AppShell>{children}</AppShell>
        </LayoutProvider>
      </body>
    </html>
  );
}

