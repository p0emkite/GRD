$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
New-Item -ItemType Directory -Force build/classes | Out-Null
$sources = @(Get-ChildItem -Recurse src/main/java -Filter *.java | ForEach-Object { $_.FullName })
& javac -encoding UTF-8 --release 17 -d build/classes $sources
if ($LASTEXITCODE -ne 0) { throw "javac failed" }
Copy-Item src/main/resources/* build/classes/ -Recurse -Force
& jar --create --file build/GRD-Neon-Encore.jar --main-class grd.NativeClient -C build/classes .
if ($LASTEXITCODE -ne 0) { throw "jar failed" }
& java '-Djava.awt.headless=true' -jar build/GRD-Neon-Encore.jar --self-test
if ($LASTEXITCODE -ne 0) { throw "self-test failed" }
