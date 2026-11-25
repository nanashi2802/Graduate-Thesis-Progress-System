import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Poppins } from "next/font/google";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

// DESIGN.md §4 (UX-D-11 item 3). next/font self-hosts the fonts at build time, so no extra service (NFR-06).
// Poppins for titles and headings, Inter for text and UI, JetBrains Mono for data.
const display = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const text = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-text",
  display: "swap",
});
const data = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-data",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PUP CpE Thesis Progress",
  description: "Thesis progress monitoring for PUP CpE graduate students",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script sets the `dark` class and `color-scheme` before React loads (UX-D-01), so <html> differs
    // from the server markup. suppressHydrationWarning covers this one element only.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${text.variable} ${data.variable} h-full font-sans antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      {/* Browser extensions add attributes to <body> before React loads. Ignore those attribute mismatches only. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
