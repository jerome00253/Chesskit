@echo off
echo ====================================
echo   Chesskit - Production Launcher
echo ====================================
echo.

echo 1. Installation des dependances (si besoin)...
call npm install
echo.

echo 2. Construction de l'application (Build)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Le build a echoue.
    pause
    exit /b %ERRORLEVEL%
)
echo.

echo 3. Lancement du serveur...
echo L'application sera accessible sur: http://localhost:3000
echo (Ne fermez pas cette fenetre tant que vous voulez utiliser l'app)
echo.
call npm run start

pause
