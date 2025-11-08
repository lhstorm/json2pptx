import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "JSON2PPTX - Create PowerPoint from JSON",
  description: "Turn structured data into professional presentations instantly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
