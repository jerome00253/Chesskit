# Configuration Auto-Import

## 🎯 Système Double Redondance

Votre application utilise **deux mécanismes** d'auto-import pour une fiabilité maximale :

### 1️⃣ Client-Side Polling (Actif)
- **Composant** : `<AutoImportMonitor />` dans `_app.tsx`
- **Fréquence** : Vérification toutes les 5 minutes
- **Avantages** : Fonctionne immédiatement, notifications en temps réel
- **Désavantages** : Nécessite navigateur ouvert

### 2️⃣ Server-Side Cron (Production)
- **Endpoint** : `/api/cron/auto-import`
- **Fréquence** : Toutes les 6 heures (configurable dans `vercel.json`)
- **Avantages** : Fonctionne 24/7, même si personne n'est connecté
- **Désavantages** : Nécessite configuration externe

---

## 🚀 Déploiement Vercel

Si vous déployez sur Vercel, le cron est **automatiquement configuré** via `vercel.json`.

### Ajoutez une variable d'environnement (optionnel mais recommandé) :
```
CRON_SECRET=votre-secret-aleatoire-ici
```

Ensuite, configurez votre cron pour envoyer le header :
```
Authorization: Bearer votre-secret-aleatoire-ici
```

---

## 🔧 Alternative : Service Cron Externe

Si vous n'utilisez pas Vercel, configurez un service comme **cron-job.org** :

1. Créez un compte sur https://cron-job.org
2. Ajoutez un nouveau cron job :
   - **URL** : `https://votresite.com/api/cron/auto-import`
   - **Intervalle** : Toutes les 6 heures (ou votre préférence)
   - **Header** (optionnel) : `Authorization: Bearer votre-secret`

---

## ✅ Activation Utilisateur

Chaque utilisateur peut activer/désactiver l'auto-import dans :

**`/fr/profile`** → Section "Import Automatique"

Options configurables :
- ☑️ Activer/Désactiver
- 🎮 Plateformes (Chess.com / Lichess)
- ⏱️ Intervalle (1h / 3h / 6h / 12h / 24h)

---

## 🧪 Test

### Test manuel du cron :
```bash
curl http://localhost:3000/api/cron/auto-import
```

### Test avec authentification :
```bash
curl -H "Authorization: Bearer votre-secret" \
  https://votresite.com/api/cron/auto-import
```

---

## 📊 Surveillance

Le cron retourne des statistiques :
```json
{
  "success": true,
  "timestamp": "2025-12-26T12:35:00Z",
  "results": {
    "totalUsers": 5,
    "usersProcessed": 3,
    "totalImported": 12,
    "errors": 0
  }
}
```

---

## 🔐 Sécurité

- ✅ Vérification API key (variable `CRON_SECRET`)
- ✅ Rate limiting interne (50 parties max par utilisateur par import)
- ✅ Logs détaillés pour debugging
