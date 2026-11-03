import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flowerful Studio",
  description: "Create on-brand Flowerful social images in five simple steps.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
