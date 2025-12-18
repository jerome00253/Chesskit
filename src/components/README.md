# 🧩 Composants React

Composants réutilisables pour l'interface Chesskit.

## 📁 Structure

```
components/
├── board/                  # Composants de l'échiquier
│   ├── index.tsx          # Composant Board principal
│   ├── playerHeader.tsx   # En-tête joueur
│   └── ...
├── prettyMoveSan/         # Affichage des coups
├── pageTitle.tsx          # Titre de page
├── LinearProgressBar.tsx  # Barre de progression
├── NavLink.tsx            # Liens de navigation
└── slider.tsx             # Slider personnalisé
```

## 🎮 Composants Principaux

### Board

Composant principal de l'échiquier avec gestion des coups.

```typescript
import { Board } from '@/components/board';

function GamePage() {
  return <Board />;
}
```

**Fonctionnalités** :

- Affichage de l'échiquier interactif
- Gestion des coups (drag & drop)
- En-têtes des joueurs avec avatars
- Pièces capturées
- Indicateurs visuels (échec, dernier coup)

---

### PlayerHeader

Affiche les informations d'un joueur.

```typescript
import { PlayerHeader } from '@/components/board/playerHeader';

function GameInfo() {
  const player = { name: 'Carlsen', rating: 2850 };

  return (
    <PlayerHeader
      player={player}
      color={Color.White}
      isPlayerTurn={true}
    />
  );
}
```

**Props** :

- `player: Player` - Informations du joueur
- `color: Color` - Couleur (blanc/noir)
- `isPlayerTurn: boolean` - Si c'est le tour du joueur

---

### PageTitle

Définit le titre de la page (balise `<title>`).

```typescript
import { PageTitle } from '@/components/pageTitle';

function AnalysisPage() {
  return (
    <>
      <PageTitle title="Analyse de Partie | Chesskit" />
      {/* Contenu de la page */}
    </>
  );
}
```

---

### LinearProgressBar

Barre de progression pour les opérations longues.

```typescript
import { LinearProgressBar } from '@/components/LinearProgressBar';

function AnalysisProgress() {
  const [progress, setProgress] = useState(0);

  return (
    <LinearProgressBar
      value={progress}
      max={100}
      label={`Analyse en cours... ${progress}%`}
    />
  );
}
```

---

### NavLink

Lien de navigation avec style actif.

```typescript
import { NavLink } from '@/components/NavLink';

function Navigation() {
  return (
    <nav>
      <NavLink href="/">Analyse</NavLink>
      <NavLink href="/play">Jouer</NavLink>
      <NavLink href="/database">Base de données</NavLink>
    </nav>
  );
}
```

---

## 🎨 Composants d'Affichage

### PrettyMoveSan

Affiche un coup en notation SAN avec style.

```typescript
import { PrettyMoveSan } from '@/components/prettyMoveSan';

function MoveList() {
  return (
    <div>
      <PrettyMoveSan move="Nf3" />
      <PrettyMoveSan move="O-O" />
      <PrettyMoveSan move="Qxe5+" />
    </div>
  );
}
```

**Fonctionnalités** :

- Symboles d'échecs Unicode
- Coloration selon le type de coup
- Support des annotations (+, #, !, ?)

---

## 💡 Patterns d'Utilisation

### Composition de Composants

```typescript
function GameAnalysis() {
  return (
    <Grid container>
      <Grid item xs={12} md={8}>
        <Board />
      </Grid>
      <Grid item xs={12} md={4}>
        <AnalysisPanel />
      </Grid>
    </Grid>
  );
}
```

### Gestion d'État avec Jotai

```typescript
import { useAtom } from 'jotai';
import { boardAtom } from '@/sections/analysis/states';

function CustomBoard() {
  const [board, setBoard] = useAtom(boardAtom);

  const handleMove = (from: string, to: string) => {
    const newBoard = new Chess(board.fen());
    newBoard.move({ from, to });
    setBoard(newBoard);
  };

  return <Chessboard onPieceDrop={handleMove} />;
}
```

### Responsive Design

```typescript
import { useMediaQuery, useTheme } from '@mui/material';

function ResponsiveComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}
```

---

## 🎨 Thème et Styles

### Utilisation du Thème MUI

```typescript
import { useTheme } from '@mui/material';

function ThemedComponent() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        padding: theme.spacing(2)
      }}
    >
      Contenu
    </Box>
  );
}
```

### Couleurs Personnalisées

Voir `src/constants.ts` pour les couleurs définies :

```typescript
import { MAIN_THEME_COLOR, CLASSIFICATION_COLORS } from "@/constants";

const blunderColor = CLASSIFICATION_COLORS.blunder; // #FF6B6B
```

---

## 🧪 Tests

Les composants sont testés avec React Testing Library :

```bash
npm test -- pageTitle.test
```

Exemple de test :

```typescript
import { render } from '@testing-library/react';
import { PageTitle } from '../pageTitle';

test('renders title', () => {
  render(<PageTitle title="Test" />);
  expect(document.title).toBe('Test');
});
```

---

## 📖 Bonnes Pratiques

### 1. Props TypeScript

Toujours typer les props :

```typescript
interface MyComponentProps {
  title: string;
  count?: number;
  onAction: () => void;
}

function MyComponent({ title, count = 0, onAction }: MyComponentProps) {
  // ...
}
```

### 2. Mémoïsation

Utiliser `memo` pour les composants coûteux :

```typescript
import { memo } from "react";

export const ExpensiveComponent = memo(function ExpensiveComponent(props) {
  // Rendu coûteux
});
```

### 3. Accessibilité

Toujours ajouter les attributs ARIA :

```typescript
<button
  aria-label="Annuler le coup"
  onClick={undoMove}
>
  <UndoIcon />
</button>
```

---

## 📚 Ressources

- [Material-UI Documentation](https://mui.com/)
- [React Chessboard](https://github.com/Clariity/react-chessboard)
- [Jotai State Management](https://jotai.org/)
