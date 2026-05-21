import { KeycloakProvider } from "../src/providers/KeycloakProvider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning is necessary because browser
    // extensions often modify the html/body attributes
    // (like adding 'translated-ltr' or changing lang)
    <html lang="am" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased">
        <KeycloakProvider>{children}</KeycloakProvider>
      </body>
    </html>
  );
}
