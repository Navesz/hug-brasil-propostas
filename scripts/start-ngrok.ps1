param(
  [Parameter(Mandatory = $false)]
  [string]$Token,
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

if (-not $Token) {
  $Token = $env:NGROK_AUTHTOKEN
}

if (-not $Token) {
  Write-Host "ERRO: Token ngrok nao informado."
  Write-Host "1. Crie conta gratis: https://dashboard.ngrok.com/signup"
  Write-Host "2. Copie o token: https://dashboard.ngrok.com/get-started/your-authtoken"
  Write-Host "3. Execute: .\scripts\start-ngrok.ps1 -Token SEU_TOKEN"
  exit 1
}

$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')

ngrok config add-authtoken $Token | Out-Null
Write-Host "Iniciando tunel ngrok na porta $Port..."
Write-Host "A URL publica aparecera abaixo (Forwarding https://....ngrok-free.app)"
ngrok http $Port
