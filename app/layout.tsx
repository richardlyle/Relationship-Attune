import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og.png", metadataBase).toString();

  return {
    metadataBase,
    title: "Between Us — Personality quizzes for couples",
    description: "Classic personality frameworks, shared insights, and practical ways to care for each other—all in one private space.",
    applicationName: "Between Us",
    openGraph: {
      title: "Between Us",
      description: "Know each other better. Love each other better.",
      type: "website",
      images: [{ url: socialImage, width: 1733, height: 909, alt: "Between Us — Know each other better. Love each other better." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Between Us",
      description: "Know each other better. Love each other better.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
