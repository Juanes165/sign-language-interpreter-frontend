import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Una voz para tus manos",
  description: "Una app para la detección y traducción de Lengua de Señas Colombiana",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script id="theme-init" strategy="beforeInteractive">
          {`
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
              document.documentElement.classList.toggle('dark', savedTheme === 'dark');
            }
          `}
        </script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
