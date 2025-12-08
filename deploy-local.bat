@echo off
REM Script de déploiement local pour Chesskit
REM Ce script build l'application et copie le fichier .htaccess

echo.
echo ========================================
echo   Chesskit - Deploiement Local
echo ========================================
echo.

REM Étape 1 : Build
echo [1/3] Building l'application Next.js...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Erreur lors du build!
    pause
    exit /b %errorlevel%
)

echo.
echo ✅ Build termine avec succes!

REM Étape 2 : Copier .htaccess
echo.
echo [2/3] Copie du fichier .htaccess...
if exist .htaccess.template (
    copy /Y .htaccess.template out\.htaccess >nul
    echo ✅ Fichier .htaccess copie dans out/
) else (
    echo ⚠️  Fichier .htaccess.template non trouve
)

REM Étape 3 : Afficher les instructions
echo.
echo [3/3] Deploiement termine!
echo.
echo ========================================
echo   Instructions
echo ========================================
echo.
echo Le build est pret dans le dossier: out\
echo.
echo Pour servir l'application avec Laragon:
echo.
echo Option 1 - Modifier le Virtual Host:
echo   1. Menu Laragon ^> Apache ^> sites-enabled
echo   2. Editer votre fichier .conf
echo   3. Changer DocumentRoot vers: c:/Users/jerom/laragon/www/chess/out
echo   4. Redemarrer Apache
echo.
echo Option 2 - Copier vers un autre dossier:
echo   xcopy out c:\Users\jerom\laragon\www\chess-dist /E /I /Y
echo.
echo ⚠️  IMPORTANT: Verifiez que les headers CORS sont configures!
echo    Cross-Origin-Embedder-Policy: require-corp
echo    Cross-Origin-Opener-Policy: same-origin
echo.
echo 🌐 Ensuite, ouvrez http://chess.test dans votre navigateur
echo.
pause
