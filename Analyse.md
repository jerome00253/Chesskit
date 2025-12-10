# Analyse de l'Application Chesskit

## Vue d'ensemble

**Chesskit** est une application web d'échecs open-source complète qui permet de jouer, visualiser, analyser et réviser des parties d'échecs gratuitement sur n'importe quel appareil avec Stockfish.

- **Site web** : [chesskit.org](https://chesskit.org/)
- **Licence** : GNU Affero General Public License 3.0
- **Version** : 0.1.0

---

## Architecture Technique

### Stack Technologique

<pre><div node="[object Object]" class="mermaid-wrapper relative my-4"><div><svg aria-roledescription="flowchart-v2" viewBox="0 0 2031.403076171875 278" class="flowchart" xmlns="http://www.w3.org/2000/svg" width="100%" id="mermaid-w42uipecv"><g><marker orient="auto" markerHeight="8" markerWidth="8" markerUnits="userSpaceOnUse" refY="5" refX="5" viewBox="0 0 10 10" class="marker flowchart-v2" id="mermaid-w42uipecv_flowchart-v2-pointEnd"><path class="arrowMarkerPath" d="M 0 0 L 10 5 L 0 10 z"></path></marker><marker orient="auto" markerHeight="8" markerWidth="8" markerUnits="userSpaceOnUse" refY="5" refX="4.5" viewBox="0 0 10 10" class="marker flowchart-v2" id="mermaid-w42uipecv_flowchart-v2-pointStart"><path class="arrowMarkerPath" d="M 0 5 L 10 10 L 10 0 z"></path></marker><marker orient="auto" markerHeight="11" markerWidth="11" markerUnits="userSpaceOnUse" refY="5" refX="11" viewBox="0 0 10 10" class="marker flowchart-v2" id="mermaid-w42uipecv_flowchart-v2-circleEnd"><circle class="arrowMarkerPath" r="5" cy="5" cx="5"></circle></marker><marker orient="auto" markerHeight="11" markerWidth="11" markerUnits="userSpaceOnUse" refY="5" refX="-1" viewBox="0 0 10 10" class="marker flowchart-v2" id="mermaid-w42uipecv_flowchart-v2-circleStart"><circle class="arrowMarkerPath" r="5" cy="5" cx="5"></circle></marker><marker orient="auto" markerHeight="11" markerWidth="11" markerUnits="userSpaceOnUse" refY="5.2" refX="12" viewBox="0 0 11 11" class="marker cross flowchart-v2" id="mermaid-w42uipecv_flowchart-v2-crossEnd"><path class="arrowMarkerPath" d="M 1,1 l 9,9 M 10,1 l -9,9"></path></marker><marker orient="auto" markerHeight="11" markerWidth="11" markerUnits="userSpaceOnUse" refY="5.2" refX="-1" viewBox="0 0 11 11" class="marker cross flowchart-v2" id="mermaid-w42uipecv_flowchart-v2-crossStart"><path class="arrowMarkerPath" d="M 1,1 l 9,9 M 10,1 l -9,9"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path marker-end="url(#mermaid-w42uipecv_flowchart-v2-pointEnd)" data-points="W3sieCI6MzYxLjU5MDYyNTc2MjkzOTQ1LCJ5Ijo1NC43MDUzMjY3MTMzNjM1OX0seyJ4IjoyMjkuMTI4MTI0MjM3MDYwNTUsInkiOjg3fSx7IngiOjIyOS4xMjgxMjQyMzcwNjA1NSwieSI6MTEyfV0=" data-id="L_A_B_0" data-et="edge" data-edge="true" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" id="L_A_B_0" d="M361.591,54.705L339.514,60.088C317.436,65.47,273.282,76.235,251.205,85.118C229.128,94,229.128,101,229.128,104.5L229.128,108"></path><path marker-end="url(#mermaid-w42uipecv_flowchart-v2-pointEnd)" data-points="W3sieCI6NDQyLjQxNTYyMjcxMTE4MTY0LCJ5Ijo2Mn0seyJ4Ijo0NDIuNDE1NjIyNzExMTgxNjQsInkiOjg3fSx7IngiOjQ0Mi40MTU2MjI3MTExODE2NCwieSI6MTEyfV0=" data-id="L_A_C_0" data-et="edge" data-edge="true" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" id="L_A_C_0" d="M442.416,62L442.416,66.167C442.416,70.333,442.416,78.667,442.416,86.333C442.416,94,442.416,101,442.416,104.5L442.416,108"></path><path marker-end="url(#mermaid-w42uipecv_flowchart-v2-pointEnd)" data-points="W3sieCI6MTYxLjA3NDgxOTM0NDc0MDY2LCJ5IjoxNjZ9LHsieCI6OTguMDYyNSwieSI6MTkxfSx7IngiOjk4LjA2MjUsInkiOjIxNn1d" data-id="L_B_D_0" data-et="edge" data-edge="true" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" id="L_B_D_0" d="M161.075,166L150.573,170.167C140.071,174.333,119.067,182.667,108.565,190.333C98.063,198,98.063,205,98.063,208.5L98.063,212"></path><path marker-end="url(#mermaid-w42uipecv_flowchart-v2-pointEnd)" data-points="W3sieCI6Mjk3LjE4MTQyOTEyOTM4MDQzLCJ5IjoxNjZ9LHsieCI6MzYwLjE5Mzc0ODQ3NDEyMTEsInkiOjE5MX0seyJ4IjozNjAuMTkzNzQ4NDc0MTIxMSwieSI6MjE2fV0=" data-id="L_B_E_0" data-et="edge" data-edge="true" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" id="L_B_E_0" d="M297.181,166L307.683,170.167C318.186,174.333,339.19,182.667,349.692,190.333C360.194,198,360.194,205,360.194,208.5L360.194,212"></path><path marker-end="url(#mermaid-w42uipecv_flowchart-v2-pointEnd)" data-points="W3sieCI6NTIzLjI0MDYxOTY1OTQyMzgsInkiOjUzLjkyOTg0OTM5NzI0Nzc2NH0seyJ4Ijo2NjQuNDQwNjI0MjM3MDYwNSwieSI6ODd9LHsieCI6NjY0LjQ0MDYyNDIzNzA2MDUsInkiOjExMn1d" data-id="L_A_F_0" data-et="edge" data-edge="true" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" id="L_A_F_0" d="M523.241,53.93L546.774,59.442C570.307,64.953,617.374,75.977,640.907,84.988C664.441,94,664.441,101,664.441,104.5L664.441,108"></path><path marker-end="url(#mermaid-w42uipecv_flowchart-v2-pointEnd)" data-points="W3sieCI6ODY5LjkwOTM3NDIzNzA2MDUsInkiOjYyfSx7IngiOjg2OS45MDkzNzQyMzcwNjA1LCJ5Ijo4N30seyJ4Ijo4NjkuOTA5Mzc0MjM3MDYwNSwieSI6MTEyfV0=" data-id="L_G_H_0" data-et="edge" data-edge="true" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" id="L_G_H_0" d="M869.909,62L869.909,66.167C869.909,70.333,869.909,78.667,869.909,86.333C869.909,94,869.909,101,869.909,104.5L869.909,108"></path><path marker-end="url(#mermaid-w42uipecv_flowchart-v2-pointEnd)" data-points="W3sieCI6MTA2Ni40NDY4NzI3MTExODE2LCJ5Ijo2Mn0seyJ4IjoxMDY2LjQ0Njg3MjcxMTE4MTYsInkiOjg3fSx7IngiOjEwNjYuNDQ2ODcyNzExMTgxNiwieSI6MTEyfV0=" data-id="L_I_J_0" data-et="edge" data-edge="true" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" id="L_I_J_0" d="M1066.447,62L1066.447,66.167C1066.447,70.333,1066.447,78.667,1066.447,86.333C1066.447,94,1066.447,101,1066.447,104.5L1066.447,108"></path><path marker-end="url(#mermaid-w42uipecv_flowchart-v2-pointEnd)" data-points="W3sieCI6MTI4Ny43NzgxMTgxMzM1NDUsInkiOjYyfSx7IngiOjEyODcuNzc4MTE4MTMzNTQ1LCJ5Ijo4N30seyJ4IjoxMjg3Ljc3ODExODEzMzU0NSwieSI6MTEyfV0=" data-id="L_K_L_0" data-et="edge" data-edge="true" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" id="L_K_L_0" d="M1287.778,62L1287.778,66.167C1287.778,70.333,1287.778,78.667,1287.778,86.333C1287.778,94,1287.778,101,1287.778,104.5L1287.778,108"></path><path marker-end="url(#mermaid-w42uipecv_flowchart-v2-pointEnd)" data-points="W3sieCI6MTUwNy40NzE4NjY2MDc2NjYsInkiOjYyfSx7IngiOjE1MDcuNDcxODY2NjA3NjY2LCJ5Ijo4N30seyJ4IjoxNTA3LjQ3MTg2NjYwNzY2NiwieSI6MTEyfV0=" data-id="L_M_N_0" data-et="edge" data-edge="true" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" id="L_M_N_0" d="M1507.472,62L1507.472,66.167C1507.472,70.333,1507.472,78.667,1507.472,86.333C1507.472,94,1507.472,101,1507.472,104.5L1507.472,108"></path><path marker-end="url(#mermaid-w42uipecv_flowchart-v2-pointEnd)" data-points="W3sieCI6MTcyOC44MDMxMTIwMzAwMjkzLCJ5Ijo2Mn0seyJ4IjoxNzI4LjgwMzExMjAzMDAyOTMsInkiOjg3fSx7IngiOjE3MjguODAzMTEyMDMwMDI5MywieSI6MTEyfV0=" data-id="L_O_P_0" data-et="edge" data-edge="true" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" id="L_O_P_0" d="M1728.803,62L1728.803,66.167C1728.803,70.333,1728.803,78.667,1728.803,86.333C1728.803,94,1728.803,101,1728.803,104.5L1728.803,108"></path><path marker-end="url(#mermaid-w42uipecv_flowchart-v2-pointEnd)" data-points="W3sieCI6MTkzOC4zNTMxMDc0NTIzOTI2LCJ5Ijo2Mn0seyJ4IjoxOTM4LjM1MzEwNzQ1MjM5MjYsInkiOjg3fSx7IngiOjE5MzguMzUzMTA3NDUyMzkyNiwieSI6MTEyfV0=" data-id="L_Q_R_0" data-et="edge" data-edge="true" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" id="L_Q_R_0" d="M1938.353,62L1938.353,66.167C1938.353,70.333,1938.353,78.667,1938.353,86.333C1938.353,94,1938.353,101,1938.353,104.5L1938.353,108"></path></g><g class="edgeLabels"><g class="edgeLabel"><g transform="translate(0, 0)" data-id="L_A_B_0" class="label"><foreignObject height="0" width="0"></foreignObject></g></g><g class="edgeLabel"><g transform="translate(0, 0)" data-id="L_A_C_0" class="label"><foreignObject height="0" width="0"></foreignObject></g></g><g class="edgeLabel"><g transform="translate(0, 0)" data-id="L_B_D_0" class="label"><foreignObject height="0" width="0"></foreignObject></g></g><g class="edgeLabel"><g transform="translate(0, 0)" data-id="L_B_E_0" class="label"><foreignObject height="0" width="0"></foreignObject></g></g><g class="edgeLabel"><g transform="translate(0, 0)" data-id="L_A_F_0" class="label"><foreignObject height="0" width="0"></foreignObject></g></g><g class="edgeLabel"><g transform="translate(0, 0)" data-id="L_G_H_0" class="label"><foreignObject height="0" width="0"></foreignObject></g></g><g class="edgeLabel"><g transform="translate(0, 0)" data-id="L_I_J_0" class="label"><foreignObject height="0" width="0"></foreignObject></g></g><g class="edgeLabel"><g transform="translate(0, 0)" data-id="L_K_L_0" class="label"><foreignObject height="0" width="0"></foreignObject></g></g><g class="edgeLabel"><g transform="translate(0, 0)" data-id="L_M_N_0" class="label"><foreignObject height="0" width="0"></foreignObject></g></g><g class="edgeLabel"><g transform="translate(0, 0)" data-id="L_O_P_0" class="label"><foreignObject height="0" width="0"></foreignObject></g></g><g class="edgeLabel"><g transform="translate(0, 0)" data-id="L_Q_R_0" class="label"><foreignObject height="0" width="0"></foreignObject></g></g></g><g class="nodes"><g transform="translate(442.41562271118164, 35)" id="flowchart-A-0" class="node default"><rect height="54" width="161.6500015258789" y="-27" x="-80.82500076293945" class="basic label-container"></rect><g transform="translate(-50.82500076293945, -12)" class="label"><rect></rect><foreignObject height="24" width="101.6500015258789">Next.js 15.2.4</foreignObject></g></g><g transform="translate(229.12812423706055, 139)" id="flowchart-B-1" class="node default"><rect height="54" width="150.20000457763672" y="-27" x="-75.10000228881836" class="basic label-container"></rect><g transform="translate(-45.10000228881836, -12)" class="label"><rect></rect><foreignObject height="24" width="90.20000457763672">React 18.3.1</foreignObject></g></g><g transform="translate(442.41562271118164, 139)" id="flowchart-C-3" class="node default"><rect height="54" width="176.375" y="-27" x="-88.1875" class="basic label-container"></rect><g transform="translate(-58.1875, -12)" class="label"><rect></rect><foreignObject height="24" width="116.375">TypeScript 5.7.2</foreignObject></g></g><g transform="translate(98.0625, 243)" id="flowchart-D-5" class="node default"><rect height="54" width="180.125" y="-27" x="-90.0625" class="basic label-container"></rect><g transform="translate(-60.0625, -12)" class="label"><rect></rect><foreignObject height="24" width="120.125">Material UI 6.3.0</foreignObject></g></g><g transform="translate(360.1937484741211, 243)" id="flowchart-E-7" class="node default"><rect height="54" width="244.1374969482422" y="-27" x="-122.0687484741211" class="basic label-container"></rect><g transform="translate(-92.0687484741211, -12)" class="label"><rect></rect><foreignObject height="24" width="184.1374969482422">Jotai - State Management</foreignObject></g></g><g transform="translate(664.4406242370605, 139)" id="flowchart-F-9" class="node default"><rect height="54" width="167.6750030517578" y="-27" x="-83.8375015258789" class="basic label-container"></rect><g transform="translate(-53.837501525878906, -12)" class="label"><rect></rect><foreignObject height="24" width="107.67500305175781">next-intl - i18n</foreignObject></g></g><g transform="translate(869.9093742370605, 35)" id="flowchart-G-10" class="node default"><rect height="54" width="116.5625" y="-27" x="-58.28125" class="basic label-container"></rect><g transform="translate(-28.28125, -12)" class="label"><rect></rect><foreignObject height="24" width="56.5625">chess.js</foreignObject></g></g><g transform="translate(869.9093742370605, 139)" id="flowchart-H-11" class="node default"><rect height="54" width="143.26250457763672" y="-27" x="-71.63125228881836" class="basic label-container"></rect><g transform="translate(-41.63125228881836, -12)" class="label"><rect></rect><foreignObject height="24" width="83.26250457763672">Game Logic</foreignObject></g></g><g transform="translate(1066.4468727111816, 35)" id="flowchart-I-12" class="node default"><rect height="54" width="176.51250457763672" y="-27" x="-88.25625228881836" class="basic label-container"></rect><g transform="translate(-58.25625228881836, -12)" class="label"><rect></rect><foreignObject height="24" width="116.51250457763672">Stockfish Engine</foreignObject></g></g><g transform="translate(1066.4468727111816, 139)" id="flowchart-J-13" class="node default"><rect height="54" width="116.7125015258789" y="-27" x="-58.35625076293945" class="basic label-container"></rect><g transform="translate(-28.356250762939453, -12)" class="label"><rect></rect><foreignObject height="24" width="56.712501525878906">Analysis</foreignObject></g></g><g transform="translate(1287.778118133545, 35)" id="flowchart-K-14" class="node default"><rect height="54" width="166.1500015258789" y="-27" x="-83.07500076293945" class="basic label-container"></rect><g transform="translate(-53.07500076293945, -12)" class="label"><rect></rect><foreignObject height="24" width="106.1500015258789">IndexedDB/idb</foreignObject></g></g><g transform="translate(1287.778118133545, 139)" id="flowchart-L-15" class="node default"><rect height="54" width="156.5625" y="-27" x="-78.28125" class="basic label-container"></rect><g transform="translate(-48.28125, -12)" class="label"><rect></rect><foreignObject height="24" width="96.5625">Local Storage</foreignObject></g></g><g transform="translate(1507.471866607666, 35)" id="flowchart-M-16" class="node default"><rect height="54" width="120.4375" y="-27" x="-60.21875" class="basic label-container"></rect><g transform="translate(-30.21875, -12)" class="label"><rect></rect><foreignObject height="24" width="60.4375">Firebase</foreignObject></g></g><g transform="translate(1507.471866607666, 139)" id="flowchart-N-17" class="node default"><rect height="54" width="182.82500457763672" y="-27" x="-91.41250228881836" class="basic label-container"></rect><g transform="translate(-61.41250228881836, -12)" class="label"><rect></rect><foreignObject height="24" width="122.82500457763672">Backend Services</foreignObject></g></g><g transform="translate(1728.8031120300293, 35)" id="flowchart-O-18" class="node default"><rect height="54" width="105.625" y="-27" x="-52.8125" class="basic label-container"></rect><g transform="translate(-22.8125, -12)" class="label"><rect></rect><foreignObject height="24" width="45.625">Sentry</foreignObject></g></g><g transform="translate(1728.8031120300293, 139)" id="flowchart-P-19" class="node default"><rect height="54" width="159.8375015258789" y="-27" x="-79.91875076293945" class="basic label-container"></rect><g transform="translate(-49.91875076293945, -12)" class="label"><rect></rect><foreignObject height="24" width="99.8375015258789">Error Tracking</foreignObject></g></g><g transform="translate(1938.3531074523926, 35)" id="flowchart-Q-20" class="node default"><rect height="54" width="170.0999984741211" y="-27" x="-85.04999923706055" class="basic label-container"></rect><g transform="translate(-55.04999923706055, -12)" class="label"><rect></rect><foreignObject height="24" width="110.0999984741211">TanStack Query</foreignObject></g></g><g transform="translate(1938.3531074523926, 139)" id="flowchart-R-21" class="node default"><rect height="54" width="159.26250457763672" y="-27" x="-79.63125228881836" class="basic label-container"></rect><g transform="translate(-49.63125228881836, -12)" class="label"><rect></rect><foreignObject height="24" width="99.26250457763672">Data Fetching</foreignObject></g></g></g></g></g></svg></div></div></pre>

### Dépendances Principales

#### Core Framework

- **Next.js 15.2.4** : Framework React avec SSG (Static Site Generation)
- **React 18.3.1** : Bibliothèque UI
- **TypeScript 5.7.2** : Typage statique

#### UI & Styling

- **Material UI (@mui/material) 6.3.0** : Composants UI
- **@emotion/react & @emotion/styled** : CSS-in-JS
- **@iconify/react** : Icônes
- **react-chessboard 4.7.3** : Composant échiquier

#### State Management & Data

- **Jotai 2.11.0** : Gestion d'état atomique
- **@tanstack/react-query 5.75.5** : Gestion des requêtes
- **idb 8.0.1** : Wrapper IndexedDB
- **Firebase 11.1.0** : Services backend

#### Chess Logic

- **chess.js 1.4.0** : Moteur de logique d'échecs
- **Stockfish** : Moteur d'analyse (plusieurs versions disponibles)

#### Visualisation

- **recharts 2.15.0** : Graphiques pour l'évaluation

#### Internationalisation

- **next-intl 4.5.8** : Support multilingue

---

## Structure du Projet

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk1">chess/</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1">├── src/</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1">│   ├── components/        # Composants réutilisables</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1">│   ├── constants.ts       # Constantes globales</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1">│   ├── data/             # Données statiques (openings)</span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk1">│   ├── hooks/            # Custom React hooks</span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk1">│   ├── lib/              # Utilitaires et helpers</span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk1">│   │   ├── chess.ts      # Logique chess.js</span></div></div><div class="code-line" data-line-number="9" data-line-start="9" data-line-end="9"><div class="line-content"><span class="mtk1">│   │   ├── engine/       # Gestion Stockfish</span></div></div><div class="code-line" data-line-number="10" data-line-start="10" data-line-end="10"><div class="line-content"><span class="mtk1">│   │   ├── chessCom.ts   # Intégration Chess.com</span></div></div><div class="code-line" data-line-number="11" data-line-start="11" data-line-end="11"><div class="line-content"><span class="mtk1">│   │   └── lichess.ts    # Intégration Lichess</span></div></div><div class="code-line" data-line-number="12" data-line-start="12" data-line-end="12"><div class="line-content"><span class="mtk1">│   ├── messages/         # Fichiers i18n</span></div></div><div class="code-line" data-line-number="13" data-line-start="13" data-line-end="13"><div class="line-content"><span class="mtk1">│   ├── pages/            # Pages Next.js</span></div></div><div class="code-line" data-line-number="14" data-line-start="14" data-line-end="14"><div class="line-content"><span class="mtk1">│   │   ├── [locale]/     # Routes localisées</span></div></div><div class="code-line" data-line-number="15" data-line-start="15" data-line-end="15"><div class="line-content"><span class="mtk1">│   │   │   ├── index.tsx     # Analyse</span></div></div><div class="code-line" data-line-number="16" data-line-start="16" data-line-end="16"><div class="line-content"><span class="mtk1">│   │   │   ├── play.tsx      # Jouer</span></div></div><div class="code-line" data-line-number="17" data-line-start="17" data-line-end="17"><div class="line-content"><span class="mtk1">│   │   │   └── database.tsx  # Base de données</span></div></div><div class="code-line" data-line-number="18" data-line-start="18" data-line-end="18"><div class="line-content"><span class="mtk1">│   │   └── index.tsx     # Redirection locale</span></div></div><div class="code-line" data-line-number="19" data-line-start="19" data-line-end="19"><div class="line-content"><span class="mtk1">│   ├── sections/         # Sections de l'application</span></div></div><div class="code-line" data-line-number="20" data-line-start="20" data-line-end="20"><div class="line-content"><span class="mtk1">│   │   ├── analysis/     # Section analyse</span></div></div><div class="code-line" data-line-number="21" data-line-start="21" data-line-end="21"><div class="line-content"><span class="mtk1">│   │   ├── play/         # Section jeu</span></div></div><div class="code-line" data-line-number="22" data-line-start="22" data-line-end="22"><div class="line-content"><span class="mtk1">│   │   ├── loadGame/     # Chargement de parties</span></div></div><div class="code-line" data-line-number="23" data-line-start="23" data-line-end="23"><div class="line-content"><span class="mtk1">│   │   ├── engineSettings/ # Paramètres moteur</span></div></div><div class="code-line" data-line-number="24" data-line-start="24" data-line-end="24"><div class="line-content"><span class="mtk1">│   │   └── layout/       # Layout global</span></div></div><div class="code-line" data-line-number="25" data-line-start="25" data-line-end="25"><div class="line-content"><span class="mtk1">│   └── types/            # Définitions TypeScript</span></div></div><div class="code-line" data-line-number="26" data-line-start="26" data-line-end="26"><div class="line-content"><span class="mtk1">├── public/               # Assets statiques</span></div></div><div class="code-line" data-line-number="27" data-line-start="27" data-line-end="27"><div class="line-content"><span class="mtk1">├── cdk/                  # Infrastructure AWS CDK</span></div></div><div class="code-line" data-line-number="28" data-line-start="28" data-line-end="28"><div class="line-content"><span class="mtk1">├── docker/               # Configuration Docker</span></div></div><div class="code-line" data-line-number="29" data-line-start="29" data-line-end="29"><div class="line-content"><span class="mtk1">└── next.config.ts        # Configuration Next.js</span></div></div></div></div></div></pre>

---

## Fonctionnalités Principales

### 1. **Analyse de Parties** 📊

#### Chargement de Parties

- Import PGN manuel
- Import depuis Chess.com (via username)
- Import depuis Lichess.org (via username)
- Support Chess960 et puzzles

#### Moteur d'Analyse

Le système supporte plusieurs versions de Stockfish:

| Moteur              | Taille | Type |
| ------------------- | ------ | ---- |
| Stockfish 17        | 75MB   | NNUE |
| Stockfish 17 Lite   | 6MB    | NNUE |
| Stockfish 16.1      | 64MB   | NNUE |
| Stockfish 16.1 Lite | 6MB    | NNUE |
| Stockfish 16 NNUE   | 40MB   | NNUE |
| Stockfish 16 Lite   | 2MB    | HCE  |
| Stockfish 11        | 2MB    | HCE  |

**Paramètres configurables** :

- Profondeur d'analyse (depth)
- Nombre de lignes (MultiPV)
- Nombre de workers (threads)

#### Classification des Coups

Le système classe automatiquement chaque coup selon 9 catégories:

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk6">enum</span><span class="mtk1"></span><span class="mtk17">MoveClassification</span><span class="mtk1"> {</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1"></span><span class="mtk19">Splendid</span><span class="mtk1"></span><span class="mtk3">=</span><span class="mtk1"></span><span class="mtk12">"splendid"</span><span class="mtk1">,      </span><span class="mtk5">// Sacrifice brillant</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1"></span><span class="mtk19">Perfect</span><span class="mtk1"></span><span class="mtk3">=</span><span class="mtk1"></span><span class="mtk12">"perfect"</span><span class="mtk1">,         </span><span class="mtk5">// Coup parfait (seul bon coup)</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1"></span><span class="mtk19">Best</span><span class="mtk1"></span><span class="mtk3">=</span><span class="mtk1"></span><span class="mtk12">"best"</span><span class="mtk1">,              </span><span class="mtk5">// Meilleur coup</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1"></span><span class="mtk19">Excellent</span><span class="mtk1"></span><span class="mtk3">=</span><span class="mtk1"></span><span class="mtk12">"excellent"</span><span class="mtk1">,     </span><span class="mtk5">// Excellent (-2% à 0%)</span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk1"></span><span class="mtk19">Okay</span><span class="mtk1"></span><span class="mtk3">=</span><span class="mtk1"></span><span class="mtk12">"okay"</span><span class="mtk1">,              </span><span class="mtk5">// Correct (-5% à -2%)</span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk1"></span><span class="mtk19">Opening</span><span class="mtk1"></span><span class="mtk3">=</span><span class="mtk1"></span><span class="mtk12">"opening"</span><span class="mtk1">,         </span><span class="mtk5">// Coup d'ouverture connu</span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk1"></span><span class="mtk19">Forced</span><span class="mtk1"></span><span class="mtk3">=</span><span class="mtk1"></span><span class="mtk12">"forced"</span><span class="mtk1">,          </span><span class="mtk5">// Coup forcé (une seule option)</span></div></div><div class="code-line" data-line-number="9" data-line-start="9" data-line-end="9"><div class="line-content"><span class="mtk1"></span><span class="mtk19">Inaccuracy</span><span class="mtk1"></span><span class="mtk3">=</span><span class="mtk1"></span><span class="mtk12">"inaccuracy"</span><span class="mtk1">,  </span><span class="mtk5">// Imprécision (-10% à -5%)</span></div></div><div class="code-line" data-line-number="10" data-line-start="10" data-line-end="10"><div class="line-content"><span class="mtk1"></span><span class="mtk19">Mistake</span><span class="mtk1"></span><span class="mtk3">=</span><span class="mtk1"></span><span class="mtk12">"mistake"</span><span class="mtk1">,        </span><span class="mtk5">// Erreur (-20% à -10%)</span></div></div><div class="code-line" data-line-number="11" data-line-start="11" data-line-end="11"><div class="line-content"><span class="mtk1"></span><span class="mtk19">Blunder</span><span class="mtk1"></span><span class="mtk3">=</span><span class="mtk1"></span><span class="mtk12">"blunder"</span><span class="mtk1"></span><span class="mtk5">// Gaffe (< -20%)</span></div></div><div class="code-line" data-line-number="12" data-line-start="12" data-line-end="12"><div class="line-content"><span class="mtk1">}</span></div></div></div></div></div></pre>

**Algorithme de classification** :

1. **Splendid** :

- Sacrifice de pièce
- N'empire pas la position (< -2%)
- Pas en position perdante
- Alternative pas complètement gagnante

1. **Perfect** :

- Seul bon coup disponible (>10% meilleur que l'alternative)
- OU change l'issue de la partie (de perdant à gagnant)
- Pas une simple recapture

1. **Best** : Coup recommandé par le moteur
2. **Autres** : Basé sur la perte de pourcentage de victoire

#### Visualisations

- **Graphique d'évaluation** : Évolution de l'avantage au fil de la partie
- **Tableau de classification** : Récapitulatif des coups par joueur
- **Flèches** : Meilleur coup suggéré
- **Icônes** : Classification visuelle de chaque coup

### 2. **Jouer contre Stockfish** ♟️

- Jouer contre le moteur à n'importe quel niveau ELO
- Choix de la couleur
- Sauvegarde automatique des parties
- Analyse post-partie

### 3. **Base de Données Locale** 💾

#### Stockage IndexedDB

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk6">interface</span><span class="mtk1"></span><span class="mtk17">GameDatabaseSchema</span><span class="mtk1"> {</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1"></span><span class="mtk10">games</span><span class="mtk3">:</span><span class="mtk1"> {</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1"></span><span class="mtk10">value</span><span class="mtk3">:</span><span class="mtk1"></span><span class="mtk17">Game</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1"></span><span class="mtk10">key</span><span class="mtk3">:</span><span class="mtk1"></span><span class="mtk17">number</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1">  }</span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk1">}</span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk6">interface</span><span class="mtk1"></span><span class="mtk17">Game</span><span class="mtk1"> {</span></div></div><div class="code-line" data-line-number="9" data-line-start="9" data-line-end="9"><div class="line-content"><span class="mtk1"></span><span class="mtk10">id</span><span class="mtk3">?:</span><span class="mtk1"></span><span class="mtk17">number</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="10" data-line-start="10" data-line-end="10"><div class="line-content"><span class="mtk1"></span><span class="mtk10">pgn</span><span class="mtk3">:</span><span class="mtk1"></span><span class="mtk17">string</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="11" data-line-start="11" data-line-end="11"><div class="line-content"><span class="mtk1"></span><span class="mtk10">event</span><span class="mtk3">?:</span><span class="mtk1"></span><span class="mtk17">string</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="12" data-line-start="12" data-line-end="12"><div class="line-content"><span class="mtk1"></span><span class="mtk10">site</span><span class="mtk3">?:</span><span class="mtk1"></span><span class="mtk17">string</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="13" data-line-start="13" data-line-end="13"><div class="line-content"><span class="mtk1"></span><span class="mtk10">date</span><span class="mtk3">?:</span><span class="mtk1"></span><span class="mtk17">string</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="14" data-line-start="14" data-line-end="14"><div class="line-content"><span class="mtk1"></span><span class="mtk10">round</span><span class="mtk3">:</span><span class="mtk1"></span><span class="mtk17">string</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="15" data-line-start="15" data-line-end="15"><div class="line-content"><span class="mtk1"></span><span class="mtk10">white</span><span class="mtk3">:</span><span class="mtk1"></span><span class="mtk17">Player</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="16" data-line-start="16" data-line-end="16"><div class="line-content"><span class="mtk1"></span><span class="mtk10">black</span><span class="mtk3">:</span><span class="mtk1"></span><span class="mtk17">Player</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="17" data-line-start="17" data-line-end="17"><div class="line-content"><span class="mtk1"></span><span class="mtk10">result</span><span class="mtk3">?:</span><span class="mtk1"></span><span class="mtk17">string</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="18" data-line-start="18" data-line-end="18"><div class="line-content"><span class="mtk1"></span><span class="mtk10">termination</span><span class="mtk3">?:</span><span class="mtk1"></span><span class="mtk17">string</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="19" data-line-start="19" data-line-end="19"><div class="line-content"><span class="mtk1"></span><span class="mtk10">timeControl</span><span class="mtk3">?:</span><span class="mtk1"></span><span class="mtk17">string</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="20" data-line-start="20" data-line-end="20"><div class="line-content"><span class="mtk1"></span><span class="mtk10">eval</span><span class="mtk3">?:</span><span class="mtk1"></span><span class="mtk17">GameEval</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="21" data-line-start="21" data-line-end="21"><div class="line-content"><span class="mtk1">}</span></div></div></div></div></div></pre>

**Opérations** :

- `addGame()`: Ajouter une partie
- getGame(): Récupérer une partie
- `deleteGame()`: Supprimer une partie
- `setGameEval()`: Sauvegarder l'évaluation
- `loadGames()`: Charger toutes les parties

### 4. **Interface Utilisateur** 🎨

#### Responsive Design

- **Mobile** : Tabs pour naviguer entre analyse/coups/graphique
- **Desktop (lg+)** : Affichage simultané de toutes les sections

#### Thème

- Couleur principale: `#3B9AC6`
- Support mode sombre/clair (Material UI)
- 42 sets de pièces disponibles

#### Composants Principaux

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk1">GameAnalysis (index.tsx)</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1">├── Board</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1">│   └── Chessboard (react-chessboard)</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1">├── Panel</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1">│   ├── PanelHeader (joueurs, résultat)</span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk1">│   ├── Tabs (mobile)</span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk1">│   │   ├── AnalysisTab</span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk1">│   │   ├── ClassificationTab</span></div></div><div class="code-line" data-line-number="9" data-line-start="9" data-line-end="9"><div class="line-content"><span class="mtk1">│   │   └── GraphTab</span></div></div><div class="code-line" data-line-number="10" data-line-start="10" data-line-end="10"><div class="line-content"><span class="mtk1">│   └── PanelToolBar (navigation)</span></div></div><div class="code-line" data-line-number="11" data-line-start="11" data-line-end="11"><div class="line-content"><span class="mtk1">└── EngineSettingsButton</span></div></div></div></div></div></pre>

---

## Gestion d'État (Jotai)

### Atoms Principaux

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk5">// Game State</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk20">gameAtom</span><span class="mtk1">: </span><span class="mtk10">Chess</span><span class="mtk1"></span><span class="mtk5">// Partie principale</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk20">boardAtom</span><span class="mtk1">: </span><span class="mtk10">Chess</span><span class="mtk1"></span><span class="mtk5">// Position actuelle</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk20">gameEvalAtom</span><span class="mtk1">: </span><span class="mtk10">GameEval</span><span class="mtk1"></span><span class="mtk3">|</span><span class="mtk1"></span><span class="mtk6">undefined</span><span class="mtk1"></span><span class="mtk5">// Évaluation complète</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk20">currentPositionAtom</span><span class="mtk1">: </span><span class="mtk10">CurrentPosition</span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk5">// UI State</span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk20">boardOrientationAtom</span><span class="mtk1">: </span><span class="mtk10">boolean</span><span class="mtk1"></span><span class="mtk5">// Blanc en bas</span></div></div><div class="code-line" data-line-number="9" data-line-start="9" data-line-end="9"><div class="line-content"><span class="mtk20">showBestMoveArrowAtom</span><span class="mtk1">: </span><span class="mtk10">boolean</span></div></div><div class="code-line" data-line-number="10" data-line-start="10" data-line-end="10"><div class="line-content"><span class="mtk20">showPlayerMoveIconAtom</span><span class="mtk1">: </span><span class="mtk10">boolean</span></div></div><div class="code-line" data-line-number="11" data-line-start="11" data-line-end="11"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="12" data-line-start="12" data-line-end="12"><div class="line-content"><span class="mtk5">// Engine State</span></div></div><div class="code-line" data-line-number="13" data-line-start="13" data-line-end="13"><div class="line-content"><span class="mtk20">engineNameAtom</span><span class="mtk1">: </span><span class="mtk10">EngineName</span></div></div><div class="code-line" data-line-number="14" data-line-start="14" data-line-end="14"><div class="line-content"><span class="mtk20">engineDepthAtom</span><span class="mtk1">: </span><span class="mtk10">number</span><span class="mtk1"></span><span class="mtk5">// Défaut: 14</span></div></div><div class="code-line" data-line-number="15" data-line-start="15" data-line-end="15"><div class="line-content"><span class="mtk20">engineMultiPvAtom</span><span class="mtk1">: </span><span class="mtk10">number</span><span class="mtk1"></span><span class="mtk5">// Défaut: 3</span></div></div><div class="code-line" data-line-number="16" data-line-start="16" data-line-end="16"><div class="line-content"><span class="mtk20">engineWorkersNbAtom</span><span class="mtk1">: </span><span class="mtk10">number</span><span class="mtk1"></span><span class="mtk5">// Auto-détecté</span></div></div><div class="code-line" data-line-number="17" data-line-start="17" data-line-end="17"><div class="line-content"><span class="mtk20">evaluationProgressAtom</span><span class="mtk1">: </span><span class="mtk10">number</span><span class="mtk1"></span><span class="mtk5">// 0-100%</span></div></div><div class="code-line" data-line-number="18" data-line-start="18" data-line-end="18"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="19" data-line-start="19" data-line-end="19"><div class="line-content"><span class="mtk5">// Saved Evaluations</span></div></div><div class="code-line" data-line-number="20" data-line-start="20" data-line-end="20"><div class="line-content"><span class="mtk20">savedEvalsAtom</span><span class="mtk1">: </span><span class="mtk10">SavedEvals</span></div></div></div></div></div></pre>

---

## Intégrations Externes

### Chess.com API

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk5">// Récupération des parties d'un utilisateur</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk16">fetchChessComGames</span><span class="mtk1">(</span><span class="mtk10">username</span><span class="mtk1">: </span><span class="mtk10">string</span><span class="mtk1">)</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1">  → </span><span class="mtk10">Game</span><span class="mtk1">[]</span></div></div></div></div></div></pre>

### Lichess API

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk5">// Récupération des parties d'un utilisateur</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk16">fetchLichessGames</span><span class="mtk1">(</span><span class="mtk10">username</span><span class="mtk1">: </span><span class="mtk10">string</span><span class="mtk1">)</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1">  → </span><span class="mtk10">Game</span><span class="mtk1">[]</span></div></div></div></div></div></pre>

---

## Déploiement

### Configuration

**Mode Production** : Export statique Next.js

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk1">{</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1"></span><span class="mtk20">output</span><span class="mtk1">: </span><span class="mtk12">"export"</span><span class="mtk1">,</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1"></span><span class="mtk20">trailingSlash</span><span class="mtk1">: </span><span class="mtk6">true</span><span class="mtk1">,</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1"></span><span class="mtk20">images</span><span class="mtk1">: { </span><span class="mtk20">unoptimized</span><span class="mtk1">: </span><span class="mtk6">true</span><span class="mtk1"> }</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1">}</span></div></div></div></div></div></pre>

### Infrastructure AWS (CDK)

L'application est déployée sur AWS avec:

- **S3** : Hébergement statique
- **CloudFront** : CDN
- **Route 53** : DNS

### Headers de Sécurité

Pour permettre l'utilisation de SharedArrayBuffer (requis par Stockfish):

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk1">Cross-Origin-Embedder-Policy: require-corp</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1">Cross-Origin-Opener-Policy: same-origin</span></div></div></div></div></div></pre>

### Docker Support

Deux configurations:

- **Dev** : `docker-compose-dev.yml`
- **Prod** : `docker-compose-prod.yml`

---

## Logique Métier Clé

### Évaluation de Partie

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk5">// 1. Extraction des paramètres</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk16">getEvaluateGameParams</span><span class="mtk1">(</span><span class="mtk10">game</span><span class="mtk1">: </span><span class="mtk10">Chess</span><span class="mtk1">)</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1">  → { </span><span class="mtk20">fens</span><span class="mtk1">: </span><span class="mtk10">string</span><span class="mtk1">[], </span><span class="mtk20">uciMoves</span><span class="mtk1">: </span><span class="mtk10">string</span><span class="mtk1">[] }</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk5">// 2. Évaluation par Stockfish (via Worker)</span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk16">evaluatePositions</span><span class="mtk1">(</span><span class="mtk10">fens</span><span class="mtk1">, </span><span class="mtk10">uciMoves</span><span class="mtk1">, </span><span class="mtk10">depth</span><span class="mtk1">, </span><span class="mtk10">multiPv</span><span class="mtk1">)</span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk1">  → </span><span class="mtk10">PositionEval</span><span class="mtk1">[]</span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="9" data-line-start="9" data-line-end="9"><div class="line-content"><span class="mtk5">// 3. Classification des coups</span></div></div><div class="code-line" data-line-number="10" data-line-start="10" data-line-end="10"><div class="line-content"><span class="mtk16">getMovesClassification</span><span class="mtk1">(</span><span class="mtk10">positions</span><span class="mtk1">, </span><span class="mtk10">uciMoves</span><span class="mtk1">, </span><span class="mtk10">fens</span><span class="mtk1">)</span></div></div><div class="code-line" data-line-number="11" data-line-start="11" data-line-end="11"><div class="line-content"><span class="mtk1">  → </span><span class="mtk10">PositionEval</span><span class="mtk1">[] (</span><span class="mtk10">avec</span><span class="mtk1"></span><span class="mtk10">moveClassification</span><span class="mtk1">)</span></div></div><div class="code-line" data-line-number="12" data-line-start="12" data-line-end="12"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="13" data-line-start="13" data-line-end="13"><div class="line-content"><span class="mtk5">// 4. Calcul de précision</span></div></div><div class="code-line" data-line-number="14" data-line-start="14" data-line-end="14"><div class="line-content"><span class="mtk16">calculateAccuracy</span><span class="mtk1">(</span><span class="mtk10">positions</span><span class="mtk1">)</span></div></div><div class="code-line" data-line-number="15" data-line-start="15" data-line-end="15"><div class="line-content"><span class="mtk1">  → { </span><span class="mtk20">white</span><span class="mtk1">: </span><span class="mtk10">number</span><span class="mtk1">, </span><span class="mtk20">black</span><span class="mtk1">: </span><span class="mtk10">number</span><span class="mtk1"> }</span></div></div></div></div></div></pre>

### Pourcentage de Victoire

Conversion centipawns → win percentage:

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk16">getPositionWinPercentage</span><span class="mtk1">(</span><span class="mtk10">position</span><span class="mtk1">: </span><span class="mtk10">PositionEval</span><span class="mtk1">): </span><span class="mtk10">number</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1"></span><span class="mtk5">// Formule basée sur le meilleur coup</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1"></span><span class="mtk5">// Mate: 0% ou 100%</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1"></span><span class="mtk5">// CP: Formule logistique</span></div></div></div></div></div></pre>

### Estimation ELO

Basée sur la précision moyenne:

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk16">estimateElo</span><span class="mtk1">(</span><span class="mtk10">accuracy</span><span class="mtk1">: </span><span class="mtk10">number</span><span class="mtk1">): </span><span class="mtk10">number</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1"></span><span class="mtk5">// Mapping précision → ELO estimé</span></div></div></div></div></div></pre>

---

## Tests

### Configuration Jest

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk1">{</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1"></span><span class="mtk20">testEnvironment</span><span class="mtk1">: </span><span class="mtk12">"jsdom"</span><span class="mtk1">,</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1"></span><span class="mtk20">setupFilesAfterEnv</span><span class="mtk1">: [</span><span class="mtk12">"<rootDir>/jest.setup.js"</span><span class="mtk1">],</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1"></span><span class="mtk20">moduleNameMapper</span><span class="mtk1">: {</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1"></span><span class="mtk12">"@/(.*)"</span><span class="mtk1">: </span><span class="mtk12">"<rootDir>/src/$1"</span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk1">  }</span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk1">}</span></div></div></div></div></div></pre>

### Scripts

- `npm test`: Exécuter les tests
- `npm run test:watch`: Mode watch
- `npm run test:coverage`: Rapport de couverture

---

## Internationalisation

### Locales Supportées

Le système utilise `next-intl` avec des routes localisées:

- `/en/` - Anglais
- `/fr/` - Français (probablement)
- Autres locales configurables

### Structure

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk1">src/messages/</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1">├── en.json</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1">└── [autres locales].json</span></div></div></div></div></div></pre>

---

## Performance & Optimisation

### Web Workers

Le moteur Stockfish s'exécute dans un Web Worker pour ne pas bloquer le thread principal:

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk5">// src/lib/engine/worker.ts</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk16">getRecommendedWorkersNb</span><span class="mtk1">(): </span><span class="mtk10">number</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1"></span><span class="mtk5">// Détecte le nombre optimal de workers</span></div></div></div></div></div></pre>

### Lazy Loading

- Moteurs Stockfish chargés à la demande
- Images non optimisées (export statique)

### Caching

- IndexedDB pour les parties
- Évaluations sauvegardées localement

---

## Points d'Amélioration Potentiels

### 1. **Performance**

- ✅ Web Workers déjà utilisés
- 🔄 Possibilité de cache pour les évaluations d'ouvertures
- 🔄 Lazy loading des composants lourds

### 2. **Fonctionnalités**

- 📝 Mode multijoueur en ligne
- 📝 Entraînement tactique
- 📝 Répertoire d'ouvertures personnalisé
- 📝 Export des analyses en PDF

### 3. **UX**

- 🔄 Tutoriel interactif
- 🔄 Thèmes d'échiquier personnalisables
- 🔄 Raccourcis clavier

### 4. **Code Quality**

- ✅ TypeScript strict activé
- ✅ ESLint configuré
- 🔄 Augmenter la couverture de tests
- 🔄 Documentation JSDoc plus complète

---

## Commandes Utiles

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all p-3 my-2 rounded-sm bg-list-hover-subtle"><div><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk5"># Développement</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk16">npm</span><span class="mtk1"></span><span class="mtk12">run</span><span class="mtk1"></span><span class="mtk12">dev</span><span class="mtk1"></span><span class="mtk5"># Serveur dev avec Turbo</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk16">npm</span><span class="mtk1"></span><span class="mtk12">run</span><span class="mtk1"></span><span class="mtk12">lint</span><span class="mtk1"></span><span class="mtk5"># Linting + TypeScript check</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk16">npm</span><span class="mtk1"></span><span class="mtk12">test</span><span class="mtk1"></span><span class="mtk5"># Tests unitaires</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk5"># Production</span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk16">npm</span><span class="mtk1"></span><span class="mtk12">run</span><span class="mtk1"></span><span class="mtk12">build</span><span class="mtk1"></span><span class="mtk5"># Build statique</span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk16">npm</span><span class="mtk1"></span><span class="mtk12">start</span><span class="mtk1"></span><span class="mtk5"># Serveur production</span></div></div><div class="code-line" data-line-number="9" data-line-start="9" data-line-end="9"><div class="line-content"><span class="mtk16">npm</span><span class="mtk1"></span><span class="mtk12">run</span><span class="mtk1"></span><span class="mtk12">deploy</span><span class="mtk1"></span><span class="mtk5"># Déploiement AWS</span></div></div><div class="code-line" data-line-number="10" data-line-start="10" data-line-end="10"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="11" data-line-start="11" data-line-end="11"><div class="line-content"><span class="mtk5"># Analyse</span></div></div><div class="code-line" data-line-number="12" data-line-start="12" data-line-end="12"><div class="line-content"><span class="mtk16">npm</span><span class="mtk1"></span><span class="mtk12">run</span><span class="mtk1"></span><span class="mtk12">analyze</span><span class="mtk1"></span><span class="mtk5"># Bundle analyzer</span></div></div><div class="code-line" data-line-number="13" data-line-start="13" data-line-end="13"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="14" data-line-start="14" data-line-end="14"><div class="line-content"><span class="mtk5"># Docker</span></div></div><div class="code-line" data-line-number="15" data-line-start="15" data-line-end="15"><div class="line-content"><span class="mtk16">docker</span><span class="mtk1"></span><span class="mtk12">compose</span><span class="mtk1"></span><span class="mtk6">-f</span><span class="mtk1"></span><span class="mtk12">./docker/docker-compose-dev.yml</span><span class="mtk1"></span><span class="mtk12">up</span></div></div><div class="code-line" data-line-number="16" data-line-start="16" data-line-end="16"><div class="line-content"><span class="mtk16">docker</span><span class="mtk1"></span><span class="mtk12">compose</span><span class="mtk1"></span><span class="mtk6">-f</span><span class="mtk1"></span><span class="mtk12">./docker/docker-compose-prod.yml</span><span class="mtk1"></span><span class="mtk12">up</span></div></div></div></div></div></pre>

---

## Sécurité

### Licence AGPL-3.0

L'application est sous licence GNU Affero General Public License 3.0, ce qui signifie:

- ✅ Open source
- ✅ Modifications doivent être partagées
- ✅ Utilisation commerciale autorisée
- ⚠️ Obligation de partager le code si déployé en SaaS

### Monitoring

- **Sentry** : Tracking des erreurs en production
- Configuration dans

  sentry.client.config.ts

---

## Conclusion

Chesskit est une application web d'échecs **moderne** , **complète** et **performante** qui offre:

✅ **Analyse professionnelle** avec Stockfish
✅ **Interface intuitive** Material UI responsive
✅ **Architecture solide** Next.js + TypeScript
✅ **Stockage local** IndexedDB pour la vie privée
✅ **Open source** et gratuit
✅ **Déploiement moderne** AWS CDK

L'architecture est bien structurée avec une séparation claire des responsabilités, une gestion d'état efficace avec Jotai, et une excellente expérience utilisateur sur tous les appareils.

Le code est de **haute qualité** avec TypeScript strict, des tests, et une documentation claire. Le projet est activement maintenu et suit les meilleures pratiques du développement web moderne.
