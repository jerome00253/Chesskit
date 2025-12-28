import { TacticalPattern, TacticalTheme } from "./types";
import { Chess } from "chess.js";

type Locale = "en" | "fr";

const PIECE_NAMES: Record<Locale, Record<string, string>> = {
  en: {
    p: "Pawn",
    n: "Knight",
    b: "Bishop",
    r: "Rook",
    q: "Queen",
    k: "King",
  },
  fr: {
    p: "Pion",
    n: "Cavalier",
    b: "Fou",
    r: "Tour",
    q: "Dame",
    k: "Roi",
  },
};

const THEME_NAMES: Record<Locale, Record<TacticalTheme, string>> = {
  en: {
    Fork: "Fork",
    Pin: "Pin",
    Skewer: "Skewer",
    DiscoveredAttack: "Discovered Attack",
    DiscoveredCheck: "Discovered Check",
    DoubleCheck: "Double Check",
    BackRankMate: "Back Rank Mate",
    HangingPiece: "Hanging Piece",
    Deflection: "Deflection",
    Decoy: "Decoy",
    XRay: "X-Ray",
    Overloaded: "Overloaded Piece",
    Promotion: "Promotion",
    Zugzwang: "Zugzwang",
    Checkmate: "Checkmate",
    Check: "Check",
    Stalemate: "Stalemate",
    Capture: "Capture",
    MaterialLoss: "Material Loss",
    Blunder: "Blunder",
    Brilliant: "Brilliant",
  },
  fr: {
    Fork: "Fourchette",
    Pin: "Clouage",
    Skewer: "Enfilade",
    DiscoveredAttack: "Attaque à la découverte",
    DiscoveredCheck: "Échec à la découverte",
    DoubleCheck: "Double Échec",
    BackRankMate: "Mat du couloir",
    HangingPiece: "Pièce en prise",
    Deflection: "Déviation",
    Decoy: "Leurre",
    XRay: "Rayons X",
    Overloaded: "Surcharge",
    Promotion: "Promotion",
    Zugzwang: "Zugzwang",
    Checkmate: "Échec et mat",
    Check: "Échec",
    Stalemate: "Pat",
    Capture: "Capture",
    MaterialLoss: "Perte de matériel",
    Blunder: "Gaffe",
    Brilliant: "Brillant",
  },
};

const TEMPLATES: Record<
  Locale,
  Record<string, (pieces: string[], squares: string[]) => string>
> = {
  en: {
    Fork: (p, s) =>
      `${p[0]} (${s[0]}) forks ${p.slice(1).map((n, i) => `${n} (${s[i + 1]})`).join(" and ")}`,
    Pin: (p, s) => `${p[0]} (${s[0]}) is pinned to the ${p[1] || "King"} (${s[1] || "?"})`,
    Skewer: (p, s) => `${p[0]} (${s[0]}) skewer against ${p[1]} (${s[1]})`,
    DiscoveredAttack: (p, s) => `Discovered attack on ${p[1]} (${s[1]}) by ${p[0]} (${s[0]})`,
    DiscoveredCheck: (p, s) => `Discovered check from ${p[0]} (${s[0]})`,
    DoubleCheck: (_p, _s) => `Double check!`,
    BackRankMate: (_p, s) => `Back rank mate threat${s[0] ? ` at ${s[0]}` : ""}`,
    HangingPiece: (p, s) => `${p[0] || "Piece"} (${s[0]}) is hanging`,
    Check: (p, s) => `Check by ${p[0] || "piece"} (${s[0]})`,
    Capture: (p, s) => `Capture by ${p[0] || "piece"} on ${s[0]}`, // p[0] is capturer (at s[0] in fenAfter)
    Promotion: (p, s) => `Promotion to ${p[0] || "Queen"} at ${s[0]}`,
  },
  fr: {
    Fork: (p, s) =>
      `Fourchette du ${p[0]} (${s[0]}) sur ${p.slice(1).map((n, i) => `${n} (${s[i + 1]})`).join(" et ")}`,
    Pin: (p, s) => `${p[0]} (${s[0]}) est cloué sur le ${p[1] || "Roi"} (${s[1] || "?"})`,
    Skewer: (p, s) => `Enfilade contre ${p[0]} (${s[0]})`,
    DiscoveredAttack: (p, s) => `Attaque à la découverte sur ${p[1]} (${s[1]}) par ${p[0]} (${s[0]})`,
    DiscoveredCheck: (p, s) => `Échec à la découverte par ${p[0]} (${s[0]})`,
    DoubleCheck: (_p, _s) => `Double échec !`,
    BackRankMate: (_p, s) => `Menace de mat du couloir${s[0] ? ` en ${s[0]}` : ""}`,
    HangingPiece: (p, s) => `${p[0] || "Pièce"} (${s[0]}) en prise`,
    Check: (p, s) => `Échec par ${p[0] || "pièce"} (${s[0]})`,
    Capture: (p, s) => `Capture par ${p[0] || "pièce"} en ${s[0]}`,
    Promotion: (p, s) => `Promotion en ${p[0] || "Dame"} en ${s[0]}`,
  },
};

export function getPieceName(
  fen: string,
  square: string,
  locale: Locale
): string {
  const chess = new Chess(fen);
  const piece = chess.get(square as any); // square string like "e4"
  if (!piece) return "?";
  return PIECE_NAMES[locale][piece.type] || piece.type;
}

export function generatePatternDescription(
  pattern: TacticalPattern,
  fen: string, // Position where the pattern exists (usually 'posAfter')
  locale: Locale
): string {
  const themeName = THEME_NAMES[locale][pattern.theme] || pattern.theme;
  const template = TEMPLATES[locale][pattern.theme];
  
  // Resolve squares to piece names
  // Fork: squares[0] = attacker, squares[1..n] = targets
  const squares = pattern.squares;
  const pieces = squares.map(sq => getPieceName(fen, sq, locale));

  if (template) {
      try {
        return template(pieces, squares);
      } catch (e) {
          console.error("Template error", e);
          return themeName;
      }
  }

  // Fallback
  return themeName;
}

export function generateDescription(
  patterns: TacticalPattern[],
  fen: string,
  locale: Locale
): string {
  if (patterns.length === 0) return "";
  
  const descriptions = patterns.map(p => generatePatternDescription(p, fen, locale));
  
  // Join unique descriptions
  return Array.from(new Set(descriptions)).join(". ");
}
