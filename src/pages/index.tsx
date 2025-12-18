import { useEffect } from "react";
import { useRouter } from "next/router";
import { defaultLocale } from "@/lib/i18n";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Basic detection or fallback to default
    // For static export, we can't do server-side detection easily
    // We just redirect to default locale dashboard
    const targetLocale = defaultLocale;
    router.replace(`/${targetLocale}/dashboard`);
  }, [router]);

  return null;
}
