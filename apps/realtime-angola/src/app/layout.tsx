import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SWRConfig } from "swr";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Neptune Angola Real-Time | MAREDATUM",
  description: "Monitoramento marítimo em tempo real da Zona Económica Exclusiva de Angola. Dados oceanográficos, rastreamento de embarcações e previsões de IA.",
  keywords: ["Angola", "marítimo", "oceanografia", "ZEE", "embarcações", "pesca", "MAREDATUM"],
  authors: [{ name: "MAREDATUM" }],
  openGraph: {
    title: "Neptune Angola Real-Time",
    description: "Monitoramento marítimo em tempo real da ZEE de Angola",
    type: "website",
    locale: "pt_AO",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-AO" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ThemeProvider>
            <SWRConfig
              value={{
                revalidateOnFocus: true,
                revalidateOnReconnect: true,
                errorRetryInterval: 5000,
                errorRetryCount: 3,
                fetcher: async (resource, init) => {
                  const response = await fetch(resource, init);
                  if (!response.ok) {
                    throw new Error(`Request failed: ${response.status}`);
                  }
                  return response.json();
                }
              }}
            >
              {children}
            </SWRConfig>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
