#Requires -Version 5.1
<#
.SYNOPSIS
    Build script for Bus Tracking Mobile App - Android

.PARAMETER Mode
    debug       -> APK for testing (default)
    release     -> signed APK
    appbundle   -> AAB for Google Play Store

.PARAMETER SkipGet
    Skip flutter pub get

.PARAMETER SkipAnalyze
    Skip flutter analyze

.EXAMPLE
    .\build_android.ps1
    .\build_android.ps1 -Mode release
    .\build_android.ps1 -Mode appbundle -SkipGet
#>
param(
    [ValidateSet("debug", "release", "appbundle")]
    [string]$Mode = "debug",
    [switch]$SkipGet,
    [switch]$SkipAnalyze
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "" ; Write-Host ">> $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "   [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "   [!!] $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "   [XX] $msg" -ForegroundColor Red }

# --- Paths ---
$RootDir = $PSScriptRoot
$AppDir  = Join-Path $RootDir "apps\mobile_app"
$PuroBin = "$env:USERPROFILE\.puro\envs\stable\flutter\bin"

# Reload PATH from registry so flutter is available even in old sessions
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","User") + ";" +
            [System.Environment]::GetEnvironmentVariable("PATH","Machine")

if ((Test-Path $PuroBin) -and ($env:PATH -notlike "*$PuroBin*")) {
    $env:PATH = "$PuroBin;$env:PATH"
}

# --- Check Flutter ---
Write-Step "Checking Flutter SDK"
try {
    $ver = & flutter --version 2>&1 | Select-String "Flutter" | Select-Object -First 1
    Write-OK $ver
} catch {
    Write-Fail "flutter not found - add flutter/bin to PATH"
    exit 1
}

# --- Go to project folder ---
Write-Step "Entering $AppDir"
if (-not (Test-Path $AppDir)) {
    Write-Fail "Folder not found: $AppDir"
    exit 1
}
Set-Location $AppDir

# --- flutter pub get ---
if (-not $SkipGet) {
    Write-Step "flutter pub get"
    flutter pub get
    if ($LASTEXITCODE -ne 0) { Write-Fail "pub get failed"; exit 1 }
    Write-OK "pub get done"
}

# --- flutter analyze ---
if (-not $SkipAnalyze) {
    Write-Step "flutter analyze"
    flutter analyze
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "analyze found warnings/errors (see above)"
        $cont = Read-Host "   Continue build anyway? (y/N)"
        if ($cont -ne "y") { exit 1 }
    } else {
        Write-OK "analyze passed"
    }
}

# --- Build ---
switch ($Mode) {
    "debug" {
        Write-Step "flutter build apk --debug"
        flutter build apk --debug
        $OutPath = "build\app\outputs\flutter-apk\app-debug.apk"
    }
    "release" {
        Write-Step "flutter build apk --release"
        Write-Warn "Requires keystore - run with -Mode debug first if not set up"
        flutter build apk --release
        $OutPath = "build\app\outputs\flutter-apk\app-release.apk"
    }
    "appbundle" {
        Write-Step "flutter build appbundle --release (Google Play AAB)"
        flutter build appbundle --release
        $OutPath = "build\app\outputs\bundle\release\app-release.aab"
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Fail "Build failed - see errors above"
    exit 1
}

# --- Result ---
$FullOut = Join-Path $AppDir $OutPath
Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  BUILD SUCCESS ($Mode)" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""

if (Test-Path $FullOut) {
    $size = [math]::Round((Get-Item $FullOut).Length / 1MB, 2)
    Write-Host "  File : $FullOut"
    Write-Host "  Size : $size MB"
    Write-Host ""
    $open = Read-Host "  Open output folder? (y/N)"
    if ($open -eq "y") {
        Invoke-Item (Split-Path $FullOut)
    }
} else {
    Write-Warn "Output file not found at: $FullOut"
}
