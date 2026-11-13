param(
    [string]$Root = "C:\Users\pc\Bibliotime",
    [int]$Port = 8080
)

Add-Type -AssemblyName System.Net.HttpListener -ErrorAction SilentlyContinue

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Sirviendo $Root en http://localhost:$Port/ (Ctrl+C para parar)"

$mimeMap = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".txt"  = "text/plain; charset=utf-8"
    ".xml"  = "application/xml; charset=utf-8"
    ".webmanifest" = "application/manifest+json"
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    try {
    $localPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
    # Las páginas de /bibliotecas/… y /estudiar/… son carpetas con su index.html dentro
    if ($localPath.EndsWith("/")) { $localPath = $localPath + "index.html" }
    $filePath = Join-Path $Root ($localPath.TrimStart("/"))
    if (Test-Path $filePath -PathType Container) { $filePath = Join-Path $filePath "index.html" }

    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = $mimeMap[$ext]
        if (-not $contentType) { $contentType = "application/octet-stream" }
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentType = $contentType
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $response.OutputStream.Close()
    } catch {
        # Si el navegador corta una descarga, se sigue sirviendo en vez de parar el servidor
        try { $response.Abort() } catch {}
    }
}
