import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "+Vida | Cartão de Membresía",
  description: "Adquira o seu cartão de membresía e tenha acesso a benefícios exclusivos na clínica.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mais-vida.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className="min-h-screen bg-white antialiased">
        {children}
      </body>
    </html>
  );
}
