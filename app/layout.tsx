import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og-relatune.png", metadataBase).toString();

  return {
    metadataBase,
    title: "Relatune — Personality-aware care for couples",
    description: "Free personality reflections, shared care maps, and a weekly PAIR Note that helps couples care for each other well.",
    applicationName: "Relatune",
    openGraph: {
      title: "Relatune",
      description: "Know each other better. Love each other better.",
      type: "website",
      images: [{ url: socialImage, width: 1731, height: 909, alt: "Relatune — Know each other better. Love each other better." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Relatune",
      description: "Know each other better. Love each other better.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
