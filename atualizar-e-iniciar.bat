@echo off
cd /d C:\Users\Pedro\hug-brasil-propostas

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
