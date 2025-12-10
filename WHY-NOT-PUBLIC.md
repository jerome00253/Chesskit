# ⚠️ Pourquoi ne PAS générer dans le dossier `public/`

## 🚫 Le problème

Le dossier `public/` de votre projet Chesskit contient **529 fichiers** essentiels :

- 🎵 **Sons** (`sounds/`) - Effets sonores du jeu
- ♟️ **Pièces d'échecs** (`piece/`) - 40+ sets de pièces
- 🤖 **Moteurs Stockfish** (`engines/`) - Fichiers WASM (jusqu'à 75MB)
- 🎨 **Icônes** (`icons/`)
- 🖼️ **Images** (favicons, logos, etc.)

Si vous configurez Next.js pour générer dans `public/`, **tous ces fichiers seront écrasés** à chaque build !

## ✅ Solutions recommandées

### Option 1 : Utiliser le dossier `out/` (Standard Next.js)

**C'est la méthode recommandée par Next.js**

1. Laisser Next.js générer dans `out/`
2. Configurer le Virtual Host pour pointer vers `out/`

```apache
DocumentRoot "c:/Users/jerom/laragon/www/chess/out"
```

**Avantages** :

- ✅ Séparation claire entre sources et build
- ✅ Pas de risque d'écraser les fichiers statiques
- ✅ Standard Next.js
- ✅ Facile à nettoyer (`rm -rf out`)

### Option 2 : Copier vers un dossier personnalisé

Utilisez le script `deploy-to-folder.bat` :

```bash
# Copier vers le dossier par défaut (chess-public)
.\deploy-to-folder.bat

# Ou spécifier un dossier personnalisé
.\deploy-to-folder.bat c:\laragon\www\mon-dossier
```

Puis configurez votre Virtual Host pour pointer vers ce dossier.

**Avantages** :

- ✅ Contrôle total sur le dossier de destination
- ✅ Pas de modification de la configuration Next.js
- ✅ Peut servir plusieurs environnements

### Option 3 : Lien symbolique (Avancé)

Créer un lien symbolique de `public/` vers `out/` :

```powershell
# Attention : cela nécessite des droits administrateur
New-Item -ItemType SymbolicLink -Path "c:\laragon\www\chess-link" -Target "c:\Users\jerom\laragon\www\chess\out"
```

Puis pointer le Virtual Host vers `chess-link/`.

## 🔧 Si vous DEVEZ absolument générer dans `public/`

> [!CAUTION]
> Cette méthode est **fortement déconseillée** car elle écrasera vos fichiers statiques !

Si vous insistez, voici comment faire :

### Étape 1 : Sauvegarder le dossier `public/` actuel

```powershell
# Renommer public en public-assets
Rename-Item public public-assets
```

### Étape 2 : Modifier `next.config.ts`

```typescript
const nextConfig = (phase: string): NextConfig => ({
  output: phase === PHASE_PRODUCTION_BUILD ? "export" : undefined,
  distDir: "public", // Générer dans public
  // ...
});
```

### Étape 3 : Créer un script post-build

Créez `scripts/post-build.js` :

```javascript
const fs = require("fs-extra");
const path = require("path");

// Copier les assets statiques dans le build
const assetsDir = path.join(__dirname, "../public-assets");
const buildDir = path.join(__dirname, "../public");

fs.copySync(assetsDir, buildDir, {
  overwrite: false, // Ne pas écraser les fichiers générés
  filter: (src) => {
    // Ne copier que les fichiers qui n'existent pas déjà
    const dest = src.replace(assetsDir, buildDir);
    return !fs.existsSync(dest);
  },
});

console.log("✅ Assets statiques copiés dans le build");
```

### Étape 4 : Modifier `package.json`

```json
{
  "scripts": {
    "build": "next build && node scripts/post-build.js"
  }
}
```

**Problèmes avec cette approche** :

- ❌ Complexe à maintenir
- ❌ Risque d'écraser des fichiers
- ❌ Builds plus lents
- ❌ Confusion entre sources et build
- ❌ Difficile à déboguer

## 📊 Comparaison des solutions

| Solution                 | Complexité        | Sécurité  | Performance    | Recommandé   |
| ------------------------ | ----------------- | --------- | -------------- | ------------ |
| **Option 1 : out/**      | ⭐ Facile         | ✅ Sûr    | ⚡ Rapide      | ✅ **OUI**   |
| **Option 2 : Copie**     | ⭐⭐ Moyen        | ✅ Sûr    | ⚡ Rapide      | ✅ Oui       |
| **Option 3 : Symlink**   | ⭐⭐⭐ Avancé     | ✅ Sûr    | ⚡ Très rapide | ⚠️ Si expert |
| **Générer dans public/** | ⭐⭐⭐⭐ Complexe | ❌ Risqué | 🐌 Lent        | ❌ **NON**   |

## 🎯 Recommandation finale

**Utilisez l'Option 1** (dossier `out/`) et configurez simplement votre Virtual Host :

```apache
<VirtualHost *:80>
    DocumentRoot "c:/Users/jerom/laragon/www/chess/out"
    ServerName chess.test
    # ... reste de la config
</VirtualHost>
```

C'est :

- ✅ Simple
- ✅ Standard
- ✅ Sûr
- ✅ Rapide
- ✅ Facile à maintenir

## 📚 Ressources

- [Next.js Static Export Documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Next.js Output Configuration](https://nextjs.org/docs/app/api-reference/next-config-js/output)
