param(
  [string]$Root = (Split-Path $PSScriptRoot -Parent)   # the merchant-portal-workflows folder
)
<#
  Regenerates docs/ from src/workflows.js and src/model.js.
  The generator is JavaScript (tools/md.js); it runs in headless Microsoft Edge, which every Windows 11 machine has.
  Run after every change to src/, and commit src/ and docs/ together.
#>
$ErrorActionPreference = 'Stop'
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw 'Microsoft Edge not found.' }

$tmp = Join-Path ([IO.Path]::GetTempPath()) ('mpw-build-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory $tmp | Out-Null
try {
  $url = 'file:///' + ((Join-Path $Root 'tools\build.html') -replace '\\', '/' -replace ' ', '%20')
  $p = Start-Process -FilePath $edge -ArgumentList @('--headless', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', "--user-data-dir=`"$tmp\profile`"", '--dump-dom', "`"$url`"") -RedirectStandardOutput "$tmp\out.html" -RedirectStandardError "$tmp\err.txt" -Wait -PassThru
  $dom = [IO.File]::ReadAllText("$tmp\out.html")
  if ($dom -match '@@ERR@@(.*?)@@END@@') { throw "Generator failed: $($Matches[1])" }
  if ($dom -notmatch '@@B64@@([A-Za-z0-9+/=]+)@@END@@') { throw "No output from Edge (exit $($p.ExitCode)). $([IO.File]::ReadAllText("$tmp\err.txt"))" }
  $json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Matches[1]))
  $files = $json | ConvertFrom-Json
} finally { Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue }

# start clean so a renamed workflow leaves no old file behind
$docs = Join-Path $Root 'docs'
if (Test-Path $docs) { Get-ChildItem $docs -Recurse -Filter *.md | Remove-Item -Force }
$utf8 = New-Object System.Text.UTF8Encoding($false)
$n = 0
foreach ($prop in $files.PSObject.Properties) {
  $path = Join-Path $Root ($prop.Name -replace '/', '\')
  New-Item -ItemType Directory -Force (Split-Path $path -Parent) | Out-Null
  [IO.File]::WriteAllText($path, ($prop.Value -replace "`r`n", "`n"), $utf8)
  $n++
}
Write-Output "Wrote $n files to docs\"

# the same content as one self-contained HTML file
& (Join-Path $PSScriptRoot 'build-html.ps1') -Root $Root
