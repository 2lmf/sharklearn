# precision_shuffle_kem7.ps1
$f = "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d\V55_QUIZ_kem7.md"
$lines = Get-Content $f -Encoding UTF8
$newLines = @($lines[0], $lines[1], $lines[2])
$dataRows = @()
foreach ($l in $lines) { if ($l -match "^\|\s*\d+\s*\|") { $dataRows += $l } }
$shuffledRows = @()
foreach ($row in $dataRows) {
    $p = $row.Split('|')
    if ($p.Count -ge 11) {
        $id = $p[1].Trim()
        $q = $p[2].Trim()
        $opts = @($p[3].Trim(), $p[4].Trim(), $p[5].Trim(), $p[6].Trim())
        $oldCorrectIdx = [int]($p[7].Trim())
        $correctVal = $opts[$oldCorrectIdx]
        $url = $p[8].Trim()
        $exp = $p[9].Trim()
        $sem = $p[10].Trim()
        $indices = 0..3 | Get-Random -Count 4
        $newOpts = @("", "", "", "")
        for ($i = 0; $i -lt 4; $i++) { $newOpts[$i] = $opts[$indices[$i]] }
        $newCorrectIdx = -1
        for ($i = 0; $i -lt 4; $i++) { if ($newOpts[$i] -eq $correctVal) { $newCorrectIdx = $i; break } }
        $shuffledRows += "| $id | $q | $($newOpts[0]) | $($newOpts[1]) | $($newOpts[2]) | $($newOpts[3]) | $newCorrectIdx | $url | $exp | $sem |"
    }
}
$newLines += $shuffledRows
$newLines | Out-File $f -Encoding UTF8 -Force
Write-Host "Kemija 7 reshuffled!"
