$ErrorActionPreference = "Stop"
$ProgressPreference = 'SilentlyContinue'

$workspace = $PWD.Path
$pgsqlDir = "C:\Users\KenneyLin\pgsql"
$dataDir = "$pgsqlDir\data"
$zipPath = "C:\Users\KenneyLin\pgsql.zip"
$url = "https://get.enterprisedb.com/postgresql/postgresql-16.3-1-windows-x64-binaries.zip"

if (-not (Test-Path "$pgsqlDir\bin\pg_ctl.exe")) {
    Write-Host "Downloading PostgreSQL Portable (300MB) to $zipPath..."
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
    Write-Host "Extracting to C:\Users\KenneyLin..."
    Expand-Archive -Path $zipPath -DestinationPath "C:\Users\KenneyLin" -Force
    Remove-Item $zipPath
} else {
    Write-Host "PostgreSQL already exists at $pgsqlDir."
}

if (-not (Test-Path $dataDir)) {
    Write-Host "Initializing Database..."
    Set-Content -Path "C:\Users\KenneyLin\pw.txt" -Value "test"
    & "$pgsqlDir\bin\initdb.exe" -D $dataDir -U temple_user --pwfile="C:\Users\KenneyLin\pw.txt" -E UTF8 --locale=C
    Remove-Item "C:\Users\KenneyLin\pw.txt"
}

Write-Host "Starting PostgreSQL Server..."
& "$pgsqlDir\bin\pg_ctl.exe" -D $dataDir -l "$pgsqlDir\logfile.log" start

Start-Sleep -Seconds 3

Write-Host "Creating temple_db..."
$env:PGPASSWORD="test"
& "$pgsqlDir\bin\createdb.exe" -h 127.0.0.1 -p 5432 -U temple_user temple_db

Write-Host "Syncing Prisma schema..."
Set-Location $workspace
& npx prisma generate
& npx prisma migrate deploy

Write-Host "Setup complete!"
