# ============================================================
#  Bus Tracking System -- Deploy Script
#  Run: .\deploy.ps1
# ============================================================

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

function Write-Header($text) {
    Write-Host ""
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host ("  " + ("-" * $text.Length)) -ForegroundColor DarkCyan
}

function Write-Step($text)  { Write-Host "  > $text" -ForegroundColor Yellow }
function Write-OK($text)    { Write-Host "  [OK] $text" -ForegroundColor Green }
function Write-Fail($text)  { Write-Host "  [FAIL] $text" -ForegroundColor Red }

Clear-Host
Write-Host ""
Write-Host "  ======================================" -ForegroundColor Cyan
Write-Host "    Bus Tracking System -- Deploy       " -ForegroundColor Cyan
Write-Host "  ======================================" -ForegroundColor Cyan

# -- Step 1: Build frontend ----------------------------------------
Write-Header "Step 1/2 -- Build Admin Dashboard"
Write-Step "npm run build:admin"

npm run build:admin 2>&1 | ForEach-Object {
    $line = "$_"
    if ($line -match "error|Error") { Write-Host "  $line" -ForegroundColor Red }
    elseif ($line -match "built in|modules transformed") { Write-Host "  $line" -ForegroundColor Green }
    else { Write-Host "  $line" }
}

if ($LASTEXITCODE -ne 0) {
    Write-Fail "Build failed -- aborting deploy"
    Read-Host "`n  Press Enter to close"
    exit 1
}
Write-OK "Build complete"

# -- Step 2: Deploy both workers in parallel -----------------------
Write-Header "Step 2/2 -- Deploy Workers (parallel)"
Write-Step "Launching Backend API + Admin Web Worker..."
Write-Host ""

$root = $projectRoot

$jobAPI = Start-Job -Name "BackendAPI" -ScriptBlock {
    Set-Location $using:root
    npm run deploy:worker 2>&1
}

$jobWeb = Start-Job -Name "AdminWeb" -ScriptBlock {
    Set-Location $using:root
    npm run deploy:admin-web-worker 2>&1
}

# Spinner while waiting
$spinner = @('|','/','-','\')
$i = 0
while (($jobAPI.State -eq 'Running') -or ($jobWeb.State -eq 'Running')) {
    $s    = $spinner[$i % $spinner.Length]
    $api  = if ($jobAPI.State -eq 'Running') { "waiting..." } else { "done" }
    $web  = if ($jobWeb.State -eq 'Running') { "waiting..." } else { "done" }
    Write-Host "`r  $s  Backend API: $api  |  Admin Web: $web   " -NoNewline -ForegroundColor Yellow
    Start-Sleep -Milliseconds 150
    $i++
}
Write-Host ""

# -- Show output ---------------------------------------------------
$allOk = $true

foreach ($job in @($jobAPI, $jobWeb)) {
    $label = if ($job.Name -eq "BackendAPI") { "Backend API Worker" } else { "Admin Web Worker" }
    Write-Host ""
    Write-Host "  --- $label ---" -ForegroundColor Magenta
    Receive-Job $job | ForEach-Object {
        $line = "$_"
        if ($line -match "error|Error|failed|Failed") {
            Write-Host "  $line" -ForegroundColor Red
        } elseif ($line -match "Deployed|Uploaded|https://") {
            Write-Host "  $line" -ForegroundColor Green
        } else {
            Write-Host "  $line" -ForegroundColor DarkGray
        }
    }
    if ($job.State -ne 'Completed') {
        Write-Host "  [FAIL] $label failed" -ForegroundColor Red
        $allOk = $false
    }
}

Remove-Job $jobAPI, $jobWeb -Force

# -- Summary -------------------------------------------------------
Write-Host ""
Write-Host "  ======================================" -ForegroundColor DarkCyan

if ($allOk) {
    Write-OK "Deploy complete!"
    Write-Host ""
    Write-Host "  Backend API : https://bus-tracking-worker.thanachot-jo888.workers.dev" -ForegroundColor White
    Write-Host "  Admin Web   : https://bus-tracking-admin-web.thanachot-jo888.workers.dev" -ForegroundColor White
} else {
    Write-Fail "One or more deploys failed -- check output above"
}

Write-Host "  ======================================" -ForegroundColor DarkCyan
Write-Host ""
Read-Host "  Press Enter to close"
