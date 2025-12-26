$file = 'src\pages\[locale]\database.tsx'
$content = Get-Content $file -Raw

# Remove Button and Snackbar sections (lines 288-313)
$content = $content -replace '(?s)\s*\{session\?\.user\?\.name && \([^}]+migratingGames[^}]+\)\}', ''
$content = $content -replace '(?s)\s*<Snackbar[^>]*migrationMessage[^>]*>.*?</Snackbar>', ''

# Remove gap={2} from Grid, make it just gap
$content = $content -replace 'size=\{12\} gap=\{2\}>', 'size={12}>'

Set-Content $file $content -NoNewline
Write-Host "File cleaned successfully"
