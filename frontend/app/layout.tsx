import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OvenMind — Control Room",
  description: "Agentic intelligence layer for industrial bakeries",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
