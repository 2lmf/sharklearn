$path = "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d"
$files = @(
    "QUIZ_pri5.md",
    "QUIZ_ger7.md",
    "QUIZ_bio7_full.md",
    "QUIZ_geo5_full.md",
    "QUIZ_eng5_full.md",
    "bulk_ger5_full.md",
    "QUIZ_geo7_full.md",
    "QUIZ_his7.md",
    "QUIZ_hrv5.md",
    "QUIZ_hrv7.md"
)

function Shuffle-Array {
    param($arr)
    $shuffled = @($arr)
    for ($i = $shuffled.Count - 1; $i -gt 0; $i--) {
        $j = Get-Random -Maximum ($i + 1)
        $temp = $shuffled[$i]
        $shuffled[$i] = $shuffled[$j]
        $shuffled[$j] = $temp
    }
    return $shuffled
}

foreach ($f in $files) {
    $fp = Join-Path $path $f
    if (!(Test-Path $fp)) { 
        Write-Host "File not found: $f"
        continue 
    }
    
    Write-Host "`n=== PROCESSING $f ==="
    $lines = Get-Content $fp -Encoding UTF8
    $newLines = @()
    $counts = @{0 = 0; 1 = 0; 2 = 0; 3 = 0 }
    
    foreach ($l in $lines) {
        if ($l -match "^\|\s*\d+\s*\|") {
            $p = $l.Split('|')
            # Format: | ID | Question | A | B | C | D | Index | rest...
            if ($p.Count -ge 8) {
                $id = $p[1].Trim()
                $q = $p[2].Trim()
                $opts = @($p[3].Trim(), $p[4].Trim(), $p[5].Trim(), $p[6].Trim())
                $oldIdxStr = $p[7].Trim()
                
                if ($oldIdxStr -match "^\d$") {
                    $oldIdx = [int]$oldIdxStr
                    $correctVal = $opts[$oldIdx]
                    
                    # Shuffle options
                    $shuffled = Shuffle-Array -arr $opts
                    $newIdx = [array]::IndexOf($shuffled, $correctVal)
                    
                    if ($newIdx -lt 0) {
                        # Safety fallback if something went wrong
                        $newIdx = $oldIdx
                        $newLines += $l
                        continue
                    }
                    
                    $counts[$newIdx]++
                    
                    # Update parts
                    $p[3] = " " + $shuffled[0] + " "
                    $p[4] = " " + $shuffled[1] + " "
                    $p[5] = " " + $shuffled[2] + " "
                    $p[6] = " " + $shuffled[3] + " "
                    $p[7] = " " + $newIdx + " "
                    
                    $newLine = $p -join "|"
                    $newLines += $newLine
                    
                    if ([int]$id -le 3) {
                        Write-Host "ID $($id): Index changed from $($oldIdx) to $($newIdx)"
                    }
                }
                else {
                    $newLines += $l
                }
            }
            else {
                $newLines += $l
            }
        }
        else {
            $newLines += $l
        }
    }
    
    # Write back to file ENCODING is important
    $newLines | Out-File $fp -Encoding UTF8 -Force
    Write-Host ("Final Distribution for {0}: 0:{1}, 1:{2}, 2:{3}, 3:{4}" -f $f, $counts[0], $counts[1], $counts[2], $counts[3])
}
Write-Host "`nAll files processed successfully."
