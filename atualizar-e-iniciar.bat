@echo off
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js nao encontrado. Instale com: winget install OpenJS.NodeJS.LTS
  pause
  exit /b 1
)

where git >nul 2>&1
if errorlevel 1 (
  echo Git nao encontrado. Instale com: winget install Git.Git
  pause
  exit /b 1
)

echo Verificando acesso remoto...
node scripts\check-access.js
if errorlevel 1 (
  pause
  exit /b 1
)

echo Atualizando do GitHub...
git fetch origin
if errorlevel 1 (
  echo Erro ao buscar do origin.
  pause
  exit /b 1
)

git reset --hard origin/main
if errorlevel 1 (
  echo Erro ao resetar para origin/main.
  pause
  exit /b 1
)

echo Instalando dependencias...
call npm install
if errorlevel 1 (
  echo Erro no npm install.
  pause
  exit /b 1
)

echo Iniciando servidor de desenvolvimento...
call npm run dev

pause
