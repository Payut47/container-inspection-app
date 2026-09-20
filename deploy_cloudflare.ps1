# Deploy Script: สมัคร Cloudflare + Deploy Pages + KV
# รันสคริปต์นี้หลังจาก Node.js ติดตั้งเสร็จแล้ว

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  WMS Inspection App - Cloudflare Deploy Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Step 1: Check Node.js
Write-Host "[1/6] ตรวจสอบ Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js ยังไม่ได้ติดตั้ง กรุณารีสตาร์ทแล้วลองใหม่" -ForegroundColor Red
    exit 1
}
Write-Host "  OK: Node.js $nodeVersion" -ForegroundColor Green

# Step 2: Install wrangler
Write-Host ""
Write-Host "[2/6] ติดตั้ง Wrangler CLI..." -ForegroundColor Yellow
npm install -g wrangler --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: ติดตั้ง wrangler ไม่สำเร็จ" -ForegroundColor Red
    exit 1
}
$wranglerVersion = wrangler --version 2>&1
Write-Host "  OK: $wranglerVersion" -ForegroundColor Green

# Step 3: Login to Cloudflare
Write-Host ""
Write-Host "[3/6] เข้าสู่ระบบ Cloudflare..." -ForegroundColor Yellow
Write-Host "  > Browser จะเปิดขึ้น — กรุณาสมัคร/Login Cloudflare แล้วกด Allow" -ForegroundColor White
Write-Host "  > ถ้ายังไม่มีบัญชี ให้กด 'Sign Up' ในหน้าเว็บที่เปิดขึ้น" -ForegroundColor White
Write-Host ""
wrangler login
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Login ไม่สำเร็จ" -ForegroundColor Red
    exit 1
}
Write-Host "  OK: Login สำเร็จ!" -ForegroundColor Green

# Step 4: Create KV Namespace
Write-Host ""
Write-Host "[4/6] สร้าง Cloudflare KV Database..." -ForegroundColor Yellow
$kvOutput = wrangler kv namespace create "INSPECTIONS_KV" 2>&1
Write-Host $kvOutput
# Extract KV ID
$kvId = ($kvOutput | Select-String 'id = "([^"]+)"').Matches.Groups[1].Value
if (-not $kvId) {
    # Try alternate format
    $kvId = ($kvOutput | Select-String '"id":\s*"([^"]+)"').Matches.Groups[1].Value
}
if (-not $kvId) {
    Write-Host "  WARNING: ไม่สามารถดึง KV ID อัตโนมัติ กรุณาดูค่า id ด้านบนแล้วกรอกด้านล่าง" -ForegroundColor Yellow
    $kvId = Read-Host "  กรุณากรอก KV namespace ID"
}
Write-Host "  OK: KV ID = $kvId" -ForegroundColor Green

# Step 5: Update wrangler.toml
Write-Host ""
Write-Host "[5/6] อัปเดต wrangler.toml..." -ForegroundColor Yellow
$wranglerToml = @"
name = "wms-inspection"
pages_build_output_dir = "."
compatibility_date = "2024-09-23"

[[kv_namespaces]]
binding = "INSPECTIONS_KV"
id = "$kvId"
"@
$wranglerToml | Set-Content -Path "wrangler.toml" -Encoding UTF8
Write-Host "  OK: wrangler.toml อัปเดตแล้ว" -ForegroundColor Green

# Step 6: Deploy to Cloudflare Pages
Write-Host ""
Write-Host "[6/6] Deploy ขึ้น Cloudflare Pages..." -ForegroundColor Yellow
Write-Host "  (อาจใช้เวลา 1-2 นาที)" -ForegroundColor White
wrangler pages deploy . --project-name wms-inspection
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Deploy ไม่สำเร็จ กรุณาดูข้อความด้านบน" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  DEPLOY สำเร็จ!" -ForegroundColor Green
Write-Host "  URL: https://wms-inspection.pages.dev" -ForegroundColor Green
Write-Host "  (อาจใช้เวลา 1-2 นาทีให้พร้อม)" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
