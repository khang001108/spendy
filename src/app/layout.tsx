import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Spendy 💰 - Quản lý chi tiêu",
  description: "Theo dõi thu chi, đặt mục tiêu tiết kiệm, thống kê tài chính cá nhân",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
