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
  metadataBase: new URL("https://creditprepayment.vercel.app"),
  title: "취업자격증 발급비 카드결제",
  description: "한평생 자격증 발급비 카드결제 사이트",
  openGraph: {
    title: "취업자격증 발급비 카드결제",
    description: "한평생 자격증 발급비 카드결제 사이트",
    url: "https://creditprepayment.vercel.app",
    siteName: "한평생교육원",
    images: [
      {
        url: "https://creditprepayment.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "한평생 자격증 발급비 카드결제 사이트",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "취업자격증 발급비 카드결제",
    description: "한평생 자격증 발급비 카드결제 사이트",
    images: ["https://creditprepayment.vercel.app/og-image.png"],
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
