import "./globals.css";

export const metadata = {
  title: "AI Mock Interview Platform",
  description: "AI-powered video mock interview app"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
