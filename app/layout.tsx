import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '../styles/base.css'
import '../styles/layout.css'
import '../styles/components.css'
import DaumPostcodeScript from '../components/DaumPostcodeScript';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "취업자격증 발급비 선납 서비스",
  description: "취업자격증 발급비 선납 웹사이트",
  openGraph: {
    title: "취업자격증 발급비 선납 서비스",
    description: "취업자격증 발급비 선납 웹사이트",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "취업자격증 발급비 선납 서비스 사이트",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "취업자격증 발급비 선납 서비스 사이트",
    description: "취업자격증 발급비 선납 웹사이트",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DaumPostcodeScript />
        {children}
      </body>
    </html>
  );
}
