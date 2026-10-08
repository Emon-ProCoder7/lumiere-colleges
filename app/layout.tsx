import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumiere College Group — Live Operations",
  description: "Live voicemail and call activity for the Lumiere college group, by college.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
