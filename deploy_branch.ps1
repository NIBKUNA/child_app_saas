# 🚀 ZARADA ERP: Branch Deployment Automator
# Usage: Right-click -> Run with PowerShell

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$message)
    Write-Host "`n🔵 $message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$message)
    Write-Host "✅ $message" -ForegroundColor Green
}

# 1. Input Collection
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "   ZARADA ERP - NEW BRANCH DEPLOYER       " -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

$branchName = Read-Host "1. Enter New Branch Name (e.g. gangnam)"
if ([string]::IsNullOrWhiteSpace($branchName)) { Write-Error "Branch Name is required!"; exit }

$centerId = Read-Host "2. Enter New Center ID (UUID from Supabase)"
if ([string]::IsNullOrWhiteSpace($centerId)) { Write-Error "Center ID is required!"; exit }

$supabaseUrl = Read-Host "3. Enter Supabase Project URL"
$supabaseKey = Read-Host "4. Enter Supabase Anon Key"

$siteTitle = Read-Host "5. Enter New Center Title (e.g. 자라다 강남점)"
$siteDomain = Read-Host "6. Enter New Domain (e.g. gangnam.zaradacenter.co.kr)"

# 2. Duplicate Project
$currentDir = Get-Location
$newDirName = "child_app-$branchName"
$targetPath = Join-Path (Split-Path -Parent $currentDir) $newDirName

Write-Step "Cloning project to: $targetPath..."

if (Test-Path $targetPath) {
    Write-Error "Target directory already exists! Please delete it or choose a different name."
    exit
}

# Copy everything except node_modules and .git
Copy-Item -Path $currentDir -Destination $targetPath -Recurse -Exclude "node_modules",".git",".checkpoints",".gemini"
Write-Success "Project cloned successfully."

# 3. Code Modification

# 3.1 Modify src/config/center.ts
$centerConfigPath = Join-Path $targetPath "src\config\center.ts"
if (Test-Path $centerConfigPath) {
    $content = Get-Content $centerConfigPath -Raw -Encoding UTF8
    # Regex to replace UUID in JAMSIL_CENTER_ID
    $newContent = $content -replace "export const JAMSIL_CENTER_ID = .*", "export const JAMSIL_CENTER_ID = `"$centerId`";"
    $newContent | Set-Content $centerConfigPath -Encoding UTF8
    Write-Success "Updated Center ID in config."
} else {
    Write-Warning "src/config/center.ts not found!"
}

# 3.2 Create .env
$envPath = Join-Path $targetPath ".env"
$envContent = @"
VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$supabaseKey
VITE_SITE_TITLE=$siteTitle
VITE_SITE_URL=https://$siteDomain
"@
$envContent | Set-Content $envPath -Encoding UTF8
Write-Success "Created .env file."

# 3.3 Update SEO Files (Simple Text Replacement)
# Helper function to replace text in file
function Replace-In-File {
    param($path, $find, $replace)
    if (Test-Path $path) {
        $c = Get-Content $path -Raw -Encoding UTF8
        $n = $c -replace $find, $replace
        $n | Set-Content $path -Encoding UTF8
    }
}

# Replace "잠실" with Branch Name in key files (Naive replacement, but effective for this context)
$branchKorean = $siteTitle -replace "자라다 ", "" -replace "아동심리발달센터 ", "" # Extract "강남점" ideally
$filesToPatch = @(
    "src\components\seo\SEOHead.tsx",
    "src\hooks\useCenterSEO.ts",
    "src\pages\public\HomePage.tsx",
    "public\robots.txt",
    "public\sitemap.xml"
)

foreach ($relPath in $filesToPatch) {
    $fullPath = Join-Path $targetPath $relPath
    Replace-In-File -path $fullPath -find "잠실" -replace $branchKorean
    Replace-In-File -path $fullPath -find "zaradacenter.co.kr" -replace $siteDomain
}
Write-Success "Updated SEO keywords and domains."

# 4. Final Instructions
Write-Host "`n==========================================" -ForegroundColor Yellow
Write-Host "   DEPLOYMENT PACKAGE READY! 🚀           " -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "Location: $targetPath"
Write-Host "Next Steps:"
Write-Host "1. cd $newDirName"
Write-Host "2. npm install"
Write-Host "3. npm run dev (to test)"
Write-Host "4. Deploy to Vercel!"
Write-Host "==========================================" -ForegroundColor Yellow

# Open folder in Explorer
Invoke-Item $targetPath
