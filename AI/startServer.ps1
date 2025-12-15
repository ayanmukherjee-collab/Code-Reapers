Write-Host "Starting local server for visualization..." -ForegroundColor Green
Write-Host ""
Write-Host "Open your browser and go to:" -ForegroundColor Yellow
Write-Host "  http://localhost:8000/renderVisualization.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Try Python first, then fallback to Node.js
if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server 8000
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    python3 -m http.server 8000
} elseif (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "Python not found, using Node.js..." -ForegroundColor Yellow
    npx http-server -p 8000
} else {
    Write-Host "Error: Neither Python nor Node.js found!" -ForegroundColor Red
    Write-Host "Please install Python or Node.js to run a local server." -ForegroundColor Red
    pause
}

