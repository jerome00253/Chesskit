import { fenToPosition, Square, getPieces, getSquareName } from "./core";
import { TacticalAnalysisResult, TacticalPattern } from "./types";
import { detectForks } from "./patterns/forks";
import { detectPins } from "./patterns/pins";
import { detectDiscoveredAttacks } from "./patterns/discovered";
import { parseSan } from "chessops/san";
import { Chess } from "chessops/chess";
import { generateDescription } from "./describer";

export function analyzeTacticalPatterns(
  fenBefore: string,
  moveSan: string,
  fenAfter: string
): TacticalAnalysisResult {
  const themes: string[] = [];
  const patterns: TacticalPattern[] = [];
  
  const posBefore = fenToPosition(fenBefore);
  const posAfter = fenToPosition(fenAfter);
  
  if (!posBefore || !posAfter) {
      return { isTactical: false, themes: [], patterns: [], description: "" };
  }
  
  // Determine who moved
  const sideMoved = posBefore.turn; // 'white' or 'black'
  
  // Parse move to get FROM and TO
  const move = parseSan(posBefore, moveSan);
  if (!move) {
      console.warn("Analysis Failed: parseSan returned null for", moveSan, "FEN:", fenBefore);
  }

  let fromSq: Square | undefined;
  let toSq: Square | undefined;
  
  if (move && 'from' in move) {
      fromSq = (move as any).from;
      toSq = (move as any).to;
  } else if (move && 'to' in move) {
      // Drop move?
      toSq = (move as any).to;
  }
  
  // 1. Detect Forks
  if (toSq !== undefined) {
      const movedSidePieces = getPieces(posAfter, sideMoved);
      const role = movedSidePieces.has(toSq) 
        ? (posAfter.board.knight.has(toSq) ? 'knight' 
           : posAfter.board.bishop.has(toSq) ? 'bishop'
           : posAfter.board.rook.has(toSq) ? 'rook'
           : posAfter.board.queen.has(toSq) ? 'queen'
           : posAfter.board.king.has(toSq) ? 'king'
           : 'pawn')
        : 'pawn'; // Default
        
       const forks = detectForks(posAfter, toSq, role, sideMoved);
       if (forks.length > 0) {
           patterns.push(...forks);
           themes.push("Fork");
       }
  }
  
  // 2. Detect Pins (Created by the move)
  if (toSq !== undefined) {
      const pins = detectPins(posAfter, toSq, sideMoved); // Pass toSq just as reference/focus? Logic iterates all sliders.
      if (pins.length > 0) {
          patterns.push(...pins);
          themes.push("Pin");
      }
  }
  
  // 3. Discovered Attacks
  if (fromSq !== undefined) {
      const discoveries = detectDiscoveredAttacks(posAfter, fromSq, sideMoved);
      if (discoveries.length > 0) {
          patterns.push(...discoveries);
          themes.push("DiscoveredAttack");
      }
  }
  
  // 4. Checks / Capture / Promotion / Stalemate
  // posAfter is likely a Chess instance (since fenToPosition returns Chess).
  // 4. Checks / Capture / Promotion
  // posAfter is likely a Chess instance (since fenToPosition returns Chess)
  const game = posAfter as any;
  const toSqName = toSq !== undefined ? getSquareName(toSq) : undefined;
  
  if (typeof game.isCheckmate === 'function' && game.isCheckmate()) {
      themes.push("Checkmate");
      // Could add pattern if needed, but usually redundant
  } else if (typeof game.isCheck === 'function' && game.isCheck()) {
      themes.push("Check");
      if (toSqName) {
           patterns.push({ theme: "Check", squares: [toSqName] });
      }
  } else if (typeof game.isStalemate === 'function' && game.isStalemate()) {
      themes.push("Stalemate");
  } else {
     // Fallback check detection
     if (typeof game.isCheck === 'function' && game.isCheck()) {
         themes.push("Check");
          if (toSqName) {
             patterns.push({ theme: "Check", squares: [toSqName] });
          }
     }
  }

  // Basic SAN parsing
  if (moveSan.includes("x")) {
      themes.push("Capture");
      if (toSqName) {
           // We only have the capturer's position in posAfter. 
           // Can't easily get captured piece name without posBefore reference in describer.
           // Describer will render "Capture of ?" or we update template.
           patterns.push({ theme: "Capture", squares: [toSqName] });
      }
  }
  if (moveSan.includes("=")) {
      themes.push("Promotion");
      if (toSqName) {
          patterns.push({ theme: "Promotion", squares: [toSqName] });
      }
  }

  // Deduplication
  const uniqueThemes = Array.from(new Set(themes)) as any[];
  
  // Generate descriptions
  const descriptionEn = generateDescription(patterns, fenAfter, "en");
  const descriptionFr = generateDescription(patterns, fenAfter, "fr");

  return {
      isTactical: uniqueThemes.length > 0,
      themes: uniqueThemes,
      patterns,
      description: descriptionEn || "", // Default to EN for now
      descriptionEn,
      descriptionFr
  };
}
