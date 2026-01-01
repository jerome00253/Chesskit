export type TacticalTheme =
  | "Fork"
  | "Pin"
  | "Skewer"
  | "DiscoveredAttack"
  | "DiscoveredCheck"
  | "DoubleCheck"
  | "BackRankMate"
  | "HangingPiece"
  | "Deflection"
  | "Decoy"
  | "XRay"
  | "Overloaded"
  | "Underdefended"
  | "AttackedByLesser"
  | "AbsolutePin"
  | "RelativePin"
  | "Unpinning"
  | "Promotion"
  | "Zugzwang"
  | "Checkmate"
  | "Check"
  | "Stalemate"
  | "Capture"
  | "MaterialLoss"
  | "Blunder"
  | "Brilliant"
  | "Castling"
  | "InsufficientMaterial"
  | "Interference";

export interface TacticalPattern {
  theme: TacticalTheme;
  squares: string[]; // Key squares involved (e.g., pinned piece, pinning piece, king)
  pieces?: string[]; // Piece roles involved (e.g., "Knight", "Queen", "King")
  description?: string; // Optional specific description
}

  isTactical: boolean;
  themes: TacticalTheme[];
  patterns: TacticalPattern[];
  description: string;  // JSON i18n key
}
