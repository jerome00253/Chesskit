# Technical Documentation: Tactical Analysis (Chesskit)

This document details the architecture, functionality, and validation logic of the Chesskit tactical analysis system. It is intended for developers who wish to maintain or extend the system.

---

## 🏗️ Global Architecture

The tactical analysis system is modular and pipeline-based. It takes a position (FEN) and a move as input, and returns a list of validated and prioritized tactical patterns.

### Execution Pipeline (`src/lib/tactical/index.ts`)

1.  **Parsing & Detection**: Move parsing and raw geometric pattern detection.
2.  **Material Calculation** (`material.ts`): Attribution of a gain value (points) to each pattern.
3.  **Stockfish Validation** (`validator.ts`): Filtering of "false attacks" via engine evaluation.
4.  **Prioritization** (`priority.ts`): Sorting patterns by importance (Mate > Blunder > Gain).
5.  **Description** (`describer.ts`): Generation of contextual i18n keys.

---

## 🧩 1. Pattern Detection

Detectors are located in `src/lib/tactical/patterns/`. They use `chessops` for geometric analysis (bitboards, rays, attacks).

| Pattern | File | Key Logic |
|---------|------|-----------|
| **Fork** | `forks.ts` | A piece attacks 2+ targets simultaneously. |
| **Pin** | `pins.ts` | Detects *Absolute* (King), *Relative* (Major piece), and *Unpinning*. |
| **Skewer** | `pins.ts` | Like a Pin, but the valuable piece is in front. |
| **Discovery** | `discovered.ts` | A piece moves and unmasks an attack (or check) from another. |
| **Hanging** | `safety.ts` | Pieces left undefended or en prise. |
| **X-Ray** | `xray.ts` | Attack through an enemy piece. |

**Dev Note**: Each detector returns an array of `TacticalPattern`. It is crucial to include the involved `squares` and `pieces` for the description.

---

## 💰 2. Material Calculator (`material.ts`)

Each detected pattern is assigned a `gain` score (if applicable).

*   **Values**: Pawn=1, Knight/Bishop=3, Rook=5, Queen=9.
*   **Logic**:
    *   *Fork*: Value of the 2nd best target (assuming the best one is lost/traded).
    *   *Pin*: Value of the piece that cannot move or is threatened.
    *   *Skewer*: Value of the piece "behind" the skewer that will be won.
    *   *X-Ray*: Value of the final target.

---

## 🛡️ 3. Stockfish Validation (`validator.ts`)

This is the "Brain" that prevents false positives. A geometrically valid pattern can be a gross tactical error.

### Function `validatePattern(pattern, evalBefore, evalAfter)`

The system compares the evaluation (in centipawns) before and after the move.

*   **Base Rule**: If the move causes a significant evaluation drop (e.g., drop of -2.0 points), the pattern is marked as a "False Attack" (`isFalseAttack = true`).
*   **Blunder Threshold**: Defined by `BLUNDER_THRESHOLD` (default -150 centipawns).
*   **Result**: Only patterns where `validation.isValid === true` are kept for final display.

> **Example**: A Knight makes a Royal Fork (King/Queen) but puts itself en prise of a Pawn.
> -> Detection: Fork (Gain 9).
> -> Stockfish: Eval goes from +0.5 to -2.5.
> -> Validator: `isValid = false`. The fork is rejected.

---

## 🥇 4. Priority System (`priority.ts`)

When multiple patterns are detected on the same move (e.g., Check + Fork), we must decide which one to talk about.

### Priority Levels (`PRIORITIES`)

1.  **Checkmate** (100)
2.  **Blunder** (90) - *Critical errors (Hanging Queen...)*
3.  **Hanging Piece** (85) - *If major piece*
4.  **Direct Threats** (Promotion, Double Check) (75-80)
5.  **Material Gain** (Fork, Skewer, Pin) (50-60)
    *   *Dynamic Bonus*: +2 priority points per point of material gained.
    *   A Fork winning a Queen (60 + 9*2 = 78) will rank higher than a simple Check (70).

---

## 💬 5. Contextual Descriptions (`describer.ts`)

Generates translation keys for `src/messages/*.json`.

*   **Smart Keys**: The system chooses the most precise key based on context.
    *   `fork` (default)
    *   `fork_gain` (if material gain > 3)
*   **Parameters**: Injects piece names and squares (`{piece}`, `{square}`, `{gain}`).

---

## 🧪 Testing and Verification for Developers

To test or add a new pattern:

1.  **Add detection** in a file `src/lib/tactical/patterns/my_pattern.ts`.
2.  **Calculate the theoretical material gain**.
3.  **Verify validation**:
    *   Play a move in the UI that creates this pattern but is a blunder.
    *   Check in the console that `Refuted False Attack` appears.
4.  **Verify priority**:
    *   Create a position where this pattern coexists with a simple Check.
    *   Verify that the most "costly" pattern is displayed first.
5.  **Translations**: Add keys in `src/messages/en.json` (and other languages).

### Useful commands

*   Start dev server: `npm run dev`
*   Validation logs appear in the browser console during analysis.
