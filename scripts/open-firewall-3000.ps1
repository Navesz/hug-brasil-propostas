netsh advfirewall firewall delete rule name="HUG BRASIL Propostas TCP 3000" 2>$null
netsh advfirewall firewall add rule name="HUG BRASIL Propostas TCP 3000" dir=in action=allow protocol=TCP localport=3000 profile=any enable=yes
if ($LASTEXITCODE -eq 0) {
  Write-Host "SUCCESS: Firewall liberado na porta 3000"
} else {
  Write-Host "FALHOU: Precisa executar como Administrador"
  exit 1
}
