<#
  run-verified-cleanup.ps1
  ------------------------
  Kör detta i repo-roten (E:\mittpsyke-main) i PowerShell.

  Detta script gör EXAKT det som beskrivs i uppdraget:
    1. Kör baseline (check/test/build/git diff --check). Om något fallerar: STOPPAR
       scriptet och raderar ingenting.
    2. Raderar ENDAST de filer som är oberoende omverifierade denna session att ha
       0 verkliga konsumenter (se cleanup-rapport.md för fullständig motivering
       per fil).
    3. Kör om samma fyra kontroller efter radering.
    4. Gör en enkel efterkontroll (grep) som letar efter kvarvarande referenser
       till de raderade filnamnen, som en sista säkerhetsspärr.
    5. Skriver ut git diff --stat och git status. Committar INGET.

  Om något steg fallerar avbryts scriptet omedelbart (Stop-on-error), inget
  delvis tillstånd lämnas kvar olöst utan att du ser exakt var det stannade.
#>

$ErrorActionPreference = 'Stop'

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,

        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$CommandArgs
    )

    Write-Host ">> $Command $($CommandArgs -join ' ')" -ForegroundColor Cyan
    & $Command @CommandArgs

    if ($LASTEXITCODE -ne 0) {
        throw "Kommandot misslyckades (exit $LASTEXITCODE): $Command $($CommandArgs -join ' ')"
    }
}

function Run-Baseline {
    param([string]$Label)
    Write-Host "`n=== Baseline: $Label ===" -ForegroundColor Yellow
     Invoke-Checked npm run check
     Invoke-Checked npm run test
     Invoke-Checked npm run build
     Invoke-Checked git diff --check
    Write-Host "=== Baseline OK: $Label ===`n" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Kategori A - kod (0 konsumenter, dubbelkollat mot import.meta.glob, tester,
# docs och komponent-referenser denna session)
# ---------------------------------------------------------------------------
$codeFiles = @(
    'src/lib/components/DiaryPreviewSidebar.svelte',
    'src/lib/components/HeroCard.svelte',
    'src/lib/components/SeoCta.svelte',
    'src/lib/seo-kit/SeoCta.svelte',
    'src/lib/components/dashboard/Greeting.svelte',
    'src/lib/components/dashboard/QuickActions.svelte'
)

# ---------------------------------------------------------------------------
# Kategori C - assets (0 konsumenter, dubbelkollat mot srcset/picture, CSS
# url(), import.meta.glob, companionPoseManifest/worldScene/progressScene och
# alla tester denna session)
# ---------------------------------------------------------------------------
$assetFiles = @(
    # static/avatars (SVG, toppnivå - INTE static/images/avatars/presets)
    'static/avatars/gryning.svg',
    'static/avatars/himmel.svg',
    'static/avatars/natt.svg',
    'static/avatars/skog.svg',
    'static/avatars/sol.svg',
    'static/avatars/sten.svg',

    # static/images (rot)
    'static/images/Autumn fox 2.png',
    'static/images/autumn_fox_lake.png',
    'static/images/ChatGPT Image 29 juni 2026 10_29_29.png',
    'static/images/ChatGPT Image 30 juni 2026 01_44_02.png',
    'static/images/companion-butterfly.png',
    'static/images/companion-dag.jpg',
    'static/images/companion-kvall.jpg',
    'static/images/companion-morgon.jpg',
    'static/images/dashboard-lakeside-world.png',
    'static/images/diary-book-branch-cup.png',
    'static/images/fox_sunrise_dawn.png',
    'static/images/fox-autumn-desktop.webp',
    'static/images/fox-autumn.webp',
    'static/images/fox-growth-garden.jpg',
    'static/images/fox-morning.webp',
    'static/images/fox-night.webp',
    'static/images/fox-winter.webp',
    'static/images/home-companion-fox-awake.webp',
    'static/images/home-companion-fox-cropped.png',
    'static/images/home-companion-fox-v2.webp',
    'static/images/home-companion-fox.webp',
    'static/images/image_6.png',
    'static/images/kollarutoversjon.png',
    'static/images/kollarutoversjonmedfjaril.png',
    'static/images/MittHem.png',
    'static/images/MittPsyke-wallpaper-1920x1080.png',
    'static/images/Morgon fox sjön.png',
    'static/images/morgon,dag,kvall.png',
    'static/images/morgon,dag,kväll.png',
    'static/images/morgon.png',
    'static/images/spring_meadow_fox.png',
    'static/images/Stugscen med räv.png',

    # static/images/scenes - pensionerad varg/hund/schäfer-familj
    'static/images/scenes/australisk_shepherd-lying.png',
    'static/images/scenes/australisk_shepherd-playful.png',
    'static/images/scenes/australisk_shepherd-resting.png',
    'static/images/scenes/australisk_shepherd-sitting.png',
    'static/images/scenes/australisk_shepherd-sleeping.png',
    'static/images/scenes/australisk_shepherd-standing.png',
    'static/images/scenes/australisk_shepherd.png',
    'static/images/scenes/australisk_shepherd.webp',
    'static/images/scenes/scahfern.png',
    'static/images/scenes/schafer och australisk_shepherd.png',
    'static/images/scenes/schafer-playful.png',
    'static/images/scenes/schafer-resting.png',
    'static/images/scenes/schafer-sideway.png',
    'static/images/scenes/schafer-sitting.png',
    'static/images/scenes/schafer-sleeping.png',
    'static/images/scenes/schafer-standing.png',
    'static/images/scenes/schafer.png',
    'static/images/scenes/schafer.webp',

    # static/images/scenes - ersatta progress-cabin-lakeside dygnsvarianter
    # (bara bas + afternoon används av progressCompanion.ts)
    'static/images/scenes/progress-cabin-lakeside-day.webp',
    'static/images/scenes/progress-cabin-lakeside-day-800.webp',
    'static/images/scenes/progress-cabin-lakeside-day-1200.webp',
    'static/images/scenes/progress-cabin-lakeside-evening.webp',
    'static/images/scenes/progress-cabin-lakeside-evening-800.webp',
    'static/images/scenes/progress-cabin-lakeside-evening-1200.webp',
    'static/images/scenes/progress-cabin-lakeside-morning.webp',
    'static/images/scenes/progress-cabin-lakeside-morning-800.webp',
    'static/images/scenes/progress-cabin-lakeside-morning-1200.webp',

    # static/images/scenes - övriga bekräftat övergivna
    'static/images/scenes/progress-lake.png',
    'static/images/scenes/dashboard-cabin-close.webp',
    'static/images/scenes/dashboard-cabin-close-1200.webp'
)

# ---------------------------------------------------------------------------
# Steg 3: baseline INNAN radering
# ---------------------------------------------------------------------------
try {
    Run-Baseline -Label 'FÖRE radering'
} catch {
    Write-Host "`nBASELINE ÄR INTE GRÖN. Stoppar. Ingenting raderas." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------------------
# Steg 4: radera ENDAST kategori A/C
# ---------------------------------------------------------------------------
Write-Host "`n=== Raderar kod (Kategori A) ===" -ForegroundColor Yellow
foreach ($f in $codeFiles) {
    if (Test-Path $f) {
        Remove-Item -LiteralPath $f -Force
        Write-Host "  raderad: $f"
    } else {
        Write-Host "  saknas redan: $f" -ForegroundColor DarkYellow
    }
}
# Ta bort den nu tomma mappen, om den verkligen är tom
$dashDir = 'src/lib/components/dashboard'
if ((Test-Path $dashDir) -and ((Get-ChildItem $dashDir -Force | Measure-Object).Count -eq 0)) {
    Remove-Item -LiteralPath $dashDir -Force
    Write-Host "  tom mapp borttagen: $dashDir"
}

Write-Host "`n=== Raderar assets (Kategori C) ===" -ForegroundColor Yellow
$freedBytes = 0
foreach ($f in $assetFiles) {
    if (Test-Path -LiteralPath $f) {
        $freedBytes += (Get-Item -LiteralPath $f).Length
        Remove-Item -LiteralPath $f -Force
        Write-Host "  raderad: $f"
    } else {
        Write-Host "  saknas redan: $f" -ForegroundColor DarkYellow
    }
}
Write-Host ("`nFrigjord assetstorlek: {0:N1} MB" -f ($freedBytes / 1MB)) -ForegroundColor Green

# ---------------------------------------------------------------------------
# Steg 5: baseline EFTER radering
# ---------------------------------------------------------------------------
try {
    Run-Baseline -Label 'EFTER radering'
} catch {
    Write-Host "`nBASELINE BLEV RÖD EFTER RADERING." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Kör 'git status' / 'git diff' för att se vad som togs bort, och" -ForegroundColor Red
    Write-Host "'git checkout -- <fil>' för att återställa enskilda filer vid behov." -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------------------
# Steg 6: enkel efterkontroll - leta kvarvarande referenser till de raderade
# filnamnen (ska ge 0 träffar; annars fanns en referens vi missat)
# ---------------------------------------------------------------------------
Write-Host "`n=== Efterkontroll: kvarvarande referenser till raderade namn ===" -ForegroundColor Yellow
$allRemoved = $codeFiles + $assetFiles
$anyHit = $false
foreach ($f in $allRemoved) {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($f)
    $hits = git grep -n --fixed-strings -- "$base" -- 'src' '*.md' 2>$null
    if ($hits) {
        $anyHit = $true
        Write-Host "  MÖJLIG KVARVARANDE REFERENS ($f):" -ForegroundColor Red
        $hits | ForEach-Object { Write-Host "    $_" }
    }
}
if (-not $anyHit) {
    Write-Host "  Inga kvarvarande referenser hittade." -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Steg 7: rapport
# ---------------------------------------------------------------------------
Write-Host "`n=== git diff --stat ===" -ForegroundColor Yellow
git diff --stat
Write-Host "`n=== git status ===" -ForegroundColor Yellow
git status

Write-Host "`nKlart. INGET har committats eller pushats - granska diffen ovan innan du gör det." -ForegroundColor Green

