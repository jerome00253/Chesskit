# 🎣 Hooks Personnalisés

Collection de hooks React personnalisés pour Chesskit.

## 📁 Structure

```
hooks/
├── useDebounce.ts          # Debouncing de valeurs
├── useLocalStorage.ts      # Persistance localStorage
├── useEngine.ts            # Gestion moteurs Stockfish
├── useChessActions.ts      # Actions d'échecs
├── useGameData.ts          # Données de partie
├── useGameDatabase.ts      # Base de données IndexedDB
├── usePlayersData.ts       # Données des joueurs
├── useAtomLocalStorage.ts  # Atoms Jotai + localStorage
└── useScreenSize.ts        # Détection taille écran
```

## 🎯 Hooks Utilitaires

### useDebounce

Retarde la mise à jour d'une valeur pour optimiser les performances.

```typescript
import { useDebounce } from '@/hooks/useDebounce';

function SearchBar() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    // Exécuté seulement 500ms après la dernière frappe
    if (debouncedSearch) {
      performSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  return <input value={search} onChange={(e) => setSearch(e.target.value)} />;
}
```

**Paramètres** :

- `value: T` - Valeur à débouncer
- `delayMs: number` - Délai en millisecondes

**Retour** : `T` - Valeur débouncée

---

### useLocalStorage

Synchronise un état React avec le localStorage.

```typescript
import { useLocalStorage } from '@/hooks/useLocalStorage';

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  if (theme === null) return <Spinner />;

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Thème : {theme}
    </button>
  );
}
```

**Paramètres** :

- `key: string` - Clé localStorage
- `initialValue: T` - Valeur par défaut

**Retour** : `[T | null, SetValue<T>]` - État et setter

**⚠️ Important** : La valeur est `null` pendant l'initialisation.

---

### useScreenSize

Détecte et suit la taille de l'écran.

```typescript
import { useScreenSize } from '@/hooks/useScreenSize';

function ResponsiveBoard() {
  const { width, height } = useScreenSize();
  const boardSize = Math.min(width, height) * 0.8;

  return <Chessboard boardWidth={boardSize} />;
}
```

**Retour** : `{ width: number, height: number }`

---

## 🎮 Hooks Spécifiques Chess

### useEngine

Charge et gère les moteurs Stockfish.

```typescript
import { useEngine } from '@/hooks/useEngine';
import { EngineName } from '@/types/enums';

function AnalysisPanel() {
  const { engine, loading, error } = useEngine(EngineName.Stockfish17);

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;

  // Utiliser engine.evaluatePosition(), engine.evaluateGame(), etc.
}
```

---

### useChessActions

Actions pour manipuler l'échiquier.

```typescript
import { useChessActions } from '@/hooks/useChessActions';

function BoardControls() {
  const { makeMove, undoMove, resetBoard } = useChessActions();

  return (
    <>
      <button onClick={() => makeMove('e2', 'e4')}>e4</button>
      <button onClick={undoMove}>Annuler</button>
      <button onClick={resetBoard}>Réinitialiser</button>
    </>
  );
}
```

---

### useGameDatabase

Interface avec IndexedDB pour sauvegarder les parties.

```typescript
import { useGameDatabase } from '@/hooks/useGameDatabase';

function SaveGameButton() {
  const { saveGame, loading } = useGameDatabase();
  const game = useAtomValue(gameAtom);

  const handleSave = async () => {
    const id = await saveGame(game);
    console.log('Partie sauvegardée avec ID:', id);
  };

  return <button onClick={handleSave} disabled={loading}>Sauvegarder</button>;
}
```

---

## 💡 Bonnes Pratiques

### 1. Gestion du chargement

Toujours vérifier les états de chargement :

```typescript
const [value, setValue] = useLocalStorage('key', 'default');

// ❌ Mauvais
return <div>{value}</div>;

// ✅ Bon
if (value === null) return <Spinner />;
return <div>{value}</div>;
```

### 2. Debouncing des recherches

Utiliser `useDebounce` pour les champs de recherche :

```typescript
const [query, setQuery] = useState("");
const debouncedQuery = useDebounce(query, 300);

useEffect(() => {
  if (debouncedQuery) {
    fetchResults(debouncedQuery);
  }
}, [debouncedQuery]);
```

### 3. Nettoyage des effets

Les hooks gèrent automatiquement le nettoyage, mais attention aux dépendances :

```typescript
// ✅ Bon - dépendances correctes
useEffect(() => {
  const timer = setTimeout(() => doSomething(), delay);
  return () => clearTimeout(timer);
}, [delay]);
```

## 🧪 Tests

Chaque hook a sa suite de tests dans `__tests__/`.

```bash
npm test -- useDebounce
npm test -- useLocalStorage
```

## 📖 Documentation

Tous les hooks sont documentés avec JSDoc en français. Consultez les fichiers sources pour plus de détails.
