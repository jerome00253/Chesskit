<div align="center">
  <h1 align="center">Chesskit+</h1>
  <p align="center">
    <strong>L'évolution "Pro" de Chesskit : Analyse Tactique, IA & Gestion de Données</strong>
  </p>
</div>
<br />

**Chesskit+** est un fork avancé du projet open-source [Chesskit](https://github.com/GuillaumeSD/Chesskit).  
Il enrichit la base solide de Chesskit avec un écosystème complet de gestion de données (Base de données, Dashboard), une analyse tactique "intelligente" et des fonctionnalités IA de pointe.

---

## 🙏 Remerciements et Crédits

Ce projet repose sur l'excellent travail de **GuillaumeSD** et de tous les contributeurs de [Chesskit](https://github.com/GuillaumeSD/Chesskit).  
Leur vision d'une application d'échecs open-source, performante et moderne constitue le socle de ce fork. Nous tenons à saluer leur contribution majeure à la communauté échiquéenne libre.

---

## 🏗️ Socle Chesskit (Fonctionnalités Héritées)

Chesskit+ conserve l'ADN de Chesskit :
*   **Plateforme Web Moderne** : Stack Next.js / React / TypeScript performante.
*   **Moteur Stockfish** : Analyse en temps réel (WASM) directement dans le navigateur.
*   **Interface Soignée** : Échiquier réactif, flèches d'analyse, graphe d'évaluation.
*   **Interopérabilité** : Support PGN, FEN.

---

## 🚀 Les Nouveautés de Chesskit+

Nous avons transformé l'application en une suite complète d'entraînement et d'analyse.

### 🧠 1. Le "Cerveau" Tactique & IA
*   **Analyse Tactique Sémantique** : Au lieu de simples lignes de variantes, le système détecte et explique les motifs (Fourchettes, Clouages, Enfilades, Découvertes, Surcharges...).
*   **Détection des Gaffes (Validator)** : Un filtre intelligent vérifie si une tactique est valide ou si c'est un piège (gaffe) réfuté par Stockfish.
*   **Analyse IA Générative** : Intégration d'IA (LLM) pour fournir des résumés de partie en langage naturel et des conseils d'entraînement personnalisés ("Axes de travail").
*   **Moments Critiques** : Identification et sauvegarde automatique des tournants de la partie (les coups qui ont fait basculer le match).
*   **Identification des Ouvertures** : Reconnaissance automatique de l'ouverture jouée (ECO).

### 🗄️ 2. Base de Données "Pro"
L'onglet **Database** a été entièrement refondu pour offrir des outils de gestion puissants :
*   **Analyse en Masse (Bulk Analysis)** : Sélectionnez 50 parties et lancez l'analyse automatique. Revenez plus tard pour voir les résultats.
*   **Filtres Avancés** : 
    *   Par Résultat (Victoire Blancs/Noirs, Nulle).
    *   Par Type (Bullet, Blitz, Rapide, Classique).
    *   Par Statut d'Analyse (Analysé / Non Analysé).
*   **Actions Groupées** : Export PGN multiple, Suppression multiple.
*   **Édition** : Modification des métadonnées (Noms, ELO, Événement).
*   **Synchronisation Cloud** : Sauvegarde des analyses pour y accéder depuis n'importe quel appareil.

### 📊 3. Dashboard & Statistiques
*   **Dashboard de Performance** : 
    *   Récapitulatif statistique complet (Précision moyenne, Taux de victoire).
    *   Suivi de progression annuel/mensuel.
    *   Analyse des tendances (fréquence des gaffes, précision moyenne).
*   **Récapitulatif de Partie** : Vue synthétique d'une partie avec les temps forts et graphiques d'avantage.

### 🔌 4. Connectivité & Gestion
*   **Système d'Authentification** : Gestion complète des utilisateurs (Inscription, Connexion, Profils).
*   **Imports Automatisés** : Synchronisation facile avec vos comptes **Chess.com** et **Lichess.org**.
*   **Classification des Parties** : Tri automatique par cadence (Bullet, Blitz, Rapide, Classique).

### ⚙️ 5. Contrôle Moteur Avancé
*   **Gestion Stockfish** : Interface de gestion fine du moteur.
    *   Activation/Désactivation.
    *   Configuration des Threads et de la Mémoire (Hash).
    *   Choix de la version (Stockfish 16, Lite, etc.).
*   **Personnalisation** : Configuration poussée de l'affichage des analyses et des commentaires.

### 🌍 6. Internationalisation (i18n)
L'application est entièrement traduite et disponible en 6 langues :
*   🇫🇷 Français
*   🇬🇧 Anglais
*   🇪🇸 Espagnol
*   🇮🇹 Italien
*   🇵🇹 Portugais
*   🇳🇱 Néerlandais

---

## 🛠️ Stack Technique

*   **Frontend** : Next.js 14, React 18, Tailwind/MUI
*   **Backend** : Node.js, Prisma (ORM), Auth.js
*   **Analysis** : Stockfish (WASM), Chessops
*   **AI** : OpenAI API (ou compatible)

---

## ⚖️ Droits et Licence

Ce projet est distribué sous la licence **GNU Affero General Public License 3.0 (AGPL-3.0)**.

**Vos droits et devoirs :**
1.  **Liberté** : Vous pouvez utiliser, copier, modifier et redistribuer ce logiciel.
2.  **Open Source** : Si vous modifiez ce programme et le mettez à disposition d'autres utilisateurs (notamment via un service web), vous **devez** publier votre code source modifié sous la même licence (AGPL-3.0).
3.  **Crédits** : Les mentions de copyright de Chesskit (GuillaumeSD) et de ce fork doivent être préservées.

Pour plus de détails, consultez le fichier [COPYING](COPYING.md).
