Get-ChildItem -Filter *.md -Recurse `
    | % { @{ Path = $_.FullName; Contents = (Get-Content -Encoding UTF8 -Path $_.FullName | Out-String) } } `
    | ConvertTo-Json | Out-File content.json -Encoding UTF8

