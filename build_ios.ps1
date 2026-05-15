#Requires -Version 5.1
<#
.SYNOPSIS
    Build script for Bus Tracking Mobile App - iOS

.DESCRIPTION
    iOS builds require macOS + Xcode 15+.
    On Windows: shows step-by-step instructions only.
    On macOS: runs the actual build.

.PARAMETER Mode
    simulator   -> Build and run on iOS Simulator (default)
    device      -> Build and run on real iPhone
    release     -> Build for App Store / TestFlight

.PARAMETER SkipPodInstall
    Skip pod install step

.EXAMPLE
    .\build_ios.ps1
    .\build_ios.ps1 -Mode release
    .\build_ios.ps1 -Mode device -SkipPodInstall
#>
param(
    [ValidateSet("simulator", "device", "release")]
    [string]$Mode = "simulator",
    [switch]$SkipPodInstall
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "" ; Write-Host ">> $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "   [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "   [!!] $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "   [XX] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "   [i]  $msg" -ForegroundColor DarkCyan }

# --- Platform check ---
$IsMac = $PSVersionTable.OS -like "*Darwin*"

if (-not $IsMac) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Yellow
    Write-Host "  iOS BUILD requires macOS + Xcode - running on Windows" -ForegroundColor Yellow
    Write-Host "  Showing instructions to run on Mac instead" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  --- Prerequisites on macOS ---"
    Write-Host ""
    Write-Host "  brew install cocoapods"
    Write-Host "  flutter pub get"
    Write-Host "  cd apps/mobile_app/ios && pod install && cd .."
    Write-Host "  flutter doctor   # should show [v] Xcode and [v] CocoaPods"
    Write-Host ""

    switch ($Mode) {
        "simulator" {
            Write-Host "  --- Run on iOS Simulator ---"
            Write-Host ""
            Write-Host "  flutter devices"
            Write-Host "  flutter run -d 'iPhone 16 Pro'"
        }
        "device" {
            Write-Host "  --- Run on real iPhone ---"
            Write-Host ""
            Write-Host "  # Open Xcode -> ios/Runner.xcworkspace"
            Write-Host "  # Runner target -> Signing & Capabilities -> select Team"
            Write-Host "  # Set Bundle ID: com.yourcompany.bustracking"
            Write-Host ""
            Write-Host "  flutter devices"
            Write-Host "  flutter run -d <iphone-device-id>"
        }
        "release" {
            Write-Host "  --- Build iOS Release (Archive) ---"
            Write-Host ""
            Write-Host "  flutter build ios --release"
            Write-Host ""
            Write-Host "  Then in Xcode:"
            Write-Host "  1. Open ios/Runner.xcworkspace"
            Write-Host "  2. Target: Any iOS Device (arm64)"
            Write-Host "  3. Product -> Archive"
            Write-Host "  4. Window -> Organizer -> Distribute App -> App Store Connect"
        }
    }

    Write-Host ""
    Write-Host "  --- Files to check before building ---"
    Write-Host ""
    Write-Host "  ios/Runner/AppDelegate.swift"
    Write-Host "    GMSServices.provideAPIKey(...) must have your Maps API key"
    Write-Host ""
    Write-Host "  ios/Runner/Info.plist"
    Write-Host "    NSLocationWhenInUseUsageDescription (required)"
    Write-Host "    NSLocationAlwaysAndWhenInUseUsageDescription (required)"
    Write-Host ""
    Write-Host "  Xcode -> Runner -> Signing & Capabilities"
    Write-Host "    Bundle Identifier: com.yourcompany.bustracking"
    Write-Host "    Team: your Apple Developer account"
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Yellow
    exit 0
}

# --- macOS only: run actual build ---
$RootDir = $PSScriptRoot
$AppDir  = Join-Path $RootDir "apps/mobile_app"
$IosDir  = Join-Path $AppDir "ios"

$PuroBin = "$env:HOME/.puro/envs/stable/flutter/bin"
if ((Test-Path $PuroBin) -and ($env:PATH -notlike "*$PuroBin*")) {
    $env:PATH = "$PuroBin:$env:PATH"
}

# --- Check Flutter ---
Write-Step "Checking Flutter SDK"
try {
    $ver = & flutter --version 2>&1 | Select-String "Flutter" | Select-Object -First 1
    Write-OK $ver
} catch {
    Write-Fail "flutter not found - install Flutter SDK first"
    exit 1
}

# --- Check Xcode ---
Write-Step "Checking Xcode"
try {
    $xcodeVer = & xcodebuild -version 2>&1 | Select-Object -First 1
    Write-OK $xcodeVer
} catch {
    Write-Fail "Xcode not found - install from App Store first"
    exit 1
}

# --- Enter project folder ---
Write-Step "Entering $AppDir"
if (-not (Test-Path $AppDir)) {
    Write-Fail "Folder not found: $AppDir"
    exit 1
}
Set-Location $AppDir

# --- flutter pub get ---
Write-Step "flutter pub get"
flutter pub get
if ($LASTEXITCODE -ne 0) { Write-Fail "pub get failed"; exit 1 }
Write-OK "pub get done"

# --- pod install ---
if (-not $SkipPodInstall) {
    Write-Step "pod install (iOS native dependencies)"
    Set-Location $IosDir
    pod install
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "pod install failed - try: sudo gem install cocoapods"
        exit 1
    }
    Set-Location $AppDir
    Write-OK "pod install done"
}

# --- flutter analyze ---
Write-Step "flutter analyze"
flutter analyze
if ($LASTEXITCODE -ne 0) {
    Write-Warn "analyze warnings/errors found"
    $cont = Read-Host "   Continue? (y/N)"
    if ($cont -ne "y") { exit 1 }
}

# --- Build ---
switch ($Mode) {
    "simulator" {
        Write-Step "Open Simulator + flutter run"
        flutter devices
        Write-Host ""
        $devId = Read-Host "   Enter Simulator device-id (e.g. 'iPhone 16 Pro')"
        flutter run -d $devId
    }
    "device" {
        Write-Step "flutter run on real iPhone"
        Write-Info "Make sure Developer Mode is enabled on iPhone"
        flutter devices
        Write-Host ""
        $devId = Read-Host "   Enter iPhone device-id"
        flutter run -d $devId
    }
    "release" {
        Write-Step "flutter build ios --release"
        flutter build ios --release
        if ($LASTEXITCODE -ne 0) { Write-Fail "Build failed"; exit 1 }

        Write-Host ""
        Write-Host "===================================================" -ForegroundColor Green
        Write-Host "  BUILD SUCCESS - Next steps:" -ForegroundColor Green
        Write-Host "===================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "  open ios/Runner.xcworkspace"
        Write-Host "  Target: Any iOS Device (arm64)"
        Write-Host "  Product -> Archive"
        Write-Host "  Window -> Organizer -> Distribute App -> App Store Connect"
        Write-Host ""
    }
}
