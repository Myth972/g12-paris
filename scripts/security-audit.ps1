# ============================================================
#  G12 Paris Infos Medias - Audit securite hebdomadaire
#  Verifie pnpm audit (+ pnpm outdated) et ecrit un rapport
#  Markdown dans backups/security-audits/
#
#  Usage :
#    powershell -ExecutionPolicy Bypass -File scripts/security-audit.ps1
#  Planifie chaque lundi 09:00 par scripts/setup-security-audit-cron.ps1
#  Note : ASCII strict obligatoire (PowerShell 5.1 sans BOM)
# ============================================================

param(
    [string]$ReportDir = "",
    [int]$RetentionReports = 90
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

if (-not $ReportDir) {
    $ReportDir = Join-Path -Path $ProjectRoot -ChildPath "backups\security-audits"
}
New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null

$Date = Get-Date -Format "yyyy-MM-dd"
$ReportPath = Join-Path -Path $ReportDir -ChildPath "audit-$Date.md"

Set-Location -Path $ProjectRoot

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Audit securite G12 Paris Infos Medias" -ForegroundColor Cyan
Write-Host " Projet: $ProjectRoot" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# ── 1. pnpm audit ─────────────────────────────────────────────
$AuditOutput = (& pnpm audit --json 2>$null | Out-String)
$Counts = @{ critical = 0; high = 0; moderate = 0; low = 0; total = 0 }
$Advisories = @()

try {
    $Audit = $AuditOutput | ConvertFrom-Json
    if ($Audit.metadata.vulnerabilities) {
        $m = $Audit.metadata.vulnerabilities
        $Counts.critical = [int]$m.critical
        $Counts.high = [int]$m.high
        $Counts.moderate = [int]$m.moderate
        $Counts.low = [int]$m.low
        $Counts.total = [int]$m.total
    }
    if ($Audit.advisories -and $Audit.advisories.PSObject.Properties.Count -gt 0) {
        $Advisories = @($Audit.advisories.PSObject.Properties.Value | Where-Object { $_.module_name })
    } elseif ($Audit.vulnerabilities -and $Audit.vulnerabilities.PSObject.Properties.Count -gt 0) {
        $Advisories = @($Audit.vulnerabilities.PSObject.Properties.Value | Where-Object { $_.name })
    }
} catch {
    Write-Host " [WARN] Sortie pnpm audit illisible (pnpm a tourne ?)" -ForegroundColor Yellow
}

# ── 2. pnpm outdated (info, non bloquant, JSON propre) ────────
$OutdatedLines = @()
$OutdatedJson = (& pnpm outdated --json 2>$null | Out-String)
try {
    $Outdated = $OutdatedJson | ConvertFrom-Json
    foreach ($p in $Outdated.PSObject.Properties) {
        $o = $p.Value
        $latest = if ($o.latest) { $o.latest } else { $o.next }
        $OutdatedLines += "$($p.Name) : $($o.current) -> $latest [$($o.dependencyType)]"
    }
} catch {
    $OutdatedLines = @("(pnpm outdated indisponible ou sortie illisible)")
}

# ── 3. Rapport Markdown ───────────────────────────────────────
if ($Counts.total -eq 0) {
    $Verdict = "OK - aucune vulnerabilite connue"
} else {
    $Verdict = "[$($Counts.total)] vulnerabilit(s) - remediation requise"
}

$AdvLines = ""
if ($Advisories.Count -gt 0) {
    foreach ($a in $Advisories) {
        $AdvLines += "- **$($a.module_name)** [$($a.severity)] - $($a.title)`n  Versions : `"$($a.vulnerable_versions)`" -> corrige: `"$($a.patched_versions)`" - $($a.url)`n"
    }
} else {
    $AdvLines = "Aucune."
}

$OutdatedBlock = ([string]::Join("`n", ($OutdatedLines | ForEach-Object { "    $_" })))

$Report = @"
# Audit securite - $Date

**Verdict : $Verdict**

| Severite | Nombre |
|---|---|
| critique | $($Counts.critical) |
| elevee | $($Counts.high) |
| moderee | $($Counts.moderate) |
| faible | $($Counts.low) |
| **Total** | **$($Counts.total)** |

## Relance a faire

- Si total > 0 : identifier les paquets critiques/eleves ci-dessous,
  chercher la version corrigee (``pnpm view <pkg> version``) puis appliquer
  une montee directe (in-range) ou un override dans package.json, et
  verifier audit + tests + build avant commit.
- Surveiller les montees mineures listees dans la section Depassements.

## Vulnerabilites detaillees

$AdvLines

## Depassements (outdated)

$OutdatedBlock

_Rapport genere automatiquement par scripts/security-audit.ps1._
"@

[System.IO.File]::WriteAllText($ReportPath, $Report)
Write-Host " Rapport : $ReportPath" -ForegroundColor Cyan

# ── 4. Retention des rapports ─────────────────────────────────
if ($RetentionReports -gt 0) {
    $Cutoff = (Get-Date).AddDays(-$RetentionReports)
    Get-ChildItem -Path $ReportDir -Filter "audit-*.md" | Where-Object {
        $_.CreationTime -lt $Cutoff
    } | ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host " [NETTOYAGE] Ancien rapport supprime : $($_.Name)" -ForegroundColor DarkYellow
    }
}

# ── 5. Resume console + code de sortie ───────────────────────
if ($Counts.total -eq 0) {
    Write-Host ""
    Write-Host " [OK] Aucune vulnerabilite connue." -ForegroundColor Green
    exit 0
} else {
    if (($Counts.critical + $Counts.high) -gt 0) {
        Write-Host ""
        Write-Host " [!!!] $($Counts.total) vulnerabilit(s), dont $($Counts.critical) critique(s) et $($Counts.high) elevee(s) !" -ForegroundColor Red
    } else {
        Write-Host ""
        Write-Host " [$($Counts.total)] vulnerabilit(s) (aucune critique/elevee)." -ForegroundColor Yellow
    }
    exit 1
}
