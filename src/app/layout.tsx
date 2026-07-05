import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HUG BRASIL | Gerador de Propostas Solares",
  description:
    "Crie propostas personalizadas para instalação de painéis solares On-Grid, Off-Grid e Híbridos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
