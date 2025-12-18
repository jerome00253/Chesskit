# 📚 Bibliothèque d'Utilitaires Chess

Ce dossier contient toutes les fonctions utilitaires pour manipuler les parties d'échecs avec Chess.js.

## 📁 Structure

```
lib/
├── chess.ts          # Fonctions utilitaires principales
└── engine/           # Moteurs Stockfish et helpers
```

## 🎯 Fonctions Principales

### Évaluation de Parties

#### `getEvaluateGameParams(game: Chess)`

Extrait les FENs et coups UCI pour l'évaluation par un moteur.

```typescript
const game = new Chess();
game.move("e4");
game.move("e5");
const { fens, uciMoves } = getEvaluateGameParams(game);
// fens: ["rnbqkbnr/...", ...]
// uciMoves: ["e2e4", "e7e5"]
```

### Chargement et Sauvegarde

#### `getGameFromPgn(pgn: string)`

Charge une partie depuis une chaîne PGN.

```typescript
const pgn = '[Event "Match"]\n1. e4 e5 2. Nf3';
const game = getGameFromPgn(pgn);
```

#### `formatGameToDatabase(game: Chess)`

Formate une partie pour IndexedDB.

```typescript
const game = new Chess();
game.setHeader("White", "Carlsen");
const formatted = formatGameToDatabase(game);
// { pgn, white: { name, rating }, black: {...}, ... }
```

### Manipulation de Coups

#### `moveLineUciToSan(fen: string)`

Convertit des coups UCI en notation SAN.

```typescript
const converter = moveLineUciToSan(startFen);
const san = converter("e2e4"); // "e4"
```

#### `uciMoveParams(uciMove: string)`

Parse un coup UCI en paramètres.

```typescript
const params = uciMoveParams("e7e8q");
// { from: 'e7', to: 'e8', promotion: 'q' }
```

### Analyse de Position

#### `getMaterialDifference(fen: string)`

Calcule la différence matérielle.

```typescript
const diff = getMaterialDifference(fen);
// > 0 : avantage blanc, < 0 : avantage noir
```

#### `isCheck(fen: string)` / `isStalemate(fen: string)`

Vérifie l'état de la position.

```typescript
if (isCheck(fen)) {
  console.log("Échec !");
}
```

#### `getCapturedPieces(fen: string, color: Color)`

Liste les pièces capturées.

```typescript
const captured = getCapturedPieces(fen, Color.Black);
// [{ piece: 'wP', count: 2 }, ...]
```

### Évaluation Visuelle

#### `getEvaluationBarValue(position: PositionEval)`

Calcule la valeur pour la barre d'évaluation.

```typescript
const { label, whiteBarPercentage } = getEvaluationBarValue(position);
// label: "+1.5" ou "M3"
// whiteBarPercentage: 65
```

## 🔧 Utilisation Typique

### Analyser une partie

```typescript
import { getGameFromPgn, getEvaluateGameParams } from "@/lib/chess";

// 1. Charger la partie
const game = getGameFromPgn(pgnString);

// 2. Extraire les paramètres d'évaluation
const { fens, uciMoves } = getEvaluateGameParams(game);

// 3. Envoyer au moteur Stockfish
const evaluation = await engine.evaluateGame({ fens, uciMoves });
```

### Sauvegarder une partie

```typescript
import { formatGameToDatabase, setGameHeaders } from "@/lib/chess";

// 1. Définir les headers
const gameWithHeaders = setGameHeaders(game, {
  white: { name: "Alice", rating: 1500 },
  black: { name: "Bob", rating: 1600 },
});

// 2. Formater pour la base de données
const formatted = formatGameToDatabase(gameWithHeaders);

// 3. Sauvegarder dans IndexedDB
await db.games.add(formatted);
```

## 📖 Documentation Complète

Toutes les fonctions sont documentées avec JSDoc en français. Utilisez l'autocomplétion de votre IDE pour voir les descriptions détaillées.

## 🧪 Tests

Les tests unitaires se trouvent dans `__tests__/chess.test.ts` avec une couverture de 100%.

```bash
npm test -- chess.test
```
