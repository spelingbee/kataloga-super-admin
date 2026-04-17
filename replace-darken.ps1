# Script to replace darken() with color.adjust() in Vue files

$files = Get-ChildItem -Path "." -Filter "*.vue" -Recurse | Where-Object { 
    $content = Get-Content $_.FullName -Encoding UTF8
    $content -match "darken\("
}

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)"
    
    $content = Get-Content $file.FullName -Encoding UTF8
    $modified = $false
    
    # Check if sass:color import exists
    $hasColorImport = $content -match "@use 'sass:color';"
    
    # Replace darken() patterns
    $newContent = $content -replace "darken\(\`$([regex]::Escape('$'))(\w+(?:-\w+)*), (\d+)%\)", 'color.adjust($$$1, $$lightness: -$2%)'
    
    if ($content -ne $newContent) {
        $modified = $true
    }
    
    # Add sass:color import if needed and file was modified
    if ($modified -and -not $hasColorImport) {
        for ($i = 0; $i -lt $newContent.Count; $i++) {
            if ($newContent[$i] -match "^<style.*lang=`"scss`"") {
                # Find the first @use statement
                for ($j = $i + 1; $j -lt $newContent.Count; $j++) {
                    if ($newContent[$j] -match "^@use ") {
                        # Insert before first @use
                        $newContent = $newContent[0..$i] + "@use 'sass:color';" + $newContent[($j)..$newContent.Count]
                        break
                    }
                }
                break
            }
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "  Updated: $($file.Name)"
    }
}

Write-Host "Done!"
