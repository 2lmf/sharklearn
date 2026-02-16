$inputFile = "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d\V55_QUIZ_mat5.md"
$outputFile = "C:\Users\Karlo\.gemini\antigravity\scratch\edukacija-app\content\mat_5.js"

$lines = Get-Content $inputFile -Encoding UTF8
$jsData = @()

foreach ($line in $lines) {
    if ($line -match "^\|\s*\d+\s*\|") {
        $p = $line.Split('|')
        # p[1]=ID, p[2]=Question, p[3]=OptA, p[4]=OptB, p[5]=OptC, p[6]=OptD, p[7]=Correct, p[8]=Img, p[9]=Exp, p[10]=Sem
        if ($p.Count -ge 11) {
            $id = $p[1].Trim()
            $q = $p[2].Trim()
            $a = $p[3].Trim()
            $b = $p[4].Trim()
            $c = $p[5].Trim()
            $d = $p[6].Trim()
            $correct = $p[7].Trim()
            $exp = $p[9].Trim()
            $sem = $p[10].Trim()
            
            # Escape double quotes for JS
            $q = $q -replace '"', '\"'
            $a = $a -replace '"', '\"'
            $b = $b -replace '"', '\"'
            $c = $c -replace '"', '\"'
            $d = $d -replace '"', '\"'
            $exp = $exp -replace '"', '\"'

            $obj = "    { `"id`": $id, `"semester`": $sem, `"pitanje`": `"$q`", `"opcije`": [`"$a`", `"$b`", `"$c`", `"$d`"], `"tocan_odgovor`": $correct, `"obasnjenje`": `"$exp`" }"
            $jsData += $obj
        }
    }
}

$jsContent = "const MAT_DATA = [`n" + ($jsData -join ",`n") + "`n];"
$jsContent | Out-File $outputFile -Encoding UTF8 -Force
Write-Host "Conversion complete. Saved to $outputFile"
