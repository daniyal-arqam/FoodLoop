$ErrorActionPreference = "Stop"

$checks = @(
  @{ Name = "api-gateway"; Url = "http://localhost:8080/health" },
  @{ Name = "auth-service"; Url = "http://localhost:4001/health" },
  @{ Name = "food-service"; Url = "http://localhost:4002/health" },
  @{ Name = "organization-service"; Url = "http://localhost:4003/health" },
  @{ Name = "matcher"; Url = "http://localhost:8001/health" },
  @{ Name = "ai-service"; Url = "http://localhost:8002/health" },
  @{ Name = "frontend"; Url = "http://localhost:5173/health.json" }
)

$failed = 0
foreach ($check in $checks) {
  try {
    $response = Invoke-RestMethod -Uri $check.Url -Method Get -TimeoutSec 5
    $status = $response.data.status
    if ($status -ne "ok") {
      throw "Unexpected status: $status"
    }
    Write-Host "PASS  $($check.Name)  $($check.Url)"
  }
  catch {
    Write-Host "FAIL  $($check.Name)  $($check.Url)  $_"
    $failed += 1
  }
}

if ($failed -gt 0) {
  Write-Host "$failed health check(s) failed."
  exit 1
}

Write-Host "All health checks passed."
