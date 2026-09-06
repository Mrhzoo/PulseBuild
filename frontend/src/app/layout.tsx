import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseBuild",
  description: "Morning briefing for SME contractors. Email is the channel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="top">
          <strong>PULSEBUILD</strong>
          <span className="muted">Morning briefing by email</span>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
