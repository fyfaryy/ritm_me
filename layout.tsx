import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ритм — твой трекер привычек",
  description: "Маленькие шаги. Большие перемены. Планируй привычки, отмечай маленькие победы и следи за своим прогрессом в собственном ритме.",
  applicationName: "Ритм",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
