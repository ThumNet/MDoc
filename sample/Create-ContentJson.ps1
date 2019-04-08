$currentDir = Get-Location
Get-ChildItem -Filter *.md -Recurse `
    | % { @{ Path = $_.FullName.SubString($currentDir.Path.Length+1).Replace("\", "/"); Contents = (Get-Content -Encoding UTF8 -Path $_.FullName | Out-String) } } `
    | ConvertTo-Json | Out-File content.json -Encoding UTF8

