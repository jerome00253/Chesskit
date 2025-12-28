# Configuration du Cron Job - Analyse IA Automatique

## 📋 Prérequis
- ✅ Schema Prisma mis à jour (`needsAiAnalysis`, `aiAnalysisQueuedAt`)
- ✅ Endpoint `/api/cron/process-ai-queue` créé
- ✅ Variable `CRON_SECRET` dans `.env`

## 🔐 Configuration de la clé secrète

1. Générer une clé aléatoire :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. Ajouter dans `.env` :
```env
CRON_SECRET=votre_cle_secrete_generee
```

---

## ⚙️ Options de déploiement

### Option A: Vercel Cron Jobs (Recommandé)

**Fichier**: `vercel.json` (à créer à la racine)
```json
{
  "crons": [{
    "path": "/api/cron/process-ai-queue",
    "schedule": "0 * * * *"
  }]
}
```

**Avantages**:
- ✅ Intégré à Vercel
- ✅ Configuration simple
- ✅ Logs dans Vercel Dashboard

**Configuration**:
1. Créer `vercel.json`
2. Ajouter `CRON_SECRET` dans Vercel Environment Variables
3. Redéployer

---

### Option B: Cron externe (cron-job.org)

**URL**: https://console.cron-job.org/

**Configuration**:
1. Créer un compte
2. Nouveau job:
   - URL: `https://your-app.vercel.app/api/cron/process-ai-queue`
   - Méthode: POST
   - Header: `Authorization: Bearer YOUR_CRON_SECRET`
   - Fréquence: `0 * * * *` (toutes les heures)

**Avantages**:
- ✅ Indépendant du provider
- ✅ Interface de monitoring
- ✅ Gratuit pour usage modéré

---

### Option C: GitHub Actions

**Fichier**: `.github/workflows/ai-analysis-cron.yml`
```yaml
name: Process AI Analysis Queue

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Allow manual trigger

jobs:
  process-queue:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger AI Analysis Cron
        run: |
          curl -X POST https://your-app.vercel.app/api/cron/process-ai-queue \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Configuration**:
1. Créer le fichier workflow
2. Ajouter `CRON_SECRET` dans GitHub Secrets
3. Le workflow s'exécute automatiquement

---

## 🧪 Test manuel

```bash
curl -X POST http://localhost:3000/api/cron/process-ai-queue \
  -H "Authorization: Bearer your_cron_secret"
```

Réponse attendue:
```json
{
  "success": true,
  "processed": 5,
  "errors": 0,
  "total": 5
}
```

---

## 📊 Surveillance

### Vérifier la queue
```sql
-- Nombre de parties en attente
SELECT COUNT(*) as pending 
FROM Game 
WHERE needsAiAnalysis = true AND aiSummary IS NULL;

-- Parties traitées dans les dernières 24h
SELECT COUNT(*) as processed_today
FROM Game 
WHERE aiSummary IS NOT NULL 
  AND analyzedAt > DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

### Logs Vercel
- Dashboard > Logs
- Filtrer par `/api/cron/process-ai-queue`

---

## ⚡ Fréquence recommandée

- **Production**: `0 * * * *` (toutes les heures)
- **Test**: `*/15 * * * *` (toutes les 15 min)
- **Nuit uniquement**: `0 2-6 * * *` (entre 2h et 6h du matin)

---

## 🔧 Dépannage

**Problème**: 401 Unauthorized
- Vérifier que `CRON_SECRET` est identique dans `.env` et la config cron

**Problème**: Timeout
- Réduire le `take` dans le endpoint (de 10 à 5 parties)
- Augmenter la pause entre requêtes (de 2s à 3s)

**Problème**: Rate limiting OpenAI
- Espacer les exécutions du cron (toutes les 2h au lieu d'1h)
