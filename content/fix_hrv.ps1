# Read and fix hrv_8 files by replacing problematic characters before parsing
$contentDir = "C:\Users\Karlo\.gemini\antigravity\scratch\edukacija-app\content"
$outputDir = "C:\Users\Karlo\.gemini\antigravity\brain\90b8fd2d-b313-4708-962c-e7448ffce1b7"

foreach ($file in @("hrv_8", "hrv_8_add")) {
    $jsPath = Join-Path $contentDir "$file.js"
    $content = Get-Content $jsPath -Raw -Encoding UTF8

    # Fix the problematic escaped quotes in the JSON by replacing \" \" with NAVODNI
    $fixedContent = $content -replace '\\"\s*\\"', 'NAVODNI'

    # Extract JSON array
    $arrayMatch = [regex]::Match($fixedContent, '\[[\s\S]*\]')
    if (-not $arrayMatch.Success) {
        Write-Host "SKIP: Could not find array in $file"
        continue
    }

    try {
        $questions = $arrayMatch.Value | ConvertFrom-Json
    }
    catch {
        Write-Host "ERR parsing $file : $($_.Exception.Message)"
        # Fall back to line-by-line approach
        $lines = $content -split "`n"
        $sb = New-Object System.Text.StringBuilder
        [void]$sb.AppendLine("# $file.js")
        [void]$sb.AppendLine("")
        [void]$sb.AppendLine("| ID | Sem | Pitanje | Opcija A | Opcija B | Opcija C | Opcija D | Tocan | Objasnjenje |")
        [void]$sb.AppendLine("| --- | --- | --- | --- | --- | --- | --- | --- | --- |")

        foreach ($line in $lines) {
            $idMatch = [regex]::Match($line, '"id":\s*(\d+)')
            if (-not $idMatch.Success) { continue }
            $id = $idMatch.Groups[1].Value

            $semMatch = [regex]::Match($line, '"semester":\s*(\d+)')
            $sem = if ($semMatch.Success) { $semMatch.Groups[1].Value } else { "" }

            $pitMatch = [regex]::Match($line, '"pitanje":\s*"([^"]*)"')
            $pit = if ($pitMatch.Success) { $pitMatch.Groups[1].Value -replace '\|', '/' } else { "" }

            $opcijeMatch = [regex]::Match($line, '"opcije":\s*\[(.*?)\]')
            $opcije = @("", "", "", "")
            if ($opcijeMatch.Success) {
                $opcijeStr = $opcijeMatch.Groups[1].Value
                $parts = [regex]::Matches($opcijeStr, '"([^"]*)"')
                for ($i = 0; $i -lt [Math]::Min($parts.Count, 4); $i++) {
                    $opcije[$i] = ($parts[$i].Groups[1].Value -replace '\|', '/')
                }
            }

            $tocanMatch = [regex]::Match($line, '"tocan_odgovor":\s*(\d+)')
            $tocan = if ($tocanMatch.Success) { $tocanMatch.Groups[1].Value } else { "" }

            $objMatch = [regex]::Match($line, '"obasnjenje":\s*"([^"]*)"')
            $obj = if ($objMatch.Success) { ($objMatch.Groups[1].Value -replace '\|', '/') } else { "" }

            $row = "| $id | $sem | $pit | $($opcije[0]) | $($opcije[1]) | $($opcije[2]) | $($opcije[3]) | $tocan | $obj |"
            [void]$sb.AppendLine($row)
        }

        $mdPath = Join-Path $outputDir "pitanja_$file.md"
        [System.IO.File]::WriteAllText($mdPath, $sb.ToString(), [System.Text.Encoding]::UTF8)
        $lineCount = ($sb.ToString() -split "`n").Count - 4  # minus header lines
        Write-Host "OK (regex): pitanja_$file.md ($lineCount questions)"
        continue
    }

    # Normal path - JSON parsed successfully
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("# $file.js")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("| ID | Sem | Pitanje | Opcija A | Opcija B | Opcija C | Opcija D | Tocan | Objasnjenje |")
    [void]$sb.AppendLine("| --- | --- | --- | --- | --- | --- | --- | --- | --- |")

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

Write-Host "Done!"
