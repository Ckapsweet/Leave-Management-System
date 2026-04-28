$filePath = Resolve-Path "src\page\admin\AdminDashboard.tsx"
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$text = [System.Text.Encoding]::GetEncoding(1252).GetString($bytes)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($filePath, $text, $utf8NoBom)
Write-Host "Re-encoded to UTF-8 successfully"
