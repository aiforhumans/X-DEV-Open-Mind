# Full Auto Builder/Installer for X-DEV Projects
# Handles both X-DEV-LM-Studio and X-DEV-Obsidian

param(
    [switch]$dev = $false,
    [switch]$watch = $false,
    [switch]$start = $false,
    [string]$project = "all"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommandPath
$lmStudioPath = Join-Path $projectRoot "X-DEV-LM-Studio"
$obsidianPath = Join-Path $projectRoot "X-DEV-Obsidian"

function Write-Header {
    param([string]$message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $message -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$message)
    Write-Host "✓ $message" -ForegroundColor Green
}

function Write-Error {
    param([string]$message)
    Write-Host "✗ $message" -ForegroundColor Red
}

function Install-Project {
    param([string]$name, [string]$path)
    
    Write-Header "Installing $name"
    
    if (-not (Test-Path $path)) {
        Write-Error "$name directory not found at $path"
        return $false
    }
    
    Push-Location $path
    try {
        # Check if node_modules exists
        if (-not (Test-Path "node_modules")) {
            Write-Host "Installing dependencies..." -ForegroundColor Yellow
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to install dependencies for $name"
                return $false
            }
        } else {
            Write-Success "Dependencies already installed"
        }
        
        Write-Success "$name dependencies ready"
        return $true
    }
    finally {
        Pop-Location
    }
}

function Build-Project {
    param([string]$name, [string]$path)
    
    Write-Host "Building $name..." -ForegroundColor Yellow
    
    Push-Location $path
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to build $name"
            return $false
        }
        Write-Success "$name built successfully"
        return $true
    }
    finally {
        Pop-Location
    }
}

function Dev-Project {
    param([string]$name, [string]$path)
    
    Write-Header "Starting $name in development mode"
    
    Push-Location $path
    try {
        npm run dev
    }
    finally {
        Pop-Location
    }
}

function Watch-Project {
    param([string]$name, [string]$path)
    
    Write-Header "Starting $name in watch mode"
    
    Push-Location $path
    try {
        npm run dev
    }
    finally {
        Pop-Location
    }
}

function Start-LMStudio {
    Write-Header "Starting LM Studio Server"
    
    Push-Location $lmStudioPath
    try {
        npm start
    }
    finally {
        Pop-Location
    }
}

# Main execution
Write-Host @"
╔═══════════════════════════════════════════════════════════╗
║         X-DEV Auto Builder/Installer                      ║
║         Supporting LM Studio + Obsidian Plugin            ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Magenta

# Parse project selection
$projects = @()
if ($project -eq "all") {
    $projects = @("lm-studio", "obsidian")
} else {
    $projects = @($project)
}

# Install and build phase
foreach ($proj in $projects) {
    if ($proj -eq "lm-studio") {
        if (-not (Install-Project "LM Studio" $lmStudioPath)) { exit 1 }
        if (-not (Build-Project "LM Studio" $lmStudioPath)) { exit 1 }
    }
    elseif ($proj -eq "obsidian") {
        if (-not (Install-Project "Obsidian Plugin" $obsidianPath)) { exit 1 }
        if (-not (Build-Project "Obsidian Plugin" $obsidianPath)) { exit 1 }
    }
}

Write-Header "✓ All builds completed successfully!"

# Development phase
if ($watch) {
    Write-Host "Entering watch mode. Press Ctrl+C to exit.`n" -ForegroundColor Yellow
    foreach ($proj in $projects) {
        if ($proj -eq "lm-studio") { Watch-Project "LM Studio" $lmStudioPath }
        elseif ($proj -eq "obsidian") { Watch-Project "Obsidian Plugin" $obsidianPath }
    }
}
elseif ($start -and $projects -contains "lm-studio") {
    Start-LMStudio
}

Write-Host "`n✓ Build process complete!`n" -ForegroundColor Green
