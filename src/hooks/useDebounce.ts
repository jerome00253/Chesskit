import { useEffect, useState } from "react";

/**
 * Hook personnalisé pour débouncer une valeur.
 *
 * Retarde la mise à jour d'une valeur jusqu'à ce qu'un certain délai se soit écoulé
 * sans changement. Utile pour optimiser les performances lors de saisies utilisateur
 * fréquentes (recherche, filtres, etc.).
 *
 * @template T - Le type de la valeur à débouncer
 * @param value - La valeur à débouncer
 * @param delayMs - Le délai en millisecondes avant la mise à jour
 * @returns La valeur débouncée
 *
 * @example
 * ```typescript
 * function SearchComponent() {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearch = useDebounce(searchTerm, 500);
 *
 *   useEffect(() => {
 *     // Cette requête ne sera exécutée que 500ms après la dernière frappe
 *     if (debouncedSearch) {
 *       fetchSearchResults(debouncedSearch);
 *     }
 *   }, [debouncedSearch]);
 *
 *   return <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />;
 * }
 * ```
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (value === debouncedValue) return;

    if (!debouncedValue) {
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs, debouncedValue]);

  return debouncedValue;
}
