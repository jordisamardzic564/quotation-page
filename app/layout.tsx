import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Unbounded, Inconsolata, Lato } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: 'swap',
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  display: 'swap',
});

const inconsolata = Inconsolata({
  variable: "--font-inconsolata",
  subsets: ["latin"],
  display: 'swap',
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL("https://quote.korbachforged.com"),
  title: "Korbach Forged - Exclusive Configuration",
  description: "Your verified vehicle configuration.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Korbach Forged - Exclusive Configuration",
    description: "Your verified vehicle configuration.",
    url: "/",
    siteName: "Korbach Forged",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Korbach Forged logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Korbach Forged - Exclusive Configuration",
    description: "Your verified vehicle configuration.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${unbounded.variable} ${inconsolata.variable} ${lato.variable} antialiased text-[#EDEDED] selection:bg-[#D4F846] selection:text-black bg-background`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
