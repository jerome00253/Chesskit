export const SUPPORTED_LOCALES = [
  "en",
  "fr",
  "de",
  "it",
  "pt",
  "es",
  "nl",
] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<
  SupportedLocale,
  { flag: string; name: string }
> = {
  en: { flag: "🇬🇧", name: "English" },
  fr: { flag: "🇫🇷", name: "Français" },
  de: { flag: "🇩🇪", name: "Deutsch" },
  it: { flag: "🇮🇹", name: "Italiano" },
  pt: { flag: "🇵🇹", name: "Português" },
  es: { flag: "🇪🇸", name: "Español" },
  nl: { flag: "🇳🇱", name: "Nederlands" },
};

export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}
