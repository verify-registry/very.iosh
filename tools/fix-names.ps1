$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

Get-ChildItem -LiteralPath $projectRoot -Recurse -File |
    Where-Object { $_.Name -match '\.\p{IsArabic}+$' } |
    ForEach-Object {
        $newName = $_.Name -replace '\.\p{IsArabic}+$', ''
        Write-Host ("Renaming: {0} -> {1}" -f $_.FullName, $newName)
        Rename-Item -LiteralPath $_.FullName -NewName $newName
    }

Write-Host 'Finished checking file names.'
