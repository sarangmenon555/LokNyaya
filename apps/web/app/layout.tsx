import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./fonts";
import "./globals.css";
import Shell from "../components/Shell";
import { LanguageProvider } from "../lib/useLanguage";

export const metadata: Metadata = {
  title: "LokNyaya: know your door, know your deadline",
  description: "Find out in seconds whether your legal claim is still in time. Free, private and open source."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#240a3a"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <Shell>{children}</Shell>
        </LanguageProvider>
      </body>
    </html>
  );
}
