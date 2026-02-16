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

foreach ($filename in $files) {
    $fullPath = Join-Path $path $filename
    if (Test-Path $fullPath) {
        Write-Host "Processing $filename..."
        $lines = Get-Content $fullPath -Encoding UTF8
        $newLines = @()
        
        foreach ($line in $lines) {
            # Check if line looks like a table row starting with a number ID
            # Regex: Start, |, whitespace, digits, whitespace, |
            if ($line -match "^\|\s*\d+\s*\|") {
                $parts = $line.Split('|')
                
                # Check if we have enough columns (at least 8 to have options and correct index)
                # 0:empty, 1:ID, 2:Q, 3:A, 4:B, 5:C, 6:D, 7:Correct
                if ($parts.Length -ge 8) {
                    try {
                        $options = @($parts[3].Trim(), $parts[4].Trim(), $parts[5].Trim(), $parts[6].Trim())
                        $cleanCorrect = $parts[7].Trim()
                        
                        if ($cleanCorrect -match "^\d$") {
                            $correctIndex = [int]$cleanCorrect
                            
                            if ($correctIndex -ge 0 -and $correctIndex -le 3) {
                                $correctAnswer = $options[$correctIndex]
                                
                                # Shuffle options
                                $shuffled = $options | Sort-Object { Get-Random }
                                
                                # Find new index
                                $newIndex = [array]::IndexOf($shuffled, $correctAnswer)
                                
                                # Update parts
                                $parts[3] = " " + $shuffled[0] + " "
                                $parts[4] = " " + $shuffled[1] + " "
                                $parts[5] = " " + $shuffled[2] + " "
                                $parts[6] = " " + $shuffled[3] + " "
                                $parts[7] = " " + $newIndex + " "
                                
                                # Reconstruct line
                                $newLine = $parts -join "|"
                                $newLines += $newLine
                            }
                            else {
                                $newLines += $line
                            }
                        }
                        else {
                            $newLines += $line
                        }
                    }
                    catch {
                        Write-Host "Error parsing line: $line"
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
    }
    else {
        Write-Host "File not found: $filename"
    }
}
Write-Host "Rebalancing complete!"
