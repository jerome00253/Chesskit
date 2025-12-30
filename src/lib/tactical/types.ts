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

export interface TacticalAnalysisResult {
  isTactical: boolean;
  themes: TacticalTheme[];
  patterns: TacticalPattern[];
  description: string;
  descriptionEn?: string;
  descriptionFr?: string;
}
