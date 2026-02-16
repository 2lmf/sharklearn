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

function Shuffle-Options {
    param($arr, $cIdx)
    $val = $arr[$cIdx]
    $sh = @($arr)
    # Shuffle using a simple sort with random
    $sh = $sh | Sort-Object { Get-Random }
    $nIdx = [array]::IndexOf($sh, $val)
    return @{ Opts = $sh; Idx = $nIdx }
}

foreach ($f in $files) {
    $fp = Join-Path $path $f
    if (!(Test-Path $fp)) { continue }
    
    $lines = Get-Content $fp -Encoding UTF8
    $newLines = @()
    $counts = @{0 = 0; 1 = 0; 2 = 0; 3 = 0 }
    
    # Change first line to force UI refresh
    $firstLine = $lines[0]
    if ($firstLine -notmatch "BALANCED") {
        $lines[0] = $firstLine + " - REBALANCED (" + (Get-Date).ToString("HH:mm:ss") + ")"
    }
    else {
        $lines[0] = ($firstLine -replace "REBALANCED \(.*\)", ("REBALANCED (" + (Get-Date).ToString("HH:mm:ss") + ")"))
    }

    foreach ($l in $lines) {
        if ($l -match "^\|\s*\d+\s*\|") {
            $p = $l.Split('|')
            if ($p.Count -ge 8) {
                $o = @($p[3].Trim(), $p[4].Trim(), $p[5].Trim(), $p[6].Trim())
                $idx = [int]($p[7].Trim())
                
                $res = Shuffle-Options -arr $o -cIdx $idx
                $no = $res.Opts
                $ni = $res.Idx
                
                $counts[$ni]++
                
                $p[3] = " " + $no[0] + " "
                $p[4] = " " + $no[1] + " "
                $p[5] = " " + $no[2] + " "
                $p[6] = " " + $no[3] + " "
                $p[7] = " " + $ni + " "
                
                $newLines += ($p -join "|")
            }
            else { $newLines += $l }
        }
        else { $newLines += $l }
    }
    
    # Force write
    [System.IO.File]::WriteAllLines($fp, $newLines)
    Write-Host "Processed $f. Counts: 0=$($counts[0]) 1=$($counts[1]) 2=$($counts[2]) 3=$($counts[3])"
}
