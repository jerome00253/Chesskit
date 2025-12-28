import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { AppProps } from "next/app";
import Layout from "@/sections/layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { useRouter } from "next/router";
import { defaultLocale } from "@/lib/i18n";
import { SessionProvider } from "next-auth/react";
import { usePreferredLocaleRedirect } from "@/hooks/usePreferredLocaleRedirect";
import { useState, useEffect } from "react";

const queryClient = new QueryClient();

function PreferredLocaleHandler() {
  usePreferredLocaleRedirect();
  return null;
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loadedMessages, setLoadedMessages] = useState<
    Record<string, unknown> | null
  >(null);

  // En static export, router.locale peut être undefined, on utilise celui de pageProps ou un fallback
  const locale = pageProps.locale || router.locale || defaultLocale;
  const messages = pageProps.messages || loadedMessages;

  // Load messages dynamically if not in pageProps
  useEffect(() => {
    if (!pageProps.messages && locale) {
      import(`../messages/${locale}.json`)
        .then((mod) => setLoadedMessages(mod.default))
        .catch((err) => {
          console.error("Failed to load messages for locale:", locale, err);
          // Fallback to default locale
          import(`../messages/${defaultLocale}.json`)
            .then((mod) => setLoadedMessages(mod.default))
            .catch((e) => console.error("Failed to load default messages:", e));
        });
    }
  }, [locale, pageProps.messages]);

  return (
    <SessionProvider session={pageProps.session}>
      <PreferredLocaleHandler />
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="Europe/Paris"
        now={new Date()}
        onError={(error) => {
          console.error("NextIntl Client Error:", error);
          // 'ev' might be part of the error object or code
          if (error.code === "MISSING_MESSAGE") {
            console.warn(`Missing translation for key: ${error.message}`);
          }
        }}
      >
        <QueryClientProvider client={queryClient}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </QueryClientProvider>
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
