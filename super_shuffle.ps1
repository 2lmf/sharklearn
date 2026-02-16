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
    "bulk_hrv7.md",
    "bulk_eng7.md",
    "bulk_his5.md",
    "bulk_kem7.md",
    "bulk_fiz7.md",
    "bulk_mat5.md"
)

function Invoke-FisherYatesShuffle {
    param($arr, $correctIdx)
    $obj = $arr[$correctIdx]
    # Fisher-Yates
    for ($i = $arr.Count - 1; $i -gt 0; $i--) {
        $j = Get-Random -Maximum ($i + 1)
        $temp = $arr[$i]
        $arr[$i] = $arr[$j]
        $arr[$j] = $temp
    }
    $newIdx = [array]::IndexOf($arr, $obj)
    return @{ Options = $arr; Index = $newIdx }
}

foreach ($f in $files) {
    $fp = Join-Path $path $f
    if (!(Test-Path $fp)) { continue }
    
    Write-Host "--- Processing $f ---"
    $lines = Get-Content $fp -Encoding UTF8
    $newLines = @()
    $counts = @{0 = 0; 1 = 0; 2 = 0; 3 = 0 }
    
    foreach ($l in $lines) {
        if ($l -match "^\|\s*[^|]+\s*\|") {
            $p = $l.Split('|')
            if ($p.Count -ge 8) {
                $opts = @($p[2].Trim(), $p[3].Trim(), $p[4].Trim(), $p[5].Trim()) # Adjusting indices for ID and Question
                # Wait, the indices in my Viewed super_shuffle were:
                # $p[3], $p[4], $p[5], $p[6] for options and $p[7] for correct index.
                # Let's check the viewed super_shuffle indices again.
                # Viewed super_shuffle Step 3327:
                # $opts = @($p[3].Trim(), $p[4].Trim(), $p[5].Trim(), $p[6].Trim())
                # $cIdx = [int]($p[7].Trim())
                
                # ... wait, if I have | ID | Pitanje | Opt A |... then:
                # p[0] is empty (before first pipe), p[1] is ID, p[2] is Pitanje, p[3] is Opt A
                
                $opts = @($p[3].Trim(), $p[4].Trim(), $p[5].Trim(), $p[6].Trim())
                $cIdx = [int]($p[7].Trim())
                
                $res = Invoke-FisherYatesShuffle -arr $opts -correctIdx $cIdx
                $newOpts = $res.Options
                $newIdx = $res.Index
                
                $counts[$newIdx]++
                
                $p[3] = " " + $newOpts[0] + " "
                $p[4] = " " + $newOpts[1] + " "
                $p[5] = " " + $newOpts[2] + " "
                $p[6] = " " + $newOpts[3] + " "
                $p[7] = " " + $newIdx + " "
                
                $newLines += ($p -join "|")
            }
            else { $newLines += $l }
        }
        else { $newLines += $l }
    }
    
    $v55FileName = "V55_QUIZ_" + ($f -replace "bulk_", "")
    $v55Path = Join-Path $path $v55FileName
    
    $newLines | Set-Content $v55Path -Encoding UTF8 -Force
    Write-Host "Finished $f. Saved to $v55FileName. Distribution: 0:$($counts[0]) 1:$($counts[1]) 2:$($counts[2]) 3:$($counts[3])"
}
