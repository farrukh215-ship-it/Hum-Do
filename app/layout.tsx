import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Container from "@/components/Container";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Hum Do",
  description: "Ghar ka hisaab — husband aur wife ke liye shared income & expense tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Container>{children}</Container>
      </body>
    </html>
  );
}
