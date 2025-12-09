import { openings } from "../src/data/openings";
import * as fs from "fs";
import * as path from "path";

/**
 * Fonction de traduction automatique des noms d'ouvertures
 */
const translateOpening = (name: string): string => {
  return (
    name
      // Termes principaux
      .replace(/Opening/g, "Ouverture")
      .replace(/Defense/g, "Défense")
      .replace(/Defence/g, "Défense")
      .replace(/Game/g, "Partie")
      .replace(/Attack/g, "Attaque")
      .replace(/Variation/g, "Variante")
      .replace(/System/g, "Système")
      .replace(/Formation/g, "Formation")
      .replace(/Line/g, "Ligne")
      .replace(/Main Line/g, "Ligne principale")

      // Gambit et contre-gambit
      .replace(/Countergambit/g, "Contre-gambit")
      .replace(/Gambit/g, "Gambit")

      // Accepté/Refusé
      .replace(/Declined/g, "Refusé")
      .replace(/Refused/g, "Refusé")
      .replace(/Accepted/g, "Accepté")

      // Styles de jeu
      .replace(/Classical/g, "Classique")
      .replace(/Modern/g, "Moderne")
      .replace(/Reversed/g, "Inversé")
      .replace(/Reverse/g, "Inversé")
      .replace(/Advanced/g, "Avancé")
      .replace(/Symmetrical/g, "Symétrique")

      // Origines géographiques et culturelles
      .replace(/Indian/g, "Indienne")
      .replace(/Dutch/g, "Hollandaise")
      .replace(/Sicilian/g, "Sicilienne")
      .replace(/French/g, "Française")
      .replace(/English/g, "Anglaise")
      .replace(/Spanish/g, "Espagnole")
      .replace(/Italian/g, "Italienne")
      .replace(/Scandinavian/g, "Scandinave")
      .replace(/Polish/g, "Polonaise")
      .replace(/Hungarian/g, "Hongroise")
      .replace(/Czech/g, "Tchèque")
      .replace(/German/g, "Allemande")
      .replace(/Russian/g, "Russe")

      // Pièces d'échecs
      .replace(/Knights/g, "Cavaliers")
      .replace(/Knight/g, "Cavalier")
      .replace(/Bishops/g, "Fous")
      .replace(/Bishop/g, "Fou")
      .replace(/Rooks/g, "Tours")
      .replace(/Rook/g, "Tour")
      .replace(/Queen/g, "Dame")
      .replace(/King/g, "Roi")
      .replace(/Pawns/g, "Pions")
      .replace(/Pawn/g, "Pion")

      // Côtés de l'échiquier
      .replace(/Kingside/g, "Flanc roi")
      .replace(/Queenside/g, "Flanc dame")
      .replace(/Wing/g, "Aile")
      .replace(/Center/g, "Centre")
      .replace(/Centre/g, "Centre")

      // Fianchetto
      .replace(/Fianchetto/g, "Fianchetto")

      // Termes tactiques
      .replace(/Exchange/g, "Échange")
      .replace(/Trap/g, "Piège")
      .replace(/Spike/g, "Pointe")
      .replace(/Fork/g, "Fourchette")
      .replace(/Pin/g, "Clouage")

      // Termes spécifiques
      .replace(/Two Knights/g, "Deux Cavaliers")
      .replace(/Four Knights/g, "Quatre Cavaliers")
      .replace(/Three Knights/g, "Trois Cavaliers")
      .replace(/Double/g, "Double")
      .replace(/Special/g, "Spécial")
      .replace(/Invitation/g, "Invitation")
  );
};

/**
 * Génère le fichier de traductions
 */
const generateTranslations = () => {
  console.log(`🚀 Génération des traductions pour ${openings.length} ouvertures...`);

  // Créer un objet de traductions
  const translations: Record<string, string> = {};

  openings.forEach((opening) => {
    const translated = translateOpening(opening.name);
    translations[opening.name] = translated;
  });

  // Générer le contenu du fichier TypeScript
  const fileContent = `/**
 * Traductions françaises des noms d'ouvertures d'échecs
 * Généré automatiquement le ${new Date().toLocaleDateString("fr-FR")}
 * 
 * Total: ${openings.length} ouvertures
 */

export const openingsFr: Record<string, string> = ${JSON.stringify(translations, null, 2)};
`;

  // Écrire le fichier
  const outputPath = path.join(__dirname, "../src/data/openings-fr.ts");
  fs.writeFileSync(outputPath, fileContent, "utf-8");

  console.log(`✅ Fichier généré avec succès: ${outputPath}`);
  console.log(`📊 Nombre de traductions: ${Object.keys(translations).length}`);

  // Afficher quelques exemples
  console.log("\n📝 Exemples de traductions:");
  const examples = Object.entries(translations).slice(0, 10);
  examples.forEach(([en, fr]) => {
    console.log(`   "${en}" → "${fr}"`);
  });
};

// Exécuter
generateTranslations();
