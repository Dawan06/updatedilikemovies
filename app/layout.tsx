import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

const bebasNeue = Bebas_Neue({ 
  weight: '400',
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-bebas-neue',
  preload: true,
});

export const metadata: Metadata = {
  title: "ILikeMovies - Your Personal Movie Library",
  description: "Watch and organize your favorite movies and TV shows",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://image.tmdb.org" />
          <link rel="preconnect" href="https://api.tmdb.org" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://api.tmdb.org" />
        </head>
        <body className={`${inter.variable} ${bebasNeue.variable} ${inter.className}`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
