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

function Write-RawJsonResponse {
  param(
    [System.IO.Stream]$Stream,
    [int]$StatusCode,
    [object]$Payload
  )

  $json = $Payload | ConvertTo-Json -Depth 8
  $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  $reason = if ($StatusCode -eq 200) { "OK" } elseif ($StatusCode -eq 204) { "No Content" } elseif ($StatusCode -eq 404) { "Not Found" } else { "OK" }
  $headers = @(
    "HTTP/1.1 $StatusCode $reason",
    "Content-Type: application/json; charset=utf-8",
    "Content-Length: $($bodyBytes.Length)",
    "Access-Control-Allow-Origin: https://pc-express-ai-crm.vercel.app",
    "Access-Control-Allow-Methods: GET, OPTIONS",
    "Access-Control-Allow-Headers: Content-Type",
    "Access-Control-Allow-Private-Network: true",
    "Cache-Control: no-store",
    "Connection: close",
    "",
    ""
  ) -join "`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($bodyBytes.Length -gt 0) {
    $Stream.Write($bodyBytes, 0, $bodyBytes.Length)
  }
  $Stream.Flush()
}

$resolvedCsv = Resolve-LeadCsv $CsvPath
$prefix = "http://127.0.0.1:$Port/"
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $Port)
$listener.Start()

Write-Host "PC Express local lead bridge running at $prefix"
if ($resolvedCsv) {
  Write-Host "Reading leads from $resolvedCsv"
} else {
  Write-Host "No CSV found yet. Put ataque-hoje-telefone-pronto.csv in the workspace or pass -CsvPath."
}
Write-Host "Open https://pc-express-ai-crm.vercel.app/cockpit and click Sincronizar ponte, or wait for auto sync."
Write-Host "Press Ctrl+C to stop."

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
    $requestLine = $reader.ReadLine()
    while ($true) {
      $line = $reader.ReadLine()
      if ($null -eq $line -or $line -eq "") {
        break
      }
    }

    if (!$requestLine) {
      Write-RawJsonResponse $stream 400 @{ ok = $false; error = "bad_request" }
      continue
    }

    $parts = $requestLine.Split(" ")
    $method = $parts[0]
    $path = ($parts[1] -split "\?")[0]

    if ($method -eq "OPTIONS") {
      Write-RawJsonResponse $stream 204 @{}
      continue
    }

    if ($path -eq "/health") {
      Write-RawJsonResponse $stream 200 @{ ok = $true; csvPath = $resolvedCsv }
      continue
    }

    if ($path -eq "/leads") {
      $resolvedCsv = Resolve-LeadCsv $CsvPath
      $leads = Read-Leads $resolvedCsv
      Write-RawJsonResponse $stream 200 @{
        ok = $true
        csvPath = $resolvedCsv
        count = $leads.Count
        updatedAt = (Get-Date).ToString("o")
        leads = $leads
      }
      continue
    }

    Write-RawJsonResponse $stream 404 @{ ok = $false; error = "not_found" }
  } finally {
    $client.Close()
  }
}
