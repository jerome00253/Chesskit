<div align="center">
  <h1 align="center">Chesskit+</h1>
  <p align="center">
    <strong>The "Pro" Evolution of Chesskit: Tactical Analysis, AI & Data Management</strong>
  </p>
</div>
<br />

**Chesskit+** is an advanced fork of the open-source project [Chesskit](https://github.com/GuillaumeSD/Chesskit).  
It enriches the solid foundation of Chesskit with a complete data management ecosystem (Database, Dashboard), "intelligent" tactical analysis, and cutting-edge AI features.

---

## 🙏 Acknowledgment and Credits

This project relies on the excellent work of **GuillaumeSD** and all the contributors of [Chesskit](https://github.com/GuillaumeSD/Chesskit).  
Their vision of an open-source, high-performance, and modern chess application forms the basis of this fork. We would like to salute their major contribution to the free chess community.

---

## 🏗️ Chesskit Foundation (Inherited Features)

Chesskit+ retains the DNA of Chesskit:
*   **Modern Web Platform**: High-performance Next.js / React / TypeScript stack.
*   **Stockfish Engine**: Real-time analysis (WASM) directly in the browser.
*   **Polished Interface**: Responsive chessboard, analysis arrows, evaluation graph.
*   **Interoperability**: PGN, FEN support.

---

## 🚀 What's New in Chesskit+

We have transformed the application into a complete training and analysis suite.

### 🧠 1. The Tactical & AI "Brain"
*   **Semantic Tactical Analysis**: Instead of simple variation lines, the system detects and explains motifs (Forks, Pins, Skewers, Discoveries, Overloads...).
*   **Blunder Detection (Validator)**: An intelligent filter checks if a tactic is valid or if it is a trap (blunder) refuted by Stockfish.
*   **Generative AI Analysis**: AI integration (LLM) to provide natural language game summaries and personalized training advice ("Areas for Improvement").
*   **Critical Moments**: Automatic identification and saving of turning points in the game (moves that shifted the match).
*   **Opening Identification**: Automatic recognition of the played opening (ECO).

### 🗄️ 2. "Pro" Database
The **Database** tab has been entirely redesigned to offer powerful management tools:
*   **Bulk Analysis**: Select 50 games and launch automatic analysis. Come back later to see the results.
*   **Advanced Filters**:
    *   By Result (White/Black Win, Draw).
    *   By Type (Bullet, Blitz, Rapid, Classical).
    *   By Analysis Status (Analyzed / Not Analyzed).
*   **Bulk Actions**: Multiple PGN export, Multiple deletion.
*   **Editing**: Modification of metadata (Names, ELO, Event).
*   **Cloud Synchronization**: Saving analyses to access them from any device.

### 📊 3. Dashboard & Statistics
*   **Performance Dashboard**:
    *   Complete statistical summary (Average accuracy, Win rate).
    *   Annual/Monthly progress tracking.
    *   Trend analysis (frequency of blunders, average accuracy).
*   **Game Recap**: Synthetic view of a game with highlights and advantage charts.

### 🔌 4. Connectivity & Management
*   **Authentication System**: Complete user management (Registration, Login, Profiles).
*   **Automated Imports**: Easy synchronization with your **Chess.com** and **Lichess.org** accounts.
*   **Game Classification**: Automatic sorting by time control (Bullet, Blitz, Rapid, Classical).

### ⚙️ 5. Advanced Engine Control
*   **Stockfish Management**: Fine-grained engine management interface.
    *   Activation/Deactivation.
    *   Threads and Memory (Hash) configuration.
    *   Choice of version (Stockfish 16, Lite, etc.).
*   **Customization**: Advanced configuration of analysis display and comments.

### 🌍 6. Internationalization (i18n)
The application is fully translated and available in 6 languages:
*   🇫🇷 French
*   🇬🇧 English
*   🇪🇸 Spanish
*   🇮🇹 Italian
*   🇵🇹 Portuguese
*   🇳🇱 Dutch

---

## 🛠️ Technical Stack

*   **Frontend**: Next.js 14, React 18, Tailwind/MUI
*   **Backend**: Node.js, Prisma (ORM), Auth.js
*   **Analysis**: Stockfish (WASM), Chessops
*   **AI**: OpenAI API (or compatible)

---

## ⚖️ Rights and License

This project is distributed under the **GNU Affero General Public License 3.0 (AGPL-3.0)**.

**Your rights and duties:**
1.  **Freedom**: You can use, copy, modify, and redistribute this software.
2.  **Open Source**: If you modify this program and make it available to other users (especially via a web service), you **must** publish your modified source code under the same license (AGPL-3.0).
3.  **Credits**: The copyright notices of Chesskit (GuillaumeSD) and this fork must be preserved.

For more details, see the [COPYING](COPYING.md) file.
