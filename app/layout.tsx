import "./globals.css";

export const metadata = {
  title: "Controlo de Produção",
  description: "Gestão de produtores e rastreabilidade",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
