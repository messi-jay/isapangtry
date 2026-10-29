# =============================================================================
# COE-Pay: Zero-Dependency Local HTTP Server (Windows PowerShell)
# Institution: ICCT Colleges Foundation, Inc. - College of Engineering
# =============================================================================

$Port = 8080
$Root = $PSScriptRoot

$MimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".ico"  = "image/x-icon"
    ".sql"  = "text/plain; charset=utf-8"
    ".txt"  = "text/plain; charset=utf-8"
    ".csv"  = "text/csv; charset=utf-8"
    ".xlsx" = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

$Listener = New-Object System.Net.HttpListener
$Url = "http://localhost:$Port/"
$Listener.Prefixes.Add($Url)

try {
    $Listener.Start()
} catch {
    Write-Host "[!] Port $Port in use, trying 8081..." -ForegroundColor Yellow
    $Port = 8081
    $Url = "http://localhost:$Port/"
    $Listener = New-Object System.Net.HttpListener
    $Listener.Prefixes.Add($Url)
    $Listener.Start()
}

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host " COE-Pay: Centralized Payment Authorization, Collection & Monitoring   " -ForegroundColor Green
Write-Host " ICCT Colleges Foundation, Inc. - College of Engineering & Digital Tech" -ForegroundColor White
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host " Server running at: $Url" -ForegroundColor Yellow
Write-Host " Press Ctrl+C in this console to stop the server.`n" -ForegroundColor Gray

# Open default browser
Start-Process $Url

while ($Listener.IsListening) {
    try {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        $RawPath = $Request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($RawPath)) {
            $RawPath = "index.html"
        }

        # Normalize path
        $SafePath = $RawPath -replace '/', '\'
        $FilePath = Join-Path $Root $SafePath

        # Security check: ensure file is within root
        $FullFilePath = [System.IO.Path]::GetFullPath($FilePath)
        $FullRoot = [System.IO.Path]::GetFullPath($Root)

        if ($FullFilePath.StartsWith($FullRoot) -and [System.IO.File]::Exists($FullFilePath)) {
            $Ext = [System.IO.Path]::GetExtension($FullFilePath).ToLower()
            $ContentType = $MimeTypes[$Ext]
            if (-not $ContentType) { $ContentType = "application/octet-stream" }

            $Response.ContentType = $ContentType
            $Response.Headers.Add("Access-Control-Allow-Origin", "*")

            $Bytes = [System.IO.File]::ReadAllBytes($FullFilePath)
            $Response.ContentLength64 = $Bytes.Length
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
            $Response.StatusCode = 200
        } else {
            $Response.StatusCode = 404
            $NotFoundHtml = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found: $RawPath</h1>")
            $Response.ContentType = "text/html; charset=utf-8"
            $Response.ContentLength64 = $NotFoundHtml.Length
            $Response.OutputStream.Write($NotFoundHtml, 0, $NotFoundHtml.Length)
        }
        $Response.OutputStream.Close()
    } catch {
        # Catch cancellation or client abort
    }
}
