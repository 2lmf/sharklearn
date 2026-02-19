# Generate markdown tables from JS quiz files with CORRECT column order
$contentDir = "C:\Users\Karlo\.gemini\antigravity\scratch\edukacija-app\content"
$outDir = Join-Path $contentDir "md_output"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$jsFiles = Get-ChildItem "$contentDir\*.js" | Where-Object { $_.Name -ne 'gen_md.js' }

foreach ($file in $jsFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("| ID | Pitanje | Opcija A | Opcija B | Opcija C | Opcija D | Točan (0-3) | URL slike | Objašnjenje | Semestar |")
    [void]$sb.AppendLine("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
    
    # Extract each question object using regex
    $pattern = '\{\s*"id"\s*:\s*(\d+)\s*,\s*"semester"\s*:\s*(\d+)\s*,\s*"pitanje"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"opcije"\s*:\s*\[\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\]\s*,\s*"tocan_odgovor"\s*:\s*(\d+)\s*,\s*"obasnjenje"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}'
    
    $matches_found = [regex]::Matches($content, $pattern)
    
    $count = 0
    foreach ($m in $matches_found) {
        $id = $m.Groups[1].Value
        $sem = $m.Groups[2].Value
        $pitanje = $m.Groups[3].Value -replace '\\\"', '"' -replace '\|', '\|'
        $opcA = $m.Groups[4].Value -replace '\\\"', '"' -replace '\|', '\|'
        $opcB = $m.Groups[5].Value -replace '\\\"', '"' -replace '\|', '\|'
        $opcC = $m.Groups[6].Value -replace '\\\"', '"' -replace '\|', '\|'
        $opcD = $m.Groups[7].Value -replace '\\\"', '"' -replace '\|', '\|'
        $tocan = $m.Groups[8].Value
        $obj = $m.Groups[9].Value -replace '\\\"', '"' -replace '\|', '\|'
        
        [void]$sb.AppendLine("| $id | $pitanje | $opcA | $opcB | $opcC | $opcD | $tocan | | $obj | $sem |")
        $count++
    }
    
    $baseName = $file.BaseName
    $outFile = Join-Path $outDir "$baseName.md"
    [System.IO.File]::WriteAllText($outFile, $sb.ToString(), [System.Text.Encoding]::UTF8)
    Write-Host "OK: $baseName.md ($count rows)"
}

Write-Host "`nDone!"
