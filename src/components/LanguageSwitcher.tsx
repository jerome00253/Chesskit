// import { useRouter } from "next/router";
import { MenuItem, Select, SelectChangeEvent, Box } from "@mui/material";

/**
 * Composant pour changer de langue.
 * Affiche un menu déroulant avec des drapeaux pour sélectionner la langue (FR/EN).
 */
export default function LanguageSwitcher() {
  // const router = useRouter(); // Unused in static mode
  // const { locale, pathname, asPath, query } = router;

  // Note: Avec next-intl et le routing personnalisé pour l'export statique,
  // on devra peut-être ajuster la logique de changement de page si on n'utilise pas le router par défaut de Next.js i18n.
  // Mais pour l'instant, faisons au plus simple compatible avec le router standard si on l'utilisait.
  // SI on utilise des pages /[locale]/..., on doit rediriger manuellement.

  const handleStaticChange = (event: SelectChangeEvent) => {
    const nextLocale = event.target.value;
    // On suppose que l'URL est de la forme /[locale]/...
    // On remplace le segment de locale actuel par le nouveau
    // Ceci est une implémentation simplifiée pour notre structure /[locale]

    // Si on est à la racine (redirigé) ou sur une page déjà préfixée
    // window.location.href est plus sûr pour un rechargement complet propre en static export sans middleware complexe

    const currentPath = window.location.pathname;
    let newPath = currentPath;

    if (currentPath.startsWith("/en")) {
      newPath = currentPath.replace("/en", `/${nextLocale}`);
    } else if (currentPath.startsWith("/fr")) {
      newPath = currentPath.replace("/fr", `/${nextLocale}`);
    } else {
      // Fallback si pas de préfixe (ex: root)
      newPath = `/${nextLocale}${currentPath}`;
    }

    // Nettoyage des doubles slashs éventuels
    newPath = newPath.replace("//", "/");

    window.location.href = newPath;
  };

  // Déterminer la locale actuelle basé sur l'URL car router.locale peut ne pas être défini en static export pur sans config i18n standard
  const currentLocale =
    typeof window !== "undefined" && window.location.pathname.startsWith("/fr")
      ? "fr"
      : "en";

  return (
    <Box sx={{ minWidth: 120 }}>
      <Select
        value={currentLocale}
        onChange={handleStaticChange}
        size="small"
        sx={{
          color: "inherit",
          "& .MuiSelect-icon": { color: "inherit" },
          "& .MuiOutlinedInput-notchedOutline": { border: "none" },
        }}
        renderValue={(value) => (
          <Box
            sx={{ display: "flex", alignItems: "center", fontSize: "1.5rem" }}
          >
            {value === "en" ? "🇬🇧" : "🇫🇷"}
          </Box>
        )}
      >
        <MenuItem value="en">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span style={{ fontSize: "1.2rem" }}>🇬🇧</span>
            <span>English</span>
          </Box>
        </MenuItem>
        <MenuItem value="fr">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span style={{ fontSize: "1.2rem" }}>🇫🇷</span>
            <span>Français</span>
          </Box>
        </MenuItem>
      </Select>
    </Box>
  );
}
