import type { Metadata } from "next";
import { Lustria, DM_Sans, Martian_Mono } from "next/font/google";
import "./globals.css";

const lustria = Lustria({
  variable: "--font-lustria",
  weight: "400",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Create and share a wishlist for any event — no account needed.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${lustria.variable} ${dmSans.variable} ${martianMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-slate font-sans">
        {children}
      </body>
    </html>
  );
}
