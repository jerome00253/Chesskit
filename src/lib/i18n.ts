import { GetStaticPropsContext } from "next";

export const defaultLocale = "en";
export const locales = ["en", "fr"];

/**
 * Récupère les messages de traduction pour une locale donnée.
 * @param locale La locale (ex: 'en', 'fr')
 * @returns Les messages JSON
 */
export async function getMessages(locale: string) {
  return (await import(`../messages/${locale}.json`)).default;
}

/**
 * Fonction helper pour générer les chemins statiques Next.js (getStaticPaths).
 * Génère des chemins pour toutes les locales supportées ('en' et 'fr').
 * @returns L'objet paths requis par Next.js
 */
export function getStaticPaths() {
  return {
    paths: locales.map((locale) => ({ params: { locale } })),
    fallback: false,
  };
}

/**
 * Fonction helper pour récupérer les props statiques Next.js (getStaticProps).
 * Charge les messages de traduction correspondants à la locale.
 * @param context Le contexte Next.js contenant les paramètres de route (locale)
 * @returns Les props passées à la page (locale, messages)
 */
export async function getStaticProps({ params }: GetStaticPropsContext) {
  const locale = (params?.locale as string) || defaultLocale;
  const messages = await getMessages(locale);

  return {
    props: {
      locale,
      messages,
    },
  };
}
