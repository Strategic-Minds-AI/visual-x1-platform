# Read-only local JARVIS runtime inventory.
# No service, network, scheduler, container or model mutations.
param([switch]$Inference)
$ErrorActionPreference = 'Continue'
$result = [ordered]@{
  inspected_at = (Get-Date).ToUniversalTime().ToString('o')
  mode = 'read-only'
  machine = $env:COMPUTERNAME
  docker = @{ state = 'not_checked'; containers = @(); exposed_ollama = $false }
  ollama = @{ state = 'not_checked'; version = $null; model_names = @(); inference = 'not_run' }
  control_plane = @{ state = 'not_checked' }
}
try {
  $containers = @(docker ps --format '{{json .}}' 2>$null)
  if ($LASTEXITCODE -ne 0) { throw 'docker ps failed' }
  $items = @($containers | Where-Object { $_ } | ForEach-Object { $_ | ConvertFrom-Json })
  $result.docker.state = 'responsive'
  $result.docker.containers = @($items | ForEach-Object { @{ name=$_.Names; status=$_.Status } })
  $result.docker.exposed_ollama = [bool](@($items | Where-Object { $_.Ports -match '(0\.0\.0\.0|\[::\]):11434' }).Count)
} catch { $result.docker.state = 'unavailable' }
try {
  $v = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/version' -TimeoutSec 5
  $t = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 5
  $result.ollama.state = 'responsive'
  $result.ollama.version = $v.version
  $result.ollama.model_names = @($t.models | ForEach-Object { $_.name })
  if ($Inference -and @($t.models).Count -gt 0) {
    $name = $t.models[0].name
    $body = @{model=$name;prompt='Return exactly the word READY';stream=$false;options=@{temperature=0;num_predict=12}} | ConvertTo-Json -Depth 4
    $r = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/generate' -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 45
    $result.ollama.inference = if ($r.response -match 'READY') { 'response_received' } else { 'unexpected_response' }
  }
} catch { $result.ollama.state = 'unavailable_or_inference_failed' }
try {
  $h = Invoke-RestMethod -Uri 'http://127.0.0.1:4311/health' -TimeoutSec 5
  $result.control_plane.state = 'http_response'
} catch { $result.control_plane.state = 'unavailable' }
$result | ConvertTo-Json -Depth 8
