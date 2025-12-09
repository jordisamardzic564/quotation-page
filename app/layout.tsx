import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Unbounded, Inconsolata, Lato } from "next/font/google";
import "./globals.css";

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
  title: "Korbach Forged - Exclusive Configuration",
  description: "Your verified vehicle configuration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${unbounded.variable} ${inconsolata.variable} ${lato.variable} antialiased text-[#EDEDED] selection:bg-[#D4F846] selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}
