# Tesseract OCR Setup Script for Windows
# Run this script in PowerShell as Administrator

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Tesseract OCR Setup for Floor Plan Scanner" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[WARNING] Not running as Administrator. Some installations may fail." -ForegroundColor Yellow
    Write-Host "To run as admin: Right-click PowerShell -> Run as Administrator" -ForegroundColor Yellow
    Write-Host ""
}

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# ============================================
# Step 1: Install Tesseract OCR
# ============================================
Write-Host "[1/4] Installing Tesseract OCR..." -ForegroundColor Green

$tesseractInstalled = $false

# Check if already installed
if (Test-Command "tesseract") {
    Write-Host "  Tesseract already installed!" -ForegroundColor Green
    tesseract --version
    $tesseractInstalled = $true
}
else {
    # Try winget first (Windows 10/11)
    if (Test-Command "winget") {
        Write-Host "  Using winget to install Tesseract..." -ForegroundColor Yellow
        winget install UB-Mannheim.TesseractOCR --silent --accept-package-agreements --accept-source-agreements
        
        if ($LASTEXITCODE -eq 0) {
            $tesseractInstalled = $true
            Write-Host "  Tesseract installed via winget!" -ForegroundColor Green
        }
    }
    
    # Try chocolatey as fallback
    if (-not $tesseractInstalled -and (Test-Command "choco")) {
        Write-Host "  Using Chocolatey to install Tesseract..." -ForegroundColor Yellow
        choco install tesseract -y
        
        if ($LASTEXITCODE -eq 0) {
            $tesseractInstalled = $true
            Write-Host "  Tesseract installed via Chocolatey!" -ForegroundColor Green
        }
    }
    
    # Manual download instructions
    if (-not $tesseractInstalled) {
        Write-Host ""
        Write-Host "  [MANUAL INSTALLATION REQUIRED]" -ForegroundColor Red
        Write-Host "  Neither winget nor chocolatey available. Please install manually:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  1. Download from: https://github.com/UB-Mannheim/tesseract/wiki" -ForegroundColor White
        Write-Host "  2. Run the installer (tesseract-ocr-w64-setup-*.exe)" -ForegroundColor White
        Write-Host "  3. Add to PATH: C:\Program Files\Tesseract-OCR" -ForegroundColor White
        Write-Host "  4. Re-run this script after installation" -ForegroundColor White
        Write-Host ""
    }
}

# ============================================
# Step 2: Add Tesseract to PATH if needed
# ============================================
Write-Host ""
Write-Host "[2/4] Checking PATH environment..." -ForegroundColor Green

$tesseractPath = "C:\Program Files\Tesseract-OCR"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

if (Test-Path $tesseractPath) {
    if ($currentPath -notlike "*$tesseractPath*") {
        Write-Host "  Adding Tesseract to PATH..." -ForegroundColor Yellow
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$tesseractPath", "User")
        $env:Path = "$env:Path;$tesseractPath"
        Write-Host "  PATH updated!" -ForegroundColor Green
    } else {
        Write-Host "  Tesseract already in PATH" -ForegroundColor Green
    }
} else {
    Write-Host "  Tesseract directory not found at default location" -ForegroundColor Yellow
}

# ============================================
# Step 3: Install Python packages
# ============================================
Write-Host ""
Write-Host "[3/4] Installing Python packages..." -ForegroundColor Green

if (Test-Command "python") {
    Write-Host "  Installing pytesseract, opencv-python, numpy..." -ForegroundColor Yellow
    python -m pip install --upgrade pip
    python -m pip install pytesseract opencv-python numpy Pillow
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Python packages installed!" -ForegroundColor Green
    } else {
        Write-Host "  Some packages may have failed to install" -ForegroundColor Red
    }
} else {
    Write-Host "  Python not found! Please install Python first." -ForegroundColor Red
}

# ============================================
# Step 4: Verify installation
# ============================================
Write-Host ""
Write-Host "[4/4] Verifying installation..." -ForegroundColor Green

# Verify tesseract
Write-Host ""
Write-Host "  Tesseract version:" -ForegroundColor Cyan
try {
    $tessVersion = & tesseract --version 2>&1 | Select-Object -First 1
    Write-Host "  $tessVersion" -ForegroundColor White
} catch {
    Write-Host "  [NOT FOUND] - Please install manually" -ForegroundColor Red
}

# Verify Python packages
Write-Host ""
Write-Host "  Python packages:" -ForegroundColor Cyan
python -c "import pytesseract; print(f'  pytesseract: {pytesseract.__version__}')" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  pytesseract: NOT INSTALLED" -ForegroundColor Red }

python -c "import cv2; print(f'  opencv: {cv2.__version__}')" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  opencv: NOT INSTALLED" -ForegroundColor Red }

python -c "import numpy; print(f'  numpy: {numpy.__version__}')" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  numpy: NOT INSTALLED" -ForegroundColor Red }

# ============================================
# Done
# ============================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart your terminal to refresh PATH" -ForegroundColor White
Write-Host "  2. Run: python Shared/ocr_extract.py <image.png>" -ForegroundColor White
Write-Host ""
