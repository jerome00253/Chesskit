# 🚀 Déploiement Rapide - Chesskit sur Laragon

## ⚡ Solution Rapide (3 étapes)

### 1️⃣ Configurer le Virtual Host Apache

Ouvrez le fichier de configuration de votre site dans Laragon :

- Menu Laragon → Apache → `sites-enabled` → `chess.test.conf`

Modifiez le `DocumentRoot` pour pointer vers le dossier `out/` :

```apache
DocumentRoot "c:/Users/jerom/laragon/www/chess/out"
```

Voir le fichier `vhost-example.conf` pour un exemple complet.

### 2️⃣ Redémarrer Apache

Menu Laragon → Apache → Restart

### 3️⃣ Ouvrir dans le navigateur

Allez sur `http://chess.test` (ou votre domaine local)

---

## 📋 Explication

Quand vous faites `npm run build`, Next.js génère les fichiers statiques dans le dossier **`out/`** (pas dans `public/`).

Votre serveur web doit donc pointer vers ce dossier `out/` pour servir l'application.

---

## ⚠️ IMPORTANT : Headers CORS

Les moteurs Stockfish (WASM) nécessitent ces headers :

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

Ces headers sont déjà configurés dans :

- `out/.htaccess` (copié automatiquement)
- `vhost-example.conf` (exemple de configuration)

Vérifiez dans la console du navigateur (F12) :

```javascript
console.log(crossOriginIsolated); // Doit retourner true
```

---

## 🛠️ Scripts disponibles

```bash
# Build l'application
npm run build

# Build + copie .htaccess (automatique)
.\deploy-local.bat

# Développement avec hot reload
npm run dev
```

---

## 📁 Fichiers créés

- `vhost-example.conf` - Exemple de configuration Apache Virtual Host
- `.htaccess.template` - Template de configuration Apache
- `out/.htaccess` - Configuration Apache (copié automatiquement)
- `deploy-local.bat` - Script de déploiement automatique

---

## 📖 Documentation complète

Voir `deployment_guide.md` pour le guide complet avec toutes les options et le dépannage.

---

## ✅ Checklist de vérification

- [ ] Le Virtual Host pointe vers `c:/Users/jerom/laragon/www/chess/out`
- [ ] Apache a été redémarré
- [ ] L'application se charge sur `http://chess.test`
- [ ] `crossOriginIsolated === true` dans la console
- [ ] Les moteurs Stockfish fonctionnent (page `/play`)

---

## 🆘 Problèmes ?

Consultez la section "Dépannage" dans `deployment_guide.md`
