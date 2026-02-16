$brainPath = "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d"
$scratchPath = "C:\Users\Karlo\.gemini\antigravity\scratch\edukacija-app"

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

function Get-ShuffledResult {
    param($options, $correctIndex)
    $correctValue = $options[$correctIndex]
    $shuffled = $options | Sort-Object { Get-Random }
    $newIndex = [array]::IndexOf($shuffled, $correctValue)
    return @{ Options = $shuffled; NewIndex = $newIndex }
}

foreach ($filename in $files) {
    $fullPath = Join-Path $brainPath $filename
    
    if (Test-Path $fullPath) {
        Write-Host "Processing $filename ..."
        $lines = Get-Content $fullPath -Encoding UTF8
        $newLines = @()
        $timestamp = Get-Date -Format "HH:mm:ss"
        
        # Update first line
        $firstLine = $lines[0]
        $headerText = "# V55 SHUFFLED ($timestamp) - " + ($firstLine -replace "^# ", "" -replace " - REBALANCED \(.*\)", "")
        $newLines += $headerText

        foreach ($line in $lines) {
            if ($line -match "^\|\s*\d+\s*\|") {
                $parts = $line.Split('|')
                if ($parts.Count -ge 8) {
                    $opts = @($parts[3].Trim(), $parts[4].Trim(), $parts[5].Trim(), $parts[6].Trim())
                    $oldIdxStr = $parts[7].Trim()
                    
                    if ($oldIdxStr -match "^\d$") {
                        $oldIdx = [int]$oldIdxStr
                        $res = Get-ShuffledResult -options $opts -correctIndex $oldIdx
                        
                        $newOpts = $res.Options
                        $newIdx = $res.NewIndex
                        
                        $parts[3] = " " + $newOpts[0] + " "
                        $parts[4] = " " + $newOpts[1] + " "
                        $parts[5] = " " + $newOpts[2] + " "
                        $parts[6] = " " + $newOpts[3] + " "
                        $parts[7] = " " + $newIdx + " "
                        
                        $newLines += ($parts -join "|")
                    }
                    else { $newLines += $line }
                }
                else { $newLines += $line }
            }
            elseif ($line -ne $lines[0] -and $line.Trim() -ne "") {
                $newLines += $line
            }
        }
        
        # Write to original location
        $newLines | Set-Content $fullPath -Encoding UTF8 -Force
        
        # Write to V55 unique file
        $v55Path = Join-Path $brainPath ("V55_" + $filename)
        $newLines | Set-Content $v55Path -Encoding UTF8 -Force
        
        # Write to scratch destination
        $scratchFile = Join-Path $scratchPath ("V55_" + $filename)
        $newLines | Set-Content $scratchFile -Encoding UTF8 -Force
        
        Write-Host "SUCCESS: $filename rebalanced and saved to 3 locations."
    }
    else {
        Write-Host "ERROR: File NOT FOUND at $fullPath"
    }
}
