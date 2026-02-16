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
    param ($options, $correctIndex)
    
    $correctText = $options[$correctIndex]
    $shuffled = $options | Sort-Object { Get-Random }
    $newIndex = [array]::IndexOf($shuffled, $correctText)
    
    return @{ Options = $shuffled; NewIndex = $newIndex }
}

foreach ($filename in $files) {
    $fullPath = Join-Path $path $filename
    if (Test-Path $fullPath) {
        Write-Host "Checking $filename..."
        $lines = Get-Content $fullPath -Encoding UTF8
        $counts = @{ "0" = 0; "1" = 0; "2" = 0; "3" = 0 }
        $totalQuestions = 0
        
        $newLines = @()
        $needsRewrite = $false
        
        # First verify distribution
        foreach ($line in $lines) {
            if ($line -match "^\|\s*\d+\s*\|") {
                $parts = $line.Split('|')
                if ($parts.Length -ge 8) {
                    $idx = $parts[7].Trim()
                    if ($counts.ContainsKey($idx)) {
                        $counts[$idx]++
                        $totalQuestions++
                    }
                }
            }
        }
        
        Write-Host "Distribution for $filename : 0=$($counts['0']) | 1=$($counts['1']) | 2=$($counts['2']) | 3=$($counts['3']) (Total: $totalQuestions)"
        
        # Logic to re-shuffle if necessary or if user requested explicit refresh
        # Since user complained, let's force a re-shuffle to be sure
        
        foreach ($line in $lines) {
            if ($line -match "^\|\s*\d+\s*\|") {
                $parts = $line.Split('|')
                if ($parts.Length -ge 8) {
                    try {
                        $options = @($parts[3].Trim(), $parts[4].Trim(), $parts[5].Trim(), $parts[6].Trim())
                        $cleanCorrect = $parts[7].Trim()
                        
                        if ($cleanCorrect -match "^\d$") {
                            $correctIndex = [int]$cleanCorrect
                            
                            # Force Shuffle
                            $result = Shuffle-Options -options $options -correctIndex $correctIndex
                            $shuffled = $result.Options
                            $newIndex = $result.NewIndex
                             
                            $parts[3] = " " + $shuffled[0] + " "
                            $parts[4] = " " + $shuffled[1] + " "
                            $parts[5] = " " + $shuffled[2] + " "
                            $parts[6] = " " + $shuffled[3] + " "
                            $parts[7] = " " + $newIndex + " "
                             
                            $newLines += ($parts -join "|")
                        }
                        else {
                            $newLines += $line
                        }
                    }
                    catch {
                        $newLines += $line
                    }
                }
                else {
                    $newLines += $line
                }
            }
            else {
                $newLines += $line
            }
        }
        
        $newLines | Set-Content $fullPath -Encoding UTF8
        Write-Host "Re-shuffled and saved $filename."
    }
}
