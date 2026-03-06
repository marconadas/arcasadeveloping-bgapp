import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neptune View | Tactical Maritime Monitor",
  description: "Advanced real-time maritime monitoring for Angola EEZ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" className="dark">
      <body
        className={`${spaceGrotesk.variable} antialiased selection:bg-neptune-blue/30`}
      >
        {children}
      </body>
    </html>
  );
}
