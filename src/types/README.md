# 📘 Types et Interfaces TypeScript

Documentation des types et interfaces utilisés dans Chesskit.

## 📁 Structure

```
types/
├── enums.ts      # Énumérations (Color, EngineName, etc.)
├── eval.ts       # Types d'évaluation Stockfish
├── game.ts       # Types de parties et joueurs
└── ...
```

---

## 🎮 Types de Jeu (game.ts)

### Game

Représente une partie d'échecs complète.

```typescript
interface Game {
  id: string;                    // ID unique (généré par IndexedDB)
  pgn: string;                   // Partie au format PGN
  event?: string;                // Nom de l'événement
  site?: string;                 // Lieu de la partie
  date?: string;                 // Date (format: YYYY.MM.DD)
  round?: string;                // Numéro du round
  white: Player;                 // Joueur blanc
  black: Player;                 // Joueur noir
  result?: string;               // Résultat (1-0, 0-1, 1/2-1/2)
  eval?: GameEval;               // Évaluation complète
  termination?: string;          // Raison de fin
  timeControl?: string;          // Cadence
}
```

**Exemple d'utilisation** :

```typescript
const game: Game = {
  id: '123',
  pgn: '1. e4 e5 2. Nf3 Nc6',
  white: { name: 'Carlsen', rating: 2850 },
  black: { name: 'Nakamura', rating: 2800 },
  result: '1-0',
  termination: 'Checkmate'
};
```

---

### Player

Informations sur un joueur.

```typescript
interface Player {
  name: string;                  // Nom du joueur
  rating?: number;               // Rating ELO
  avatarUrl?: string;            // URL de l'avatar
  title?: string;                // Titre (GM, IM, etc.)
}
```

**Exemple** :

```typescript
const player: Player = {
  name: 'Magnus Carlsen',
  rating: 2850,
  title: 'GM'
};
```

---

### LoadedGame

Partie chargée avec métadonnées.

```typescript
interface LoadedGame {
  game: Chess;                   // Instance Chess.js
  origin: GameOrigin;            // Origine (Pgn, ChessCom, Lichess)
  eval?: GameEval;               // Évaluation si disponible
}
```

---

## 📊 Types d'Évaluation (eval.ts)

### PositionEval

Évaluation d'une position par le moteur.

```typescript
interface PositionEval {
  bestMove?: string;             // Meilleur coup (format UCI)
  moveClassification?: MoveClassification;  // Classification du coup
  opening?: string;              // Nom de l'ouverture
  lines: LineEval[];             // Lignes d'analyse
}
```

**Exemple** :

```typescript
const posEval: PositionEval = {
  bestMove: 'e2e4',
  moveClassification: MoveClassification.Best,
  lines: [{
    pv: ['e2e4', 'e7e5', 'Ng1f3'],
    cp: 25,
    depth: 20,
    multiPv: 1
  }]
};
```

---

### LineEval

Une ligne d'analyse du moteur.

```typescript
interface LineEval {
  pv: string[];                  // Variation principale (coups UCI)
  cp?: number;                   // Évaluation en centipawns
  mate?: number;                 // Mat en N coups (si applicable)
  depth: number;                 // Profondeur de recherche
  multiPv: number;               // Numéro de la ligne (1, 2, 3...)
}
```

**Interprétation** :
- `cp > 0` : Avantage blanc
- `cp < 0` : Avantage noir
- `mate > 0` : Blanc mate en N coups
- `mate < 0` : Noir mate en N coups

**Exemple** :

```typescript
const line: LineEval = {
  pv: ['e2e4', 'e7e5', 'Ng1f3', 'Nb8c6'],
  cp: 30,              // +0.30 pour les blancs
  depth: 22,
  multiPv: 1
};
```

---

### GameEval

Évaluation complète d'une partie.

```typescript
interface GameEval {
  positions: PositionEval[];     // Évaluation de chaque position
  accuracy: Accuracy;            // Précision des joueurs
  estimatedElo?: EstimatedElo;   // ELO estimé
  settings: EngineSettings;      // Paramètres du moteur
}
```

---

### Accuracy

Précision des joueurs (0-100).

```typescript
interface Accuracy {
  white: number;                 // Précision des blancs (%)
  black: number;                 // Précision des noirs (%)
}
```

**Exemple** :

```typescript
const accuracy: Accuracy = {
  white: 94.5,
  black: 89.2
};
```

---

## 🎨 Énumérations (enums.ts)

### Color

Couleur des pièces.

```typescript
enum Color {
  White = 'w',
  Black = 'b'
}
```

**Utilisation** :

```typescript
const color = Color.White;
if (color === Color.White) {
  console.log('Trait aux blancs');
}
```

---

### EngineName

Moteurs Stockfish disponibles.

```typescript
enum EngineName {
  Stockfish17 = 'stockfish-17',
  Stockfish17Lite = 'stockfish-17-lite',
  Stockfish16_1 = 'stockfish-16.1',
  Stockfish16 = 'stockfish-16',
  Stockfish15_1 = 'stockfish-15.1',
  Stockfish15 = 'stockfish-15',
  Stockfish14_1 = 'stockfish-14.1'
}
```

**Utilisation** :

```typescript
const engine = useEngine(EngineName.Stockfish17);
```

---

### MoveClassification

Classification des coups.

```typescript
enum MoveClassification {
  Blunder = 'blunder',           // Gaffe (perte > 3 pawns)
  Mistake = 'mistake',           // Erreur (perte > 1.5 pawns)
  Inaccuracy = 'inaccuracy',     // Imprécision (perte > 0.5 pawns)
  Okay = 'okay',                 // Correct
  Excellent = 'excellent',       // Excellent
  Best = 'best',                 // Meilleur coup
  Forced = 'forced',             // Coup forcé
  Opening = 'opening',           // Coup d'ouverture
  Perfect = 'perfect',           // Parfait
  Splendid = 'splendid'          // Splendide
}
```

**Utilisation** :

```typescript
if (classification === MoveClassification.Blunder) {
  showWarning('Gaffe détectée !');
}
```

---

### GameOrigin

Origine de la partie.

```typescript
enum GameOrigin {
  Pgn = 'pgn',                   // Chargée depuis PGN
  ChessCom = 'chess.com',        // Importée de Chess.com
  Lichess = 'lichess'            // Importée de Lichess
}
```

---

## 💡 Exemples Pratiques

### Créer une partie complète

```typescript
import { Game, Player, GameOrigin } from '@/types/game';
import { MoveClassification } from '@/types/enums';

const white: Player = {
  name: 'Alice',
  rating: 1500
};

const black: Player = {
  name: 'Bob',
  rating: 1600
};

const game: Omit<Game, 'id'> = {
  pgn: '1. e4 e5 2. Nf3 Nc6',
  white,
  black,
  result: '1-0',
  event: 'Tournoi Local',
  date: '2024.12.08'
};
```

### Analyser une position

```typescript
import { PositionEval, LineEval } from '@/types/eval';

const evaluation: PositionEval = {
  bestMove: 'e2e4',
  lines: [
    {
      pv: ['e2e4', 'e7e5'],
      cp: 25,
      depth: 20,
      multiPv: 1
    }
  ]
};

// Afficher l'évaluation
const cpValue = evaluation.lines[0].cp! / 100;
console.log(`Évaluation: +${cpValue}`);
```

---

## 🔍 Type Guards

Fonctions utiles pour vérifier les types :

```typescript
// Vérifier si c'est un mat
function isMate(line: LineEval): boolean {
  return line.mate !== undefined;
}

// Obtenir l'évaluation en format lisible
function getEvalString(line: LineEval): string {
  if (line.mate !== undefined) {
    return `M${Math.abs(line.mate)}`;
  }
  return `${(line.cp! / 100).toFixed(2)}`;
}
```

---

## 📖 Documentation Complète

Pour plus de détails, consultez les fichiers sources dans `src/types/` avec JSDoc complet.
