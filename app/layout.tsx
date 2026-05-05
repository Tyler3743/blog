import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Minimalist Blog",
  description: "A simple Next.js and MongoDB blog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
