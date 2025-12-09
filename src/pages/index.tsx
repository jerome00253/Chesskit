import { useEffect } from "react";
import { useRouter } from "next/router";
import { defaultLocale } from "@/lib/i18n";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Basic detection or fallback to default
    // For static export, we can't do server-side detection easily
    // We just redirect to default locale or detect browser language if we wanted to be fancy
    const targetLocale = defaultLocale;
    router.replace(`/${targetLocale}`);
  }, [router]);

  return null;
}
