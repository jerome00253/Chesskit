# 📖 Guide d'Utilisation Chesskit

Guide complet avec exemples pratiques pour utiliser Chesskit.

## 🚀 Démarrage Rapide

### Installation et Lancement

```bash
# Installation des dépendances
npm install

# Lancement en mode développement
npm run dev

# Build pour production
npm run build

# Lancer les tests
npm test
```

L'application sera accessible sur `http://localhost:3000`.

---

## 📚 Exemples d'Utilisation

### 1. Charger et Analyser une Partie

```typescript
import { getGameFromPgn, getEvaluateGameParams } from '@/lib/chess';
import { useEngine } from '@/hooks/useEngine';
import { EngineName } from '@/types/enums';

function AnalyzeGame() {
  const { engine } = useEngine(EngineName.Stockfish17);
  const [evaluation, setEvaluation] = useState(null);

  const analyzeFromPgn = async (pgnString: string) => {
    // 1. Charger la partie
    const game = getGameFromPgn(pgnString);

    // 2. Extraire les paramètres
    const { fens, uciMoves } = getEvaluateGameParams(game);

    // 3. Analyser avec Stockfish
    const result = await engine.evaluateGame({
      fens,
      uciMoves,
      depth: 20,
      multiPv: 3
    });

    setEvaluation(result);
  };

  return (
    <div>
      <button onClick={() => analyzeFromPgn('1. e4 e5 2. Nf3')}>
        Analyser
      </button>
      {evaluation && <EvaluationDisplay eval={evaluation} />}
    </div>
  );
}
```

---

### 2. Jouer contre Stockfish

```typescript
import { useChessActions } from '@/hooks/useChessActions';
import { useEngine } from '@/hooks/useEngine';
import { Board } from '@/components/board';

function PlayVsEngine() {
  const { makeMove } = useChessActions();
  const { engine } = useEngine(EngineName.Stockfish17Lite);
  const [isEngineThinking, setIsEngineThinking] = useState(false);

  const handlePlayerMove = async (from: string, to: string) => {
    // 1. Jouer le coup du joueur
    makeMove(from, to);

    // 2. Demander le coup du moteur
    setIsEngineThinking(true);
    const fen = game.fen();
    const bestMove = await engine.getBestMove(fen, { depth: 15 });

    // 3. Jouer le coup du moteur
    const { from: engineFrom, to: engineTo } = uciMoveParams(bestMove);
    makeMove(engineFrom, engineTo);
    setIsEngineThinking(false);
  };

  return (
    <>
      <Board onMove={handlePlayerMove} />
      {isEngineThinking && <Spinner text="Stockfish réfléchit..." />}
    </>
  );
}
```

---

### 3. Sauvegarder une Partie dans IndexedDB

```typescript
import { useGameDatabase } from '@/hooks/useGameDatabase';
import { formatGameToDatabase, setGameHeaders } from '@/lib/chess';
import { useAtomValue } from 'jotai';
import { gameAtom } from '@/sections/analysis/states';

function SaveGameButton() {
  const { saveGame, loading } = useGameDatabase();
  const game = useAtomValue(gameAtom);

  const handleSave = async () => {
    // 1. Ajouter les headers
    const gameWithHeaders = setGameHeaders(game, {
      white: { name: 'Alice', rating: 1500 },
      black: { name: 'Bob', rating: 1600 }
    });

    // 2. Formater pour la base de données
    const formatted = formatGameToDatabase(gameWithHeaders);

    // 3. Sauvegarder
    const id = await saveGame(formatted);

    console.log('Partie sauvegardée avec ID:', id);
  };

  return (
    <button onClick={handleSave} disabled={loading}>
      {loading ? 'Sauvegarde...' : 'Sauvegarder la partie'}
    </button>
  );
}
```

---

### 4. Importer depuis Chess.com ou Lichess

```typescript
import { GameOrigin } from '@/types/enums';

function ImportGame() {
  const [url, setUrl] = useState('');

  const importFromUrl = async () => {
    let origin: GameOrigin;
    let pgn: string;

    if (url.includes('chess.com')) {
      origin = GameOrigin.ChessCom;
      pgn = await fetchChessComGame(url);
    } else if (url.includes('lichess.org')) {
      origin = GameOrigin.Lichess;
      pgn = await fetchLichessGame(url);
    }

    const game = getGameFromPgn(pgn);
    // Charger dans l'application
    setGameAtom(game);
  };

  return (
    <div>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL de la partie"
      />
      <button onClick={importFromUrl}>Importer</button>
    </div>
  );
}
```

---

### 5. Afficher l'Évaluation avec Graphique

```typescript
import { getEvaluationBarValue } from '@/lib/chess';
import { PositionEval } from '@/types/eval';

function EvaluationBar({ position }: { position: PositionEval }) {
  const { label, whiteBarPercentage } = getEvaluationBarValue(position);

  return (
    <div className="eval-bar">
      <div className="white-bar" style={{ height: `${whiteBarPercentage}%` }}>
        {whiteBarPercentage > 50 && <span>{label}</span>}
      </div>
      <div className="black-bar" style={{ height: `${100 - whiteBarPercentage}%` }}>
        {whiteBarPercentage <= 50 && <span>{label}</span>}
      </div>
    </div>
  );
}
```

---

### 6. Utiliser le Debouncing pour la Recherche

```typescript
import { useDebounce } from '@/hooks/useDebounce';

function GameSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (debouncedSearch) {
      // Recherche exécutée seulement 500ms après la dernière frappe
      searchGames(debouncedSearch).then(setResults);
    }
  }, [debouncedSearch]);

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Rechercher une partie..."
      />
      <GameList games={results} />
    </div>
  );
}
```

---

### 7. Persister les Préférences avec localStorage

```typescript
import { useLocalStorage } from '@/hooks/useLocalStorage';

function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [boardStyle, setBoardStyle] = useLocalStorage('boardStyle', 'classic');
  const [soundEnabled, setSoundEnabled] = useLocalStorage('soundEnabled', true);

  if (theme === null) return <Spinner />;

  return (
    <div>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="light">Clair</option>
        <option value="dark">Sombre</option>
      </select>

      <select value={boardStyle} onChange={(e) => setBoardStyle(e.target.value)}>
        <option value="classic">Classique</option>
        <option value="modern">Moderne</option>
      </select>

      <label>
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(e) => setSoundEnabled(e.target.checked)}
        />
        Sons activés
      </label>
    </div>
  );
}
```

---

### 8. Responsive Design avec useScreenSize

```typescript
import { useScreenSize } from '@/hooks/useScreenSize';

function ResponsiveBoard() {
  const { width, height } = useScreenSize();

  // Calculer la taille optimale de l'échiquier
  const boardSize = Math.min(width * 0.9, height * 0.7, 600);

  return (
    <Chessboard
      boardWidth={boardSize}
      position={fen}
    />
  );
}
```

---

## 🎯 Cas d'Usage Avancés

### Analyse Multi-Lignes

```typescript
const evaluation = await engine.evaluatePosition(fen, {
  depth: 25,
  multiPv: 5, // Analyser les 5 meilleurs coups
});

evaluation.lines.forEach((line, index) => {
  console.log(`Ligne ${index + 1}:`);
  console.log(`  Coups: ${line.pv.join(" ")}`);
  console.log(`  Éval: ${line.cp ? line.cp / 100 : `M${line.mate}`}`);
});
```

### Classification Automatique des Coups

```typescript
import { MoveClassification } from "@/types/enums";

function getMoveColor(classification: MoveClassification): string {
  const colors = {
    [MoveClassification.Blunder]: "#FF6B6B",
    [MoveClassification.Mistake]: "#FFA500",
    [MoveClassification.Inaccuracy]: "#FFD700",
    [MoveClassification.Best]: "#4CAF50",
    [MoveClassification.Excellent]: "#2196F3",
  };
  return colors[classification] || "#999";
}
```

---

## 🐛 Débogage

### Activer les Logs Détaillés

```typescript
// Dans le fichier de configuration
const DEBUG = process.env.NODE_ENV === "development";

if (DEBUG) {
  console.log("Position FEN:", fen);
  console.log("Évaluation:", evaluation);
}
```

### Vérifier l'État Jotai

```typescript
import { useAtomValue } from 'jotai';
import { gameAtom, boardAtom } from '@/sections/analysis/states';

function DebugPanel() {
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);

  return (
    <pre>
      Game: {game.fen()}
      Board: {board.fen()}
      History: {JSON.stringify(game.history(), null, 2)}
    </pre>
  );
}
```

---

## 📖 Ressources

- [Documentation Chess.js](https://github.com/jhlywa/chess.js)
- [Stockfish Documentation](https://stockfishchess.org/)
- [Material-UI](https://mui.com/)
- [Jotai State Management](https://jotai.org/)

---

## 🆘 Support

Pour toute question ou problème :

1. Consultez les README dans chaque dossier (`src/lib/`, `src/hooks/`, etc.)
2. Vérifiez les tests pour des exemples d'utilisation
3. Consultez le code source avec JSDoc en français
