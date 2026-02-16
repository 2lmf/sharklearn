$path = "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d"
$files = @(
    "bulk_pri5.md",
    "bulk_ger7.md",
    "bulk_bio7_full.md",
    "bulk_geo5_full.md",
    "bulk_eng5_full.md",
    "bulk_ger5_full.md",
    "bulk_geo7_full.md",
    "bulk_his7.md",
    "bulk_hrv5.md",
    "bulk_hrv7.md"
)

foreach ($f in $files) {
    $fp = Join-Path $path $f
    if (!(Test-Path $fp)) { continue }
    
    Write-Host "--- SHUFFLING $f ---"
    $lines = Get-Content $fp -Encoding UTF8
    $newLines = @()
    $counts = @{0 = 0; 1 = 0; 2 = 0; 3 = 0 }
    
    foreach ($l in $lines) {
        if ($l -match "^\|\s*\d+\s*\|") {
            $p = $l.Split('|')
            if ($p.Count -ge 8) {
                # ID | Pitanje | A | B | C | D | Index | rest...
                $id = $p[1].Trim()
                $q = $p[2].Trim()
                $optTexts = @($p[3].Trim(), $p[4].Trim(), $p[5].Trim(), $p[6].Trim())
                $oldIdx = [int]($p[7].Trim())
                
                $correctVal = $optTexts[$oldIdx]
                
                # Shuffle until index is NOT the same for the first few (to avoid bias in first few questions)
                # Just kidding, standard shuffle is fine, but let's log the first 5
                
                $shuffled = $optTexts | Sort-Object { Get-Random }
                $newIdx = [array]::IndexOf($shuffled, $correctVal)
                
                $counts[$newIdx]++
                
                $p[3] = " " + $shuffled[0] + " "
                $p[4] = " " + $shuffled[1] + " "
                $p[5] = " " + $shuffled[2] + " "
                $p[6] = " " + $shuffled[3] + " "
                $p[7] = " " + $newIdx + " "
                
                $newLine = $p -join "|"
                $newLines += $newLine
                
                if ([int]$id -le 5) {
                    Write-Host "ID $id: OldIdx $oldIdx -> NewIdx $newIdx"
                }
            }
            else { $newLines += $l }
        }
        else { $newLines += $l }
    }
    
    # Use different write method to be super sure
    [System.IO.File]::WriteAllLines($fp, $newLines)
    Write-Host "Done $f. Distribution: 0:$($counts[0]) 1:$($counts[1]) 2:$($counts[2]) 3:$($counts[3])"
}
