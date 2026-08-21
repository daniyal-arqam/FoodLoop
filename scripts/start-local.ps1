$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Starting FoodLoop services (health-only scaffold)..."

function Start-NodeService {
  param([string]$Path, [string]$Name)
  Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory (Join-Path $root $Path) -WindowStyle Hidden
  Write-Host "  started $Name"
}

function Start-PythonService {
  param([string]$Path, [string]$Name, [int]$Port)
  $venvPython = Join-Path $root "$Path/.venv/Scripts/python.exe"
  if (-not (Test-Path $venvPython)) {
    throw "Missing venv for $Name. Create it first (see README.md)."
  }
  Start-Process -FilePath $venvPython -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$Port" -WorkingDirectory (Join-Path $root $Path) -WindowStyle Hidden
  Write-Host "  started $Name"
}

Start-NodeService "services/api-gateway" "api-gateway"
Start-NodeService "services/auth-service" "auth-service"
Start-NodeService "services/food-service" "food-service"
Start-NodeService "services/organization-service" "organization-service"
Start-PythonService "python-services/matcher" "matcher" 8001
Start-PythonService "ai-service" "ai-service" 8002
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory (Join-Path $root "frontend") -WindowStyle Hidden
Write-Host "  started frontend"

Write-Host "Waiting 4s for listeners..."
Start-Sleep -Seconds 4
& (Join-Path $PSScriptRoot "health-check.ps1")
