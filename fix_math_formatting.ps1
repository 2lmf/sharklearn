# fix_math_formatting.ps1
# Automates the replacement of decimal points with commas and ensures spaces around fraction slashes.

$files = @(
    "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d\bulk_mat5.md",
    "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d\bulk_mat7.md",
    "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d\bulk_kem7.md",
    "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d\bulk_fiz7.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file ..."
        $content = Get-Content $file -Raw -Encoding UTF8

        # 1. Replace decimal points with commas in numbers (e.g., 0.5 -> 0,5)
        # Using regex to find digits followed by dot then digits
        $content = [regex]::Replace($content, '(\d+)\.(\d+)', '$1,$2')

        # 2. Ensure spaces around slashes in fractions (e.g., 1/2 -> 1 / 2)
        # But only if it's a numeric fraction pattern to avoid breaking other slashes
        # Matches digit(s)/digit(s) and adds spaces if missing
        $content = [regex]::Replace($content, '(\d+)\/(\d+)', '$1 / $2')
        
        # Clean up double spaces if any were already there
        $content = $content -replace '  /  ', ' / '
        $content = $content -replace ' /  ', ' / '
        $content = $content -replace '  / ', ' / '

        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "Fixed formatting in $file"
    }
    else {
        Write-Warning "File not found: $file"
    }
}

Write-Host "All files processed. Running super_shuffle.ps1 to update V55 and JS files..."
& ./super_shuffle.ps1
