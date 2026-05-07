param(
  [string]$CsvPath = "",
  [int]$Port = 8787
)

$ErrorActionPreference = "Stop"

function Resolve-LeadCsv {
  param([string]$InputPath)

  if ($InputPath -and (Test-Path -LiteralPath $InputPath)) {
    return (Resolve-Path -LiteralPath $InputPath).Path
  }

  $repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
  $workspaceRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..")
  $candidates = @(
    (Join-Path $repoRoot "ataque-hoje-telefone-pronto.csv"),
    (Join-Path $workspaceRoot "ataque-hoje-telefone-pronto.csv"),
    (Join-Path (Get-Location) "ataque-hoje-telefone-pronto.csv"),
    (Join-Path $repoRoot "crm-leads-publicos-auto.csv"),
    (Join-Path $workspaceRoot "crm-leads-publicos-auto.csv"),
    (Join-Path (Get-Location) "crm-leads-publicos-auto.csv")
  )

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  return $null
}

function Get-FirstValue {
  param(
    [object]$Row,
    [string[]]$Names
  )

  foreach ($name in $Names) {
    if ($Row.PSObject.Properties.Name -contains $name) {
      $value = [string]$Row.$name
      if ($value.Trim()) {
        return $value.Trim()
      }
    }
  }

  return ""
}

function Normalize-Phone {
  param([string]$InputPhone)

  $digits = ($InputPhone -replace "\D", "")
  if ($digits.StartsWith("0")) {
    $digits = $digits.Substring(1)
  }
  if ($digits.StartsWith("550")) {
    $digits = "55" + $digits.Substring(3)
  }
  if ($digits.Length -eq 8 -or $digits.Length -eq 9) {
    $digits = "5534$digits"
  }
  if ($digits.Length -eq 10 -or $digits.Length -eq 11) {
    $digits = "55$digits"
  }
  if (!$digits.StartsWith("55") -or $digits.Length -lt 12 -or $digits.Length -gt 13) {
    return ""
  }
  return $digits
}

function Read-Leads {
  param([string]$Path)

  if (!$Path -or !(Test-Path -LiteralPath $Path)) {
    return @()
  }

  $rows = Import-Csv -LiteralPath $Path
  $leads = foreach ($row in $rows) {
    $telefone = Get-FirstValue $row @("telefone", "phone", "whatsapp")
    $telefoneDigits = Get-FirstValue $row @("telefone_digits", "telefone_normalizado", "phone_digits")
    if (!$telefoneDigits) {
      $telefoneDigits = Normalize-Phone $telefone
    }

    $nome = Get-FirstValue $row @("nome", "name", "empresa")
    if (!$nome -or !$telefoneDigits) {
      continue
    }

    [pscustomobject]@{
      id = Get-FirstValue $row @("id", "site_lead_id")
      prioridade = Get-FirstValue $row @("prioridade", "score")
      nome = $nome
      segmento = Get-FirstValue $row @("segmento", "nicho", "category")
      telefone = $telefone
      telefone_digits = $telefoneDigits
      mensagem = Get-FirstValue $row @("mensagem", "abordagem")
      wa_link = Get-FirstValue $row @("wa_link")
      google_maps = Get-FirstValue $row @("google_maps", "maps")
      status = Get-FirstValue $row @("status")
      source = "ponte_local"
    }
  }

  return @($leads)
}

function Write-JsonResponse {
  param(
    [System.Net.HttpListenerContext]$Context,
    [int]$StatusCode,
    [object]$Payload
  )

  $json = $Payload | ConvertTo-Json -Depth 8
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  $response = $Context.Response
  $response.StatusCode = $StatusCode
  $response.ContentType = "application/json; charset=utf-8"
  $response.ContentLength64 = $bytes.Length
  $response.Headers["Access-Control-Allow-Origin"] = "https://pc-express-ai-crm.vercel.app"
  $response.Headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
  $response.Headers["Access-Control-Allow-Headers"] = "Content-Type"
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
  $response.OutputStream.Close()
}

$resolvedCsv = Resolve-LeadCsv $CsvPath
$prefix = "http://127.0.0.1:$Port/"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "PC Express local lead bridge running at $prefix"
if ($resolvedCsv) {
  Write-Host "Reading leads from $resolvedCsv"
} else {
  Write-Host "No CSV found yet. Put ataque-hoje-telefone-pronto.csv in the workspace or pass -CsvPath."
}
Write-Host "Open https://pc-express-ai-crm.vercel.app/cockpit and click Sincronizar ponte, or wait for auto sync."
Write-Host "Press Ctrl+C to stop."

while ($listener.IsListening) {
  $context = $listener.GetContext()

  if ($context.Request.HttpMethod -eq "OPTIONS") {
    $context.Response.StatusCode = 204
    $context.Response.Headers["Access-Control-Allow-Origin"] = "https://pc-express-ai-crm.vercel.app"
    $context.Response.Headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    $context.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type"
    $context.Response.OutputStream.Close()
    continue
  }

  $path = $context.Request.Url.AbsolutePath
  if ($path -eq "/health") {
    Write-JsonResponse $context 200 @{ ok = $true; csvPath = $resolvedCsv }
    continue
  }

  if ($path -eq "/leads") {
    $resolvedCsv = Resolve-LeadCsv $CsvPath
    $leads = Read-Leads $resolvedCsv
    Write-JsonResponse $context 200 @{
      ok = $true
      csvPath = $resolvedCsv
      count = $leads.Count
      updatedAt = (Get-Date).ToString("o")
      leads = $leads
    }
    continue
  }

  Write-JsonResponse $context 404 @{ ok = $false; error = "not_found" }
}
