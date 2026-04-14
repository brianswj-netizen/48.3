import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import FontSizeApplier from "@/components/FontSizeApplier";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Survival Crew",
  description: "건국대 부동산대학원 AI 스터디 커뮤니티",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Survival Crew",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1B1F3B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full`}>
      <body className="h-full">
        <FontSizeApplier />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
