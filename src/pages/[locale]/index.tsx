import { useEffect } from "react";
import { useRouter } from "next/router";

export default function LocaleIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const locale = router.query.locale || "en";
    router.replace(`/${locale}/dashboard`);
  }, [router]);

  return null;
}
