$port = 8080
$path = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

$dataPath = Join-Path $path "data"
if (-not (Test-Path $dataPath)) { 
    New-Item -ItemType Directory -Path $dataPath -Force | Out-Null 
}
$dataFile = Join-Path $dataPath "inspections.json"
if (-not (Test-Path $dataFile)) { 
    "[]" | Set-Content -Path $dataFile -Encoding UTF8 
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
    Write-Host "Container Inspection App Server is running on port $port with Central Database API"
} catch {
    Write-Host "Failed to start listener: $_"
    exit 1
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # CORS headers so mobile, tunnel, and local can all communicate
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS, HEAD")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $rawPath = $request.Url.LocalPath.TrimStart('/')

        # --- CENTRAL DATABASE API: /api/inspections ---
        if ($rawPath -eq "api/inspections") {
            if ($request.HttpMethod -eq "GET" -or $request.HttpMethod -eq "HEAD") {
                $jsonContent = [System.IO.File]::ReadAllText($dataFile, [System.Text.Encoding]::UTF8)
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonContent)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
                $response.Close()
                continue
            }
            elseif ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                
                try {
                    $newRecord = $body | ConvertFrom-Json
                    $existingJson = [System.IO.File]::ReadAllText($dataFile, [System.Text.Encoding]::UTF8)
                    $rawParsed = $existingJson | ConvertFrom-Json
                    $records = [System.Collections.ArrayList]@()
                    if ($rawParsed) {
                        if ($rawParsed -is [System.Collections.IEnumerable] -and -not ($rawParsed -is [string])) {
                            foreach ($item in $rawParsed) {
                                if ($item -and $item.id) {
                                    $records.Add($item) | Out-Null
                                }
                            }
                        } elseif ($rawParsed.id) {
                            $records.Add($rawParsed) | Out-Null
                        }
                    }
                    
                    # Check if record already exists (update or insert)
                    $foundIndex = -1
                    for ($i = 0; $i -lt $records.Count; $i++) {
                        if ($records[$i].id -eq $newRecord.id) {
                            $foundIndex = $i
                            break
                        }
                    }

                    if ($foundIndex -ge 0) {
                        $records[$foundIndex] = $newRecord
                    } else {
                        $records.Insert(0, $newRecord)
                    }

                    if ($records.Count -eq 0) {
                        $updatedJson = "[]"
                    } else {
                        $j = $records | ConvertTo-Json -Depth 10
                        if ($j.Trim().StartsWith("[")) {
                            $updatedJson = $j
                        } else {
                            $updatedJson = "[`r`n" + $j + "`r`n]"
                        }
                    }
                    [System.IO.File]::WriteAllText($dataFile, $updatedJson, [System.Text.Encoding]::UTF8)

                    $resMsg = '{"success":true,"id":"' + $newRecord.id + '"}'
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($resMsg)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.ContentLength64 = $bytes.Length
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } catch {
                    $response.StatusCode = 500
                    $errBytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"' + $_.Exception.Message + '"}')
                    $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                }

                $response.Close()
                continue
            }
            elseif ($request.HttpMethod -eq "DELETE") {
                $idToDelete = $request.QueryString["id"]
                if ($idToDelete) {
                    $existingJson = [System.IO.File]::ReadAllText($dataFile, [System.Text.Encoding]::UTF8)
                    $rawParsed = $existingJson | ConvertFrom-Json
                    $records = [System.Collections.ArrayList]@()
                    if ($rawParsed) {
                        if ($rawParsed -is [System.Collections.IEnumerable] -and -not ($rawParsed -is [string])) {
                            foreach ($item in $rawParsed) {
                                if ($item -and $item.id -and $item.id -ne $idToDelete) {
                                    $records.Add($item) | Out-Null
                                }
                            }
                        } elseif ($rawParsed.id -and $rawParsed.id -ne $idToDelete) {
                            $records.Add($rawParsed) | Out-Null
                        }
                    }

                    if ($records.Count -eq 0) {
                        $updatedJson = "[]"
                    } else {
                        $j = $records | ConvertTo-Json -Depth 10
                        if ($j.Trim().StartsWith("[")) {
                            $updatedJson = $j
                        } else {
                            $updatedJson = "[`r`n" + $j + "`r`n]"
                        }
                    }
                    [System.IO.File]::WriteAllText($dataFile, $updatedJson, [System.Text.Encoding]::UTF8)
                }

                $resMsg = '{"success":true}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($resMsg)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }
        }

        # --- STATIC FILES HANDLER ---
        if ([string]::IsNullOrEmpty($rawPath) -or $rawPath -eq '/') {
            $rawPath = "index.html"
        }

        $filePath = Join-Path $path $rawPath
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            switch ($ext) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                ".json" { $response.ContentType = "application/json; charset=utf-8" }
                ".svg"  { $response.ContentType = "image/svg+xml" }
                default { $response.ContentType = "application/octet-stream" }
            }
            $response.ContentLength64 = $bytes.Length
            if ($request.HttpMethod -ne "HEAD") {
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("File not found: $rawPath")
            $response.ContentLength64 = $errBytes.Length
            if ($request.HttpMethod -ne "HEAD") {
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
        }
        $response.Close()
    } catch {
        Write-Host "Request handling error: $_"
    }
}
