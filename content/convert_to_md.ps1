# Convert all quiz JS files to markdown tables
$contentDir = "C:\Users\Karlo\.gemini\antigravity\scratch\edukacija-app\content"
$outputDir = "C:\Users\Karlo\.gemini\antigravity\brain\90b8fd2d-b313-4708-962c-e7448ffce1b7"

$files = @(
    "mat_8", "mat_8_add",
    "fiz_8", "fiz_8_add",
    "kem_8", "kem_8_add",
    "bio_8", "bio_8_add",
    "geo_8", "geo_8_add",
    "his_8", "his_8_add",
    "hrv_8", "hrv_8_add",
    "ger_8", "ger_8_add",
    "eng_8", "eng_8_add",
    "lik_8", "lik_8_add",
    "gla_8", "gla_8_add",
    "teh_8", "teh_8_add",
    "vje_5", "vje_6", "vje_7", "vje_8"
)

foreach ($file in $files) {
    $jsPath = Join-Path $contentDir "$file.js"
    if (-not (Test-Path $jsPath)) {
        Write-Host "SKIP: $jsPath not found"
        continue
    }

    $content = Get-Content $jsPath -Raw -Encoding UTF8

    # Parse JSON array from JS
    $pattern = '\[[\s\S]*\]'
    $arrayMatch = [regex]::Match($content, $pattern)
    if (-not $arrayMatch.Success) {
        Write-Host "SKIP: Could not parse array in $file.js"
        continue
    }

    $jsonStr = $arrayMatch.Value
    try {
        $questions = $jsonStr | ConvertFrom-Json
    }
    catch {
        Write-Host "ERROR parsing JSON in ${file}.js: $_"
        continue
    }

    # Build markdown table
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("# $file.js")
    [void]$sb.AppendLine("")
    $header = "| ID | Sem | Pitanje | Opcija A | Opcija B | Opcija C | Opcija D | Tocan | Objasnjenje |"
    [void]$sb.AppendLine($header)
    $sep = "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"
    [void]$sb.AppendLine($sep)

    foreach ($q in $questions) {
        $pit = ($q.pitanje -replace '\|', '/').Trim()
        $o0 = ($q.opcije[0] -replace '\|', '/').Trim()
        $o1 = ($q.opcije[1] -replace '\|', '/').Trim()
        $o2 = ($q.opcije[2] -replace '\|', '/').Trim()
        $o3 = ($q.opcije[3] -replace '\|', '/').Trim()
        $obj = ($q.obasnjenje -replace '\|', '/').Trim()
        $row = "| $($q.id) | $($q.semester) | $pit | $o0 | $o1 | $o2 | $o3 | $($q.tocan_odgovor) | $obj |"
        [void]$sb.AppendLine($row)
    }

    $mdPath = Join-Path $outputDir "pitanja_$file.md"
    [System.IO.File]::WriteAllText($mdPath, $sb.ToString(), [System.Text.Encoding]::UTF8)
    Write-Host "OK: pitanja_$file.md ($($questions.Count) questions)"
}

Write-Host ""
Write-Host "Done! All files converted."
