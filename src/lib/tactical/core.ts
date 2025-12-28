import { Color, Square, Role } from "chessops/types";
import { SquareSet } from "chessops/squareSet";
import {
  bishopAttacks,
  kingAttacks,
  knightAttacks,
  pawnAttacks,
  rookAttacks, // removed queenAttacks
} from "chessops/attacks";
import { parseFen } from "chessops/fen";
import { Chess, Position } from "chessops/chess";

export type Side = Color;
// Define File/Rank as numbers since they are not exported types from chessops/types usually (just values or internal)
export type File = number;
export type Rank = number;

export { Position, SquareSet };
export type { Square, Role, Color };


// Type guards or helpers
export const isWhite = (side: Side) => side === "white";

export function getOppositeSide(side: Side): Side {
  return side === "white" ? "black" : "white";
}

export function getSquareName(sq: number): string {
    const file = sq & 7;
    const rank = sq >> 3;
    return String.fromCharCode(97 + file) + (rank + 1);
}

export function fenToPosition(fen: string): Position | undefined {
  const setup = parseFen(fen);
  
  // Checking structure
  const s = setup as any;
  
  // Check if isOk is boolean or function
  const ok = typeof s.isOk === 'function' ? s.isOk() : s.isOk;
  
  if (ok) {
     let val = (typeof s.unwrap === 'function') ? s.unwrap() : s.value;
     
     // Hydrate SquareSets if they are plain objects (lost prototype or JSON issue)
     if (val.board && val.board.occupied && !(val.board.occupied instanceof SquareSet)) {
         const hydrate = (obj: any) => new SquareSet(obj.lo, obj.hi);
         val.board.occupied = hydrate(val.board.occupied);
         val.board.promoted = hydrate(val.board.promoted);
         
         val.board.white = hydrate(val.board.white);
         val.board.black = hydrate(val.board.black);
         
         val.board.pawn = hydrate(val.board.pawn);
         val.board.knight = hydrate(val.board.knight);
         val.board.bishop = hydrate(val.board.bishop);
         val.board.rook = hydrate(val.board.rook);
         val.board.queen = hydrate(val.board.queen);
         val.board.king = hydrate(val.board.king);
         
         if (val.castlingRights) val.castlingRights = hydrate(val.castlingRights);
     }
     if (val.castlingRights && !(val.castlingRights instanceof SquareSet)) {
          val.castlingRights = new SquareSet(val.castlingRights.lo, val.castlingRights.hi);
     }

     // Chess.fromSetup returns Result<Chess, Error>
     let gameResult: any;
     try {
        gameResult = Chess.fromSetup(val);
     } catch (e) {
         // Fallback: Try new Chess(val) check if constructor supported
         try {
             // @ts-ignore
             return new Chess(val);
         } catch (e2) {
             console.error("Chess.fromSetup and new Chess() failed:", e, e2);
             return undefined;
         }
     }
     
     const g = gameResult as any;
     const gOk = typeof g.isOk === 'function' ? g.isOk() : g.isOk;
     
     if (gOk) {
         return (typeof g.unwrap === 'function') ? g.unwrap() : g.value;
     }
  }
  
  // If it is already a setup object (fallback)
  if (s.board && s.turn) {
       // Hydration for fallback
       let val = s;
       if (val.board && val.board.occupied && !(val.board.occupied instanceof SquareSet)) {
         const hydrate = (obj: any) => new SquareSet(obj.lo, obj.hi);
         val.board.occupied = hydrate(val.board.occupied);
         val.board.promoted = hydrate(val.board.promoted);
         val.board.white = hydrate(val.board.white);
         val.board.black = hydrate(val.board.black);
         val.board.pawn = hydrate(val.board.pawn);
         val.board.knight = hydrate(val.board.knight);
         val.board.bishop = hydrate(val.board.bishop);
         val.board.rook = hydrate(val.board.rook);
         val.board.queen = hydrate(val.board.queen);
         val.board.king = hydrate(val.board.king);
         if (val.castlingRights) val.castlingRights = hydrate(val.castlingRights);
       }
       if (val.castlingRights && !(val.castlingRights instanceof SquareSet)) {
          val.castlingRights = new SquareSet(val.castlingRights.lo, val.castlingRights.hi);
       }

       const gameResult = Chess.fromSetup(val);
       const g = gameResult as any;
       const gOk = typeof g.isOk === 'function' ? g.isOk() : g.isOk;
       if (gOk) return (typeof g.unwrap === 'function') ? g.unwrap() : g.value;
  }
  
  return undefined;
}

export function getPieces(pos: Position, side: Side): SquareSet {
    // Check if pos.board is array or has index signature?
    // In chessops, pos.board is Board. Board might implement Iterable<SquareSet> or similar.
    // Actually, usually pos.board[side] works if side is 'white' | 'black'.
    // If not, we use checks.
    return side === "white" ? pos.board.white : pos.board.black;
}

/**
 * Returns a SquareSet of all pieces of `attackerSide` that attack `sq`.
 */
export function getAttackers(
  pos: Position,
  sq: Square,
  attackerSide: Side
): SquareSet {
  const occupied = pos.board.occupied; // SquareSet of all pieces
  const attackers = getPieces(pos, attackerSide); // SquareSet of attacker's pieces

  let result = SquareSet.empty();

  // 1. Pawn attacks
  const defenderSide = getOppositeSide(attackerSide);
  const potentialPawnAttackers = pawnAttacks(defenderSide, sq);
  result = result.union(potentialPawnAttackers.intersect(pos.board.pawn).intersect(attackers));

  // 2. Knight attacks (symmetric)
  const potentialKnights = knightAttacks(sq);
  result = result.union(potentialKnights.intersect(pos.board.knight).intersect(attackers));

  // 3. King attacks (symmetric)
  const potentialKing = kingAttacks(sq);
  result = result.union(potentialKing.intersect(pos.board.king).intersect(attackers));

  // 4. Slider attacks (Bishop/Rook/Queen)
  const diagonal = bishopAttacks(sq, occupied);
  result = result.union(
    diagonal.intersect(pos.board.bishop.union(pos.board.queen)).intersect(attackers)
  );

  const orthogonal = rookAttacks(sq, occupied);
  result = result.union(
    orthogonal.intersect(pos.board.rook.union(pos.board.queen)).intersect(attackers)
  );

  return result;
}

/**
 * Gets the material value of a piece type (approximate).
 */
export function getPieceValue(role: string): number {
    switch (role) {
        case 'pawn': return 1;
        case 'knight': return 3;
        case 'bishop': return 3;
        case 'rook': return 5;
        case 'queen': return 9;
        case 'king': return 100; // Invaluable
        default: return 0;
    }
}
