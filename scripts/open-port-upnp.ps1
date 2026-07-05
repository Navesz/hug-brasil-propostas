try {
  $nat = New-Object -ComObject HNetCfg.NATUPnP
  $ports = $nat.StaticPortMappingCollection
  $found = $false
  for ($i = 0; $i -lt $ports.Count; $i++) {
    $mapping = $ports.Item($i)
    Write-Host "UPnP existente: porta $($mapping.ExternalPort) -> $($mapping.InternalPort) ($($mapping.Description))"
    if ($mapping.ExternalPort -eq 3000) { $found = $true }
  }
  if (-not $found) {
    $ports.Add(3000, "TCP", 3000, "192.168.1.4", $true, "HUG BRASIL Propostas")
    Write-Host "SUCCESS: Porta 3000 aberta via UPnP no roteador"
  } else {
    Write-Host "OK: Porta 3000 ja estava mapeada"
  }
} catch {
  Write-Host "UPnP FALHOU: $($_.Exception.Message)"
  exit 1
}
