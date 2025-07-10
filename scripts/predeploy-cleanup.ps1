# PowerShell script to clean up project before deployment
# Run this from the project root (ResiGate)

Write-Host "Cleaning up build and node_modules for deployment..."

# 1. Remove Next.js build cache (not needed for deployment)
if (Test-Path ".next/cache") {
    Remove-Item -Recurse -Force ".next/cache"
    Write-Host ".next/cache removed."
}

# 2. Remove all .map files from node_modules (saves a lot of space)
Get-ChildItem -Path "node_modules" -Recurse -Include *.map | Remove-Item -Force
Write-Host "Source map files removed from node_modules."

# 3. Remove test, docs, and example folders from node_modules
$patterns = @("test", "tests", "__tests__", "docs", "example", "examples")
foreach ($pattern in $patterns) {
    Get-ChildItem -Path "node_modules" -Recurse -Directory -Filter $pattern | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "Test, docs, and example folders removed from node_modules."

# 4. Prune dev dependencies and dedupe
npm prune --production
npm dedupe

Write-Host "Cleanup complete. Ready for deployment!"
