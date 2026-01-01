# Documentation Technique : Analyse Tactique (Chesskit)

Ce document détaille l'architecture, le fonctionnement et la logique de validation du système d'analyse tactique de Chesskit. Il est destiné aux développeurs souhaitant maintenir ou étendre le système.

---

## 🏗️ Architecture Globale

Le système d'analyse tactique est modulaire et pipeline. Il prend en entrée une position (FEN) et un coup, et retourne une liste de motifs tactiques validés et priorisés.

### Pipeline d'Exécution (`src/lib/tactical/index.ts`)

1.  **Parsing & Detection** : Lecture du coup et détection brute des motifs géométriques.
2.  **Calcul Matériel** (`material.ts`) : Attribution d'une valeur de gain (points) à chaque motif.
3.  **Validation Stockfish** (`validator.ts`) : Filtrage des "fausses attaques" via l'évaluation moteur.
4.  **Priorisation** (`priority.ts`) : Tri des motifs par importance (Mat > Blunder > Gain).
5.  **Description** (`describer.ts`) : Génération de clés i18n contextuelles.

---

## 🧩 1. Détection des Motifs (Pattern Detection)

Les détecteurs sont situés dans `src/lib/tactical/patterns/`. Ils utilisent `chessops` pour l'analyse géométrique (bitboards, rayons, attaques).

| Motif | Fichier | Logique Clé |
|-------|---------|-------------|
| **Fork** | `forks.ts` | Une pièce attaque 2+ cibles simultanément. |
| **Pin** | `pins.ts` | Détecte *Absolute* (Roi), *Relative* (Pièce majeure) et *Unpinning*. |
| **Skewer** | `pins.ts` | Comme un Pin, mais la pièce de valeur est devant. |
| **Discovery** | `discovered.ts` | Une pièce bouge et démasque une attaque (ou échec) d'une autre. |
| **Hanging** | `safety.ts` | Pièces laissées sans défense ou en prise. |
| **X-Ray** | `xray.ts` | Attaque à travers une pièce ennemie. |

**Note Dev** : Chaque détecteur retourne un tableau de `TacticalPattern`. Il est crucial d'y inclure les `squares` et `pieces` impliqués pour la description.

---

## 💰 2. Calculateur de Matériel (`material.ts`)

Chaque motif détecté se voit attribuer un score de `gain` (si applicable).

*   **Valeurs** : Pion=1, Cavalier/Fou=3, Tour=5, Dame=9.
*   **Logique** :
    *   *Fork* : Valeur de la 2ème meilleure cible (on suppose qu'on perd la meilleure).
    *   *Pin* : Valeur de la pièce qui ne peut pas bouger ou qui est menacée.
    *   *Skewer* : Valeur de la pièce "derrière" l'enfilade qui sera gagnée.
    *   *X-Ray* : Valeur de la cible finale.

---

## 🛡️ 3. Validation Stockfish (`validator.ts`)

C'est le "Cerveau" qui empêche les faux positifs. Un motif géométriquement valide peut être une erreur tactique grossière.

### Fonction `validatePattern(pattern, evalBefore, evalAfter)`

Le système compare l'évaluation (en centipions) avant et après le coup.

*   **Règle de base** : Si le coup entraîne une perte significative d'évaluation (ex: chute de -2.0 points), le motif est marqué comme "Fausse Attaque" (`isFalseAttack = true`).
*   **Seuil de Blunder** : Défini par `BLUNDER_THRESHOLD` (par défaut -150 centipions).
*   **Résultat** : Seuls les patterns où `validation.isValid === true` sont conservés pour l'affichage final.

> **Exemple** : Un Cavalier fait une fourchette Royale (Roi/Dame) mais se met en prise d'un Pion.
> -> Detection: Fork (Gain 9).
> -> Stockfish: Eval passe de +0.5 à -2.5.
> -> Validator: `isValid = false`. La fourchette est rejetée.

---

## 🥇 4. Système de Priorité (`priority.ts`)

Quand plusieurs motifs sont détectés sur un même coup (ex: Echec + Fourchette), il faut décider duquel parler.

### Niveaux de Priorité (`PRIORITIES`)

1.  **Checkmate** (100)
2.  **Blunder** (90) - *Erreurs critiques (Reine en prise...)*
3.  **Hanging Piece** (85) - *Si pièce majeure*
4.  **Menaces Directes** (Promotion, Double Check) (75-80)
5.  **Gain Matériel** (Fork, Skewer, Pin) (50-60)
    *   *Bonus dynamique* : +2 points de priorité par point de matériel gagné.
    *   Une Fourchette gagnant une Dame (60 + 9*2 = 78) passera devant un Echec simple (70).

---

## 💬 5. Descriptions Contextuelles (`describer.ts`)

Génère les clés de traduction pour `src/messages/*.json`.

*   **Smart Keys** : Le système choisit la clé la plus précise selon le contexte.
    *   `fork` (défaut)
    *   `fork_gain` (si gain matériel > 3)
*   **Paramètres** : Injecte les noms de pièces et cases (`{piece}`, `{square}`, `{gain}`).

---

## 🧪 Tests et Vérification pour Développeurs

Pour tester ou ajouter un nouveau motif :

1.  **Ajouter la détection** dans un fichier `src/lib/tactical/patterns/mon_motif.ts`.
2.  **Calculer le gain** matériel théorique.
3.  **Vérifier la validation** :
    *   Jouer un coup dans l'interface qui crée ce motif mais qui est une gaffe.
    *   Vérifier dans la console que `Refuted False Attack` apparaît.
4.  **Vérifier la priorité** :
    *   Créer une position où ce motif coexiste avec un Echec simple.
    *   Vérifier que le motif le plus "couteux" est affiché en premier.
5.  **Traductions** : Ajouter les clés dans `src/messages/en.json` (et autres langues).

### Commandes utiles

*   Lancer le serveur de dev : `npm run dev`
*   Les logs de validation apparaissent dans la console du navigateur lors de l'analyse.
