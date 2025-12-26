# Script pour nettoyer le cache Next.js et redémarrer le serveur
# Utilisez ce script quand vous rencontrez l'erreur MISSING_MESSAGE

Write-Host "🧹 Nettoyage du cache Next.js..." -ForegroundColor Cyan

# Arrêter tous les processus Node.js
Write-Host "Arrêt des processus Node.js..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 1

# Supprimer le dossier .next
if (Test-Path ".next") {
    Write-Host "Suppression du dossier .next..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Dossier .next supprimé" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Dossier .next introuvable" -ForegroundColor Yellow
}

# Redémarrer le serveur
Write-Host "🚀 Redémarrage du serveur de développement..." -ForegroundColor Cyan
npm run dev
