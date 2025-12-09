import { Link as MuiLink } from "@mui/material";
import NextLink from "next/link";
import { ReactNode } from "react";
import { useRouter } from "next/router";
import { defaultLocale } from "@/lib/i18n";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const router = useRouter();
  // Fallback sûr pour le locale, similaire à _app.tsx
  const currentLocale = router.query.locale || defaultLocale;

  // Si le lien est externe ou commence déjà par une locale (ex: via un switcher), on ne touche pas
  let finalHref = href;
  if (href.startsWith("/") && !href.startsWith("http")) {
    // Simplification: on suppose que si ça commence par /, c'est un lien interne vers une page localisée
    // On évite de dupliquer la locale si elle est déjà là
    // On vérifie aussi que currentLocale n'est pas littéralement "[locale]" (ce qui peut arriver si le router n'est pas prêt ou context SSG)
    const validLocale =
      currentLocale === "[locale]" || !currentLocale
        ? defaultLocale
        : currentLocale;
    finalHref = `/${validLocale}${href === "/" ? "" : href}`;
  }

  return (
    <MuiLink
      component={NextLink}
      href={finalHref}
      underline="none"
      color="inherit"
      sx={{ width: "100%" }}
    >
      {children}
    </MuiLink>
  );
}
