import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "@/components/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://gacha-kuji-map.vercel.app",
  ),
  title: "가챠·쿠지 맵",
  description:
    "가챠(캡슐 토이)와 이치방쿠지 매장 위치를 한눈에! 주변 매장을 찾아보세요.",
  openGraph: {
    title: "가챠·쿠지 맵",
    description:
      "가챠(캡슐 토이)와 이치방쿠지 매장 위치를 한눈에! 주변 매장을 찾아보세요.",
    url: "/",
    siteName: "가챠·쿠지 맵",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/main-image.png",
        width: 1200,
        height: 630,
        alt: "가챠·쿠지 맵",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "가챠·쿠지 맵",
    description:
      "가챠(캡슐 토이)와 이치방쿠지 매장 위치를 한눈에! 주변 매장을 찾아보세요.",
    images: ["/main-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
