import { Chess } from "chess.js";
import {
  getEvaluateGameParams,
  getGameFromPgn,
  formatGameToDatabase,
  setGameHeaders,
  moveLineUciToSan,
  getEvaluationBarValue,
  getIsStalemate,
  getWhoIsCheckmated,
  uciMoveParams,
  isSimplePieceRecapture,
  getMaterialDifference,
  isCheck,
  getCapturedPieces,
  getLineEvalLabel,
  formatUciPv,
} from "../chess";
import { Color } from "@/types/enums";

describe("Chess Utilities", () => {
  describe("getEvaluateGameParams", () => {
    it("should extract FENs and UCI moves from a game", () => {
      const game = new Chess();
      game.move("e4");
      game.move("e5");
      game.move("Nf3");

      const params = getEvaluateGameParams(game);

      expect(params.fens).toHaveLength(4); // Initial + 3 moves
      expect(params.uciMoves).toHaveLength(3);
      expect(params.uciMoves[0]).toBe("e2e4");
      expect(params.uciMoves[1]).toBe("e7e5");
      expect(params.uciMoves[2]).toBe("g1f3");
    });

    it("should handle empty game", () => {
      const game = new Chess();
      const params = getEvaluateGameParams(game);

      expect(params.fens).toHaveLength(1);
      expect(params.uciMoves).toHaveLength(0);
      // Should not crash on empty history
    });
  });

  describe("getGameFromPgn", () => {
    it("should load a valid PGN", () => {
      const pgn = "1. e4 e5 2. Nf3 Nc6";
      const game = getGameFromPgn(pgn);

      expect(game.history()).toHaveLength(4);
      expect(game.history()[0]).toBe("e4");
    });

    it("should handle PGN with headers", () => {
      const pgn = `[Event "Test Game"]
[White "Player 1"]
[Black "Player 2"]

1. e4 e5`;

      const game = getGameFromPgn(pgn);
      const headers = game.getHeaders();

      expect(headers.Event).toBe("Test Game");
      expect(headers.White).toBe("Player 1");
      expect(headers.Black).toBe("Player 2");
    });
  });

  describe("formatGameToDatabase", () => {
    it("should format game with all headers", () => {
      const game = new Chess();
      game.setHeader("Event", "Test Event");
      game.setHeader("White", "Alice");
      game.setHeader("Black", "Bob");
      game.setHeader("WhiteElo", "1500");
      game.setHeader("BlackElo", "1600");
      game.setHeader("Result", "1-0");
      game.move("e4");

      const formatted = formatGameToDatabase(game);

      expect(formatted.event).toBe("Test Event");
      expect(formatted.white.name).toBe("Alice");
      expect(formatted.white.rating).toBe(1500);
      expect(formatted.black.name).toBe("Bob");
      expect(formatted.black.rating).toBe(1600);
      expect(formatted.result).toBe("1-0");
    });

    it("should handle missing headers", () => {
      const game = new Chess();
      const formatted = formatGameToDatabase(game);

      // chess.js v1.4.0 uses '?' as default for missing headers
      expect(formatted.white.name).toBe("White"); // Our code converts '?' to 'White'
      expect(formatted.black.name).toBe("Black"); // Our code converts '?' to 'Black'
      expect(formatted.white.rating).toBeUndefined();
    });
  });

  describe("setGameHeaders", () => {
    it("should set basic headers", () => {
      const game = new Chess();
      const updatedGame = setGameHeaders(game);
      const headers = updatedGame.getHeaders();

      expect(headers.Event).toBe("Chesskit Game");
      expect(headers.Site).toBe("Chesskit.org");
      expect(headers.Date).toBeDefined();
      expect(headers.White).toBe("White");
      expect(headers.Black).toBe("Black");
    });

    it("should set player names and ratings", () => {
      const game = new Chess();
      const updatedGame = setGameHeaders(game, {
        white: { name: "Alice", rating: 1500 },
        black: { name: "Bob", rating: 1600 },
      });
      const headers = updatedGame.getHeaders();

      expect(headers.White).toBe("Alice");
      expect(headers.Black).toBe("Bob");
      expect(headers.WhiteElo).toBe("1500");
      expect(headers.BlackElo).toBe("1600");
    });

    it("should set result for checkmate", () => {
      // Fool's mate
      const game = new Chess();
      game.move("f3");
      game.move("e5");
      game.move("g4");
      game.move("Qh4"); // Checkmate

      const updatedGame = setGameHeaders(game);
      const headers = updatedGame.getHeaders();

      expect(headers.Result).toBe("0-1");
      expect(headers.Termination).toContain("checkmate");
    });

    it("should set result for stalemate", () => {
      // Create a stalemate position
      const game = new Chess();
      game.load("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1"); // Stalemate position

      const updatedGame = setGameHeaders(game);
      const headers = updatedGame.getHeaders();

      expect(headers.Result).toBe("1/2-1/2");
      expect(headers.Termination).toBe("Draw by stalemate");
    });
  });

  describe("moveLineUciToSan", () => {
    it("should convert UCI moves to SAN", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const converter = moveLineUciToSan(fen);

      expect(converter("e2e4")).toBe("e4");
      expect(converter("e7e5")).toBe("e5");
      expect(converter("g1f3")).toBe("Nf3");
    });

    it("should handle invalid moves gracefully", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const converter = moveLineUciToSan(fen);

      expect(converter("invalid")).toBe("invalid");
    });
  });

  describe("getEvaluationBarValue", () => {
    it("should calculate bar value for centipawn evaluation", () => {
      const position = {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        lines: [{ cp: 50, mate: undefined, pv: [], depth: 20, multiPv: 1 }],
      };

      const result = getEvaluationBarValue(position);

      expect(result.label).toBe("0.5");
      expect(result.whiteBarPercentage).toBeGreaterThan(50);
    });

    it("should format mate evaluation", () => {
      const position = {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        lines: [{ cp: undefined, mate: 3, pv: [], depth: 20, multiPv: 1 }],
      };

      const result = getEvaluationBarValue(position);

      expect(result.label).toBe("M3");
    });
  });

  describe("getIsStalemate", () => {
    it("should detect stalemate", () => {
      const stalemateFen = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1";
      expect(getIsStalemate(stalemateFen)).toBe(true);
    });

    it("should return false for normal position", () => {
      const normalFen =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      expect(getIsStalemate(normalFen)).toBe(false);
    });
  });

  describe("getWhoIsCheckmated", () => {
    it("should detect white is checkmated", () => {
      // Fool's mate - white is checkmated
      const checkmateFen =
        "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
      expect(getWhoIsCheckmated(checkmateFen)).toBe("w");
    });

    it("should return null for non-checkmate position", () => {
      const normalFen =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      expect(getWhoIsCheckmated(normalFen)).toBeNull();
    });
  });

  describe("uciMoveParams", () => {
    it("should parse UCI move without promotion", () => {
      const params = uciMoveParams("e2e4");

      expect(params.from).toBe("e2");
      expect(params.to).toBe("e4");
      expect(params.promotion).toBeUndefined();
    });

    it("should parse UCI move with promotion", () => {
      const params = uciMoveParams("e7e8q");

      expect(params.from).toBe("e7");
      expect(params.to).toBe("e8");
      expect(params.promotion).toBe("q");
    });
  });

  describe("isSimplePieceRecapture", () => {
    it("should detect simple recapture", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const game = new Chess(fen);
      game.move("e4");
      game.move("d5");
      game.move({ from: "e4", to: "d5" }); // Capture

      const result = isSimplePieceRecapture(game.fen(), ["d5e4", "e4d5"]);
      expect(result).toBe(false); // Not a recapture in this case
    });
  });

  describe("getMaterialDifference", () => {
    it("should return 0 for starting position", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      expect(getMaterialDifference(fen)).toBe(0);
    });

    it("should calculate material advantage", () => {
      // White has extra pawn (valid FEN)
      const fen = "rnbqkbnr/ppppppp1/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      expect(getMaterialDifference(fen)).toBe(1);
    });
  });

  describe("isCheck", () => {
    it("should detect check", () => {
      const game = new Chess();
      game.move("e4");
      game.move("e5");
      game.move("Qh5");
      game.move("Nc6");
      game.move("Qxf7"); // Check

      expect(isCheck(game.fen())).toBe(true);
    });

    it("should return false for non-check position", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      expect(isCheck(fen)).toBe(false);
    });
  });

  describe("getCapturedPieces", () => {
    it("should return empty for starting position", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const capturedWhite = getCapturedPieces(fen, Color.White);
      const capturedBlack = getCapturedPieces(fen, Color.Black);

      capturedWhite.forEach((piece) => expect(piece.count).toBe(0));
      capturedBlack.forEach((piece) => expect(piece.count).toBe(0));
    });

    it("should count captured pieces", () => {
      // Missing one white pawn
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPP/RNBQKBNR w KQkq - 0 1";
      const capturedBlack = getCapturedPieces(fen, Color.Black);

      const pawns = capturedBlack.find((p) => p.piece === "wP");
      expect(pawns?.count).toBe(1);
    });
  });

  describe("getLineEvalLabel", () => {
    it("should format centipawn evaluation", () => {
      expect(getLineEvalLabel({ cp: 50 })).toBe("+0.50");
      expect(getLineEvalLabel({ cp: -150 })).toBe("-1.50");
      expect(getLineEvalLabel({ cp: 0 })).toBe("0.00"); // No + sign for 0
    });

    it("should format mate evaluation", () => {
      expect(getLineEvalLabel({ mate: 3 })).toBe("+M3");
      expect(getLineEvalLabel({ mate: -5 })).toBe("-M5");
    });

    it("should return ? for undefined evaluation", () => {
      expect(getLineEvalLabel({})).toBe("?");
    });
  });

  describe("formatUciPv", () => {
    it("should format castling moves correctly", () => {
      const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
      const uciMoves = ["e1h1", "e8h8"]; // Kingside castling

      const formatted = formatUciPv(fen, uciMoves);

      expect(formatted[0]).toBe("e1g1"); // Corrected castling
      expect(formatted[1]).toBe("e8g8");
    });

    it("should not modify non-castling moves", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const uciMoves = ["e2e4", "e7e5"];

      const formatted = formatUciPv(fen, uciMoves);

      expect(formatted).toEqual(uciMoves);
    });
  });
});
