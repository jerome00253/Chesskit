import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { isValidLocale, type SupportedLocale } from "@/types/locale";

/**
 * Hook pour gérer la redirection automatique vers la langue préférée de l'utilisateur
 * Vérifie la langue préférée sauvegardée en BDD et redirige si nécessaire
 */
export function usePreferredLocaleRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    // Ne rien faire pendant le chargement ou si pas connecté
    if (status === "loading" || !session) return;

    // Éviter les redirections multiples
    if (hasRedirectedRef.current || isFetchingRef.current) return;

    // Récupérer la locale actuelle depuis l'URL réelle (asPath)
    // router.pathname donne /[locale]/profile, ce qui ne nous aide pas
    const pathParts = router.asPath.split("/");
    const currentLocale = pathParts[1].split("?")[0]; // Gérer les query params éventuels

    // Si on est déjà sur une page sans locale (rare), ignorer
    if (!currentLocale || !isValidLocale(currentLocale)) return;

    // Récupérer la langue préférée de l'utilisateur
    const fetchAndRedirect = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const res = await fetch("/api/user/profile/");
        if (!res.ok) return;

        const data = await res.json();
        if (!data) return;

        const preferredLocale = data.preferredLocale as SupportedLocale;

        // Si pas de préférence sauvegardée ou déjà sur la bonne langue, ne rien faire
        if (!preferredLocale || preferredLocale === currentLocale) return;

        // Vérifier que c'est une locale valide
        if (!isValidLocale(preferredLocale)) return;

        // Marquer qu'on a déjà redirigé
        hasRedirectedRef.current = true;

        // Construire le nouveau chemin avec la langue préférée
        const currentPath = router.asPath;
        const newPath = currentPath.replace(
          `/${currentLocale}`,
          `/${preferredLocale}`
        );

        // Rediriger vers la langue préférée (sans recharger la page)
        await router.push(newPath, undefined, { shallow: false });
      } catch (error) {
        console.error("Failed to fetch preferred locale:", error);
      } finally {
        isFetchingRef.current = false;
      }
    };

    fetchAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router.pathname]); // Seulement dépendant du pathname, pas asPath
}
