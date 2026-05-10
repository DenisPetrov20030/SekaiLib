param(
    [string]$BackupPath = "C:\backups",
    [string]$ContainerName = "sekailib-db",
    [string]$Username = "user",
    [string]$Password = "password",
    [string]$Database = "sekailib_db",
    [string]$Format = "custom"  # 'custom' або 'sql' для різних форматів
)

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$extension = if ($Format -eq "custom") { "dump" } else { "sql" }
$backupFileName = "${Database}_backup_${timestamp}.${extension}"

$containerPath = "/var/lib/postgresql/backups/$backupFileName"
$localFilePath = Join-Path $BackupPath $backupFileName

Write-Host "================================"
Write-Host "Starting PostgreSQL database backup..."
Write-Host "================================"

if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    Write-Host "Created folder: $BackupPath"
}

Write-Host "Creating backup directory in container..."
docker exec $ContainerName mkdir -p /var/lib/postgresql/backups | Out-Null

Write-Host ""
Write-Host "Executing BACKUP with pg_dump..."

try {
    # Встановлюємо пароль через змінну оточення для безпеки
    $backupCmd = if ($Format -eq "custom") {
        "pg_dump -h localhost -U $Username -d $Database --format=custom --file=$containerPath"
    } else {
        "pg_dump -h localhost -U $Username -d $Database --format=plain > $containerPath"
    }

    $result = docker exec -e PGPASSWORD=$Password $ContainerName bash -c $backupCmd 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ BACKUP ERROR:"
        Write-Host $result
        exit 1
    }

    Write-Host "✔️ Backup completed in container"
    Write-Host ""
    Write-Host "Copying backup to Windows..."

    docker cp "${ContainerName}:${containerPath}" "$localFilePath"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ COPY ERROR"
        exit 1
    }
    
    Write-Host "✔️ File copied successfully"
    
    # Отримуємо розмір файлу
    if (Test-Path $localFilePath) {
        $fileSize = (Get-Item $localFilePath).Length / 1MB
        Write-Host "File size: $([math]::Round($fileSize, 2)) MB"
    }
    
    Write-Host ""
    Write-Host "================================"
    Write-Host "✔️ BACKUP SUCCESSFUL"
    Write-Host "Database: $Database"
    Write-Host "Format: $Format"
    Write-Host "File: $localFilePath"
    Write-Host "Time: $(Get-Date -Format 'dd.MM.yyyy HH:mm:ss')"
    Write-Host "================================"
}
catch {
    Write-Host "❌ EXCEPTION: $_"
    exit 1
}

Write-Host "Done!"
