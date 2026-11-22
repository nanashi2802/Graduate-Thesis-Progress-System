import type { Metadata } from "next";
import "./globals.css";

// No web font yet. DESIGN.md D-02 (font) is open. Tailwind's system font stack applies.
export const metadata: Metadata = {
  title: "PUP CpE Thesis Progress",
  description: "Thesis progress monitoring for PUP CpE graduate students",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full font-sans antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
