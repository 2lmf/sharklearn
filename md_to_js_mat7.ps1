$inputFile = "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d\bulk_mat7.md"
$outputFile = "C:\Users\Karlo\.gemini\antigravity\scratch\edukacija-app\content\mat_7.js"

$lines = Get-Content $inputFile -Encoding UTF8
$jsContent = "const Matematika7Questions = ["

foreach ($line in $lines) {
    if ($line -match "^\|\s*\d+\s*\|") {
        $p = $line.Split('|')
        if ($p.Count -ge 11) {
            $id = $p[1].Trim()
            $q = $p[2].Trim() -replace "'", "\'"
            $a = $p[3].Trim() -replace "'", "\'"
            $b = $p[4].Trim() -replace "'", "\'"
            $c = $p[5].Trim() -replace "'", "\'"
            $d = $p[6].Trim() -replace "'", "\'"
            $correct = $p[7].Trim()
            $exp = $p[9].Trim() -replace "'", "\'"
            $sem = $p[10].Trim()

            $jsContent += "`n    { id: $id, question: '$q', options: ['$a', '$b', '$c', '$d'], correct: $correct, explanation: '$exp', semester: $sem },"
        }
    }
}

$jsContent = $jsContent.TrimEnd(',') + "`n];`n`nexport default Matematika7Questions;"
$jsContent | Out-File $outputFile -Encoding UTF8 -Force
Write-Host "Generated $outputFile"
