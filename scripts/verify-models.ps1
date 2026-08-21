$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$services = @(
  "auth-service",
  "food-service",
  "organization-service"
)

foreach ($service in $services) {
  Write-Host "`n=== $service schema load ==="
  npm run schema:load --prefix (Join-Path $root "services\$service")
}

Write-Host "`n=== model tests ==="
foreach ($service in $services) {
  Write-Host "`n--- $service tests ---"
  npm test --prefix (Join-Path $root "services\$service")
}

Write-Host "`nPersistence tests need a running MongoDB. Set RUN_MONGO_TESTS=1 after mongod is available."
