import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/support/Toast";
import { LayoutContent } from "@/components/layout/LayoutContent";

export const metadata: Metadata = {
  title: "SPMI Command Center",
  description: "Sistem dokumentasi implementasi SPMI berbasis PPEPP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" type="image/png" sizes="16x16" href="/envato/images/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/envato/vendor/jqvmap/css/jqvmap.min.css" />
        <link rel="stylesheet" href="/envato/vendor/chartist/css/chartist.min.css" />
        <link rel="stylesheet" href="/envato/vendor/bootstrap-select/dist/css/bootstrap-select.min.css" />
        <link className="main-css" rel="stylesheet" href="/envato/css/style.css" />
        <style dangerouslySetInnerHTML={{__html: `
          .metismenu .nav-text {
            font-size: 0.95rem !important;
          }
        `}} />
      </head>
      <body>
        <div id="preloader" style={{ display: "none" }}>
          <div className="sk-three-bounce">
            <div className="sk-child sk-bounce1"></div>
            <div className="sk-child sk-bounce2"></div>
            <div className="sk-child sk-bounce3"></div>
          </div>
        </div>

        <ToastProvider>
          <LayoutContent>{children}</LayoutContent>
        </ToastProvider>
      </body>
    </html>
  );
}
