import { TacticalPattern } from "./types";

/**
 * Generate an i18n description key with parameters for a tactical pattern
 */
export function generateI18nDescription(pattern: TacticalPattern): string {
  const params: Record<string, string> = {};
  
  // Map role to piece name key
  const getPieceKey = (role: string): string => {
    const roleMap: Record<string, string> = {
      'pawn': 'pawn',
      'knight': 'knight',
      'bishop': 'bishop',
      'rook': 'rook',
      'queen': 'queen',
      'king': 'king'
    };
    return roleMap[role.toLowerCase()] || role.toLowerCase();
  };

  let key = "";

  switch (pattern.theme) {
    case "Fork":
      if (pattern.pieces && pattern.pieces.length >= 3 && pattern.squares && pattern.squares.length >= 3) {
        key = "Tactical.descriptions.fork";
        params.piece = `Tactical.pieces.${getPieceKey(pattern.pieces[0])}`;
        params.square = pattern.squares[0];
        params.target1 = `Tactical.pieces.${getPieceKey(pattern.pieces[1])}`;
        params.target1Square = pattern.squares[1];
        params.target2 = `Tactical.pieces.${getPieceKey(pattern.pieces[2])}`;
        params.target2Square = pattern.squares[2];
      }
      break;

    case "Pin":
      if (pattern.squares.length >= 3) {
        key = "Tactical.descriptions.pin";
        params.piece = `Tactical.pieces.${getPieceKey(pattern.pieces?.[0] || 'piece')}`;
        params.square = pattern.squares[0] || "";
        params.pinnedPiece = `Tactical.pieces.${getPieceKey(pattern.pieces?.[1] || 'piece')}`;
        params.pinnedSquare = pattern.squares[1] || "";
        params.targetPiece = `Tactical.pieces.${getPieceKey(pattern.pieces?.[2] || 'piece')}`;
        params.targetSquare = pattern.squares[2] || "";
      }
      break;

    case "Skewer":
      if (pattern.squares.length >= 3) {
        key = "Tactical.descriptions.skewer";
        params.piece = `Tactical.pieces.${getPieceKey(pattern.pieces?.[0] || 'piece')}`;
        params.square = pattern.squares[0] || "";
        params.valuablePiece = `Tactical.pieces.${getPieceKey(pattern.pieces?.[1] || 'piece')}`;
        params.valuableSquare = pattern.squares[1] || "";
        params.lesserPiece = `Tactical.pieces.${getPieceKey(pattern.pieces?.[2] || 'piece')}`;
        params.lesserSquare = pattern.squares[2] || "";
      }
      break;

    case "DiscoveredAttack":
      if (pattern.squares.length >= 3) {
        key = "Tactical.descriptions.discovered_attack";
        params.movedPiece = `Tactical.pieces.${getPieceKey(pattern.pieces?.[0] || 'piece')}`;
        params.fromSquare = pattern.squares[0];
        params.attackingPiece = `Tactical.pieces.${getPieceKey(pattern.pieces?.[1] || 'piece')}`;
        params.attackingSquare = pattern.squares[1];
        params.targetPiece = `Tactical.pieces.${getPieceKey(pattern.pieces?.[2] || 'piece')}`;
        params.targetSquare = pattern.squares[2];
      }
      break;

    case "DiscoveredCheck":
      if (pattern.squares.length >= 3) {
        key = "Tactical.descriptions.discovered_check";
        params.movedPiece = `Tactical.pieces.${getPieceKey(pattern.pieces?.[0] || 'piece')}`;
        params.fromSquare = pattern.squares[0];
        params.attackingPiece = `Tactical.pieces.${getPieceKey(pattern.pieces?.[1] || 'piece')}`;
        params.attackingSquare = pattern.squares[1];
        // Target is implicit (King) so we don't strictly need it in the string, but we can pass it
        params.targetSquare = pattern.squares[2];
      }
      break;

    case "DoubleCheck":
      if (pattern.squares.length >= 2) {
        key = "Tactical.descriptions.double_check";
        params.square1 = pattern.squares[0] || "";
        params.square2 = pattern.squares[1] || "";
      }
      break;

    case "HangingPiece":
      if (pattern.pieces && pattern.pieces.length >= 1 && pattern.squares && pattern.squares.length >= 1) {
        key = "Tactical.descriptions.hanging_piece";
        params.piece = `Tactical.pieces.${getPieceKey(pattern.pieces[0])}`;
        params.square = pattern.squares[0];
      }
      break;

    case "Overloaded":
      if (pattern.pieces && pattern.pieces.length >= 3 && pattern.squares && pattern.squares.length >= 3) {
        key = "Tactical.descriptions.overloaded";
        params.piece = `Tactical.pieces.${getPieceKey(pattern.pieces[0])}`;
        params.square = pattern.squares[0];
        params.target1 = `Tactical.pieces.${getPieceKey(pattern.pieces[1])}`;
        params.target1Square = pattern.squares[1];
        params.target2 = `Tactical.pieces.${getPieceKey(pattern.pieces[2])}`;
        params.target2Square = pattern.squares[2];
      }
      break;

    case "Underdefended":
      if (pattern.pieces && pattern.pieces.length >= 1 && pattern.squares && pattern.squares.length >= 1) {
        key = "Tactical.descriptions.underdefended";
        params.piece = `Tactical.pieces.${getPieceKey(pattern.pieces[0])}`;
        params.square = pattern.squares[0];
        params.attackers = (pattern as any).attackerCount?.toString() || "?";
        params.defenders = (pattern as any).defenderCount?.toString() || "?";
      }
      break;

    case "AttackedByLesser":
      if (pattern.pieces && pattern.pieces.length >= 2 && pattern.squares && pattern.squares.length >= 2) {
        key = "Tactical.descriptions.attacked_by_lesser";
        params.targetPiece = `Tactical.pieces.${getPieceKey(pattern.pieces[0])}`;
        params.targetSquare = pattern.squares[0];
        params.attackerPiece = `Tactical.pieces.${getPieceKey(pattern.pieces[1])}`;
        params.attackerSquare = pattern.squares[1];
      }
      break;


    case "Interference":
      if (pattern.pieces && pattern.pieces.length >= 2 && pattern.squares && pattern.squares.length >= 2) {
        key = "Tactical.descriptions.interference";
        params.piece = `Tactical.pieces.${getPieceKey(pattern.pieces[0])}`;
        params.square = pattern.squares[0];
        params.blockedPiece = `Tactical.pieces.${getPieceKey(pattern.pieces[1])}`;
        params.blockedSquare = pattern.squares[1];
      }
      break;

    case "Check":
      if (pattern.pieces && pattern.pieces.length >= 1 && pattern.squares && pattern.squares.length >= 1) {
        key = "Tactical.descriptions.check";
        params.piece = `Tactical.pieces.${getPieceKey(pattern.pieces[0])}`;
        params.square = pattern.squares[0];
      }
      break;

    case "Checkmate":
      key = "Tactical.descriptions.checkmate";
      break;

    case "Stalemate":
      key = "Tactical.descriptions.stalemate";
      break;

    case "Capture":
      if (pattern.squares.length >= 1) {
        key = "Tactical.descriptions.capture";
        params.square = pattern.squares[0] || "";
      }
      break;

    case "Promotion":
      if (pattern.squares.length >= 1) {
        key = "Tactical.descriptions.promotion";
        params.square = pattern.squares[0] || "";
      }
      break;

    case "Castling":
      key = "Tactical.descriptions.castling_kingside"; // Could be refined with more context
      break;

    case "InsufficientMaterial":
      key = "Tactical.descriptions.insufficient_material";
      break;

    default:
      // Fallback: return theme name
      key = `Tactical.themes.${pattern.theme}`;
      // For other patterns or if missing info, return empty description
      return "";
  }
  
  // If we have a key, return the JSON string, otherwise return empty string
  if (!key || key === "") {
    return "";
  }
  
  return JSON.stringify({ key, params });
}

/**
 * Generates a combined i18n description from multiple patterns
 */
export function generateCombinedI18nDescription(patterns: TacticalPattern[]): string {
  if (patterns.length === 0) {
    return "";
  }

  // Generate descriptions for all patterns and join them with a space
  return patterns
    .map(pattern => generateI18nDescription(pattern))
    .filter(desc => desc && desc !== "")
    .join(" ");
}
