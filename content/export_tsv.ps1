# Convert all question JS files to tab-separated values (TSV) for direct Excel import
$contentDir = "C:\Users\Karlo\.gemini\antigravity\scratch\edukacija-app\content"
$outputDir = "C:\Users\Karlo\.gemini\antigravity\scratch\edukacija-app\excel_export"

# Create output directory
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$brainDir = "C:\Users\Karlo\.gemini\antigravity\brain\90b8fd2d-b313-4708-962c-e7448ffce1b7"

# Process each markdown file from brain directory
$mdFiles = Get-ChildItem "$brainDir\pitanja_*.md" | Where-Object { $_.Name -notlike "*MATEMATIKA*" -and $_.Name -notlike "*FIZIKA*" -and $_.Name -notlike "*KEMIJA*" -and $_.Name -notlike "*BIOLOGIJA*" -and $_.Name -notlike "*GEOGRAFIJA*" -and $_.Name -notlike "*POVIJEST*" -and $_.Name -notlike "*HRVATSKI*" -and $_.Name -notlike "*NJEMACKI*" -and $_.Name -notlike "*ENGLESKI*" -and $_.Name -notlike "*LIKOVNO*" -and $_.Name -notlike "*GLAZBENO*" -and $_.Name -notlike "*TEHNICKO*" -and $_.Name -notlike "*VJERONAUK*" -and $_.Name -notlike "*sve*" }

foreach ($file in $mdFiles) {
    $lines = Get-Content $file.FullName -Encoding UTF8
    $tsvName = $file.BaseName -replace 'pitanja_', ''
    $tsvPath = Join-Path $outputDir "$tsvName.tsv"
    
    $sb = New-Object System.Text.StringBuilder
    # Add TSV header
    [void]$sb.AppendLine("ID`tSemestar`tPitanje`tOpcija A`tOpcija B`tOpcija C`tOpcija D`tTocan odgovor`tObjasnjenje")
    
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        # Skip non-data lines
        if ($trimmed -eq '' -or $trimmed -match '^\#' -or $trimmed -match '^\| ---' -or $trimmed -match '^\| ID') { continue }
        if ($trimmed -match '^\|') {
            # Parse markdown table row
            $cells = $trimmed -split '\|' | Where-Object { $_.Trim() -ne '' } | ForEach-Object { $_.Trim() }
            if ($cells.Count -ge 9) {
                $tsvLine = $cells[0..8] -join "`t"
                [void]$sb.AppendLine($tsvLine)
            }
        }
    }
    
    [System.IO.File]::WriteAllText($tsvPath, $sb.ToString(), (New-Object System.Text.UTF8Encoding $true))
    Write-Host "OK: $tsvName.tsv ($(@($lines | Where-Object { $_ -match '^\| \d+' }).Count) rows)"
}

$count = (Get-ChildItem "$outputDir\*.tsv").Count
Write-Host "`nDone! $count TSV files created in: $outputDir"
