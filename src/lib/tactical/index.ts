// Forces HMR Rebuild
import { fenToPosition, Square, getPieces, getSquareName } from "./core";
import { TacticalAnalysisResult, TacticalPattern } from "./types";
import { detectForks } from "./patterns/forks";
import { detectPins } from "./patterns/pins";
import { detectDiscoveredAttacks } from "./patterns/discovered";
import { parseSan } from "chessops/san";
import { detectInterference } from "./patterns/interference";
import { detectHangingPieces, detectOverloadedDefenders } from "./patterns/safety";
import { generateCombinedI18nDescription } from "./describer";

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
  
  // Determine piece role
  let movedPieceRole = 'pawn';
  if (toSq !== undefined) {
      const movedSidePieces = getPieces(posAfter, sideMoved);
      movedPieceRole = movedSidePieces.has(toSq) 
        ? (posAfter.board.knight.has(toSq) ? 'knight' 
           : posAfter.board.bishop.has(toSq) ? 'bishop'
           : posAfter.board.rook.has(toSq) ? 'rook'
           : posAfter.board.queen.has(toSq) ? 'queen'
           : posAfter.board.king.has(toSq) ? 'king'
           : 'pawn')
        : 'pawn';
  }

  // 1. Detect Forks
  if (toSq !== undefined) {
        // Reuse calculated role
       const forks = detectForks(posAfter, toSq, movedPieceRole, sideMoved);
       if (forks.length > 0) {
           patterns.push(...forks);
           themes.push("Fork");
       }
  }
  
  // 2. Detect Pins (Created by the move)
  if (toSq !== undefined) {
      const pins = detectPins(posAfter, toSq, sideMoved); 
      if (pins.length > 0) {
          patterns.push(...pins);
          themes.push("Pin");
      }
  }
  
  // 3. Discovered Attacks
  if (fromSq !== undefined) {
      const discoveries = detectDiscoveredAttacks(posAfter, fromSq, sideMoved, movedPieceRole);
      if (discoveries.length > 0) {
          patterns.push(...discoveries);
          themes.push("DiscoveredAttack");
      }
  }

  // 4. Interference
  if (toSq !== undefined) {
      const interferences = detectInterference(posAfter, toSq, sideMoved);
      if (interferences.length > 0) {
          patterns.push(...interferences);
          themes.push("Interference");
      }
  }

  // 5. Safety Issues (Hanging Pieces & Overload) on Opponent (Targets)
  // We check if the move created/exposed these weaknesses on the opponent
  const opponent = sideMoved === "white" ? "black" : "white";
  
  const hanging = detectHangingPieces(posAfter, opponent);
  if (hanging.length > 0) {
      // Filter? only new ones? For now, list them.
      patterns.push(...hanging);
      themes.push("HangingPiece");
  }

  const overloaded = detectOverloadedDefenders(posAfter, opponent);
  if (overloaded.length > 0) {
      patterns.push(...overloaded);
      themes.push("Overloaded");
  }
  
  // 4. Checks / Capture / Promotion / Stalemate
  // posAfter is likely a Chess instance (since fenToPosition returns Chess).
  // 4. Checks / Double Check
  const game = posAfter as any;
  const toSqName = toSq !== undefined ? getSquareName(toSq) : undefined;
  
  if (typeof game.isCheck === 'function' && game.isCheck()) {
      themes.push("Check");
      
      // Check for Double Check
      const checkers = (posAfter as any).checkers;
      if (checkers && typeof checkers.size === 'function' && checkers.size() >= 2) {
           themes.push("DoubleCheck");
           const squares: string[] = [];
           const pieces: string[] = [];
           
           for (const sq of checkers) {
               if (typeof sq === 'number') {
                   squares.push(getSquareName(sq));
                   // Determine piece role
                   let role = 'piece';
                   if (posAfter.board.pawn.has(sq)) role = 'pawn';
                   else if (posAfter.board.knight.has(sq)) role = 'knight';
                   else if (posAfter.board.bishop.has(sq)) role = 'bishop';
                   else if (posAfter.board.rook.has(sq)) role = 'rook';
                   else if (posAfter.board.queen.has(sq)) role = 'queen';
                   else if (posAfter.board.king.has(sq)) role = 'king';
                   pieces.push(role);
               }
           }
           patterns.push({ theme: "DoubleCheck", squares, pieces });
      }

      if (toSqName && toSq !== undefined) {
           // Determine piece role that gives check
           let checkingPiece = 'piece';
           if (posAfter.board.pawn.has(toSq)) checkingPiece = 'pawn';
           else if (posAfter.board.knight.has(toSq)) checkingPiece = 'knight';
           else if (posAfter.board.bishop.has(toSq)) checkingPiece = 'bishop';
           else if (posAfter.board.rook.has(toSq)) checkingPiece = 'rook';
           else if (posAfter.board.queen.has(toSq)) checkingPiece = 'queen';
           else if (posAfter.board.king.has(toSq)) checkingPiece = 'king';
           
           patterns.push({ theme: "Check", squares: [toSqName], pieces: [checkingPiece] });
      }
  } else if (typeof game.isStalemate === 'function' && game.isStalemate()) {
      themes.push("Stalemate");
  }

  // Basic SAN parsing
  if (moveSan.includes("x")) {
      themes.push("Capture");
      if (toSqName && toSq !== undefined) {
           // Determine capturing piece role
           let capturingPiece = 'piece';
           if (posAfter.board.pawn.has(toSq)) capturingPiece = 'pawn';
           else if (posAfter.board.knight.has(toSq)) capturingPiece = 'knight';
           else if (posAfter.board.bishop.has(toSq)) capturingPiece = 'bishop';
           else if (posAfter.board.rook.has(toSq)) capturingPiece = 'rook';
           else if (posAfter.board.queen.has(toSq)) capturingPiece = 'queen';
           else if (posAfter.board.king.has(toSq)) capturingPiece = 'king';
           
           patterns.push({ theme: "Capture", squares: [toSqName], pieces: [capturingPiece] });
      }
  }
  if (moveSan.includes("=")) {
      themes.push("Promotion");
      if (toSqName && toSq !== undefined) {
          // Determine promoted piece role
          let promotedPiece = 'queen'; // default, but check actual
          if (posAfter.board.knight.has(toSq)) promotedPiece = 'knight';
          else if (posAfter.board.bishop.has(toSq)) promotedPiece = 'bishop';
          else if (posAfter.board.rook.has(toSq)) promotedPiece = 'rook';
          else if (posAfter.board.queen.has(toSq)) promotedPiece = 'queen';
          
          patterns.push({ theme: "Promotion", squares: [toSqName], pieces: [promotedPiece] });
      }
  }
  if (moveSan === "O-O" || moveSan === "O-O-O") {
      themes.push("Castling");
  }

  // Insufficient Material
  if (typeof game.isInsufficientMaterial === 'function' && game.isInsufficientMaterial()) {
      themes.push("InsufficientMaterial");
  }

  // Deduplication
  const uniqueThemes = Array.from(new Set(themes)) as any[];
  
  // Generate i18n descriptions (returns JSON string with key + params)
  const description = generateCombinedI18nDescription(patterns);

  return {
      isTactical: uniqueThemes.length > 0,
      themes: uniqueThemes,
      patterns,
      description, // i18n key JSON string
      descriptionEn: description, // Same for both (frontend will translate)
      descriptionFr: description
  };
}
