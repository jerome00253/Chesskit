import { useEffect } from "react";
import { useRouter } from "next/router";
import { getStaticPaths, getStaticProps } from "@/lib/i18n";

export { getStaticPaths, getStaticProps };

export default function LocaleIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const locale = router.query.locale || "en";
    router.replace(`/${locale}/dashboard`);
  }, [router]);

  return null;
}
