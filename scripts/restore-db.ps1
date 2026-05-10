param(
    [string]$BackupFilePath = $(Read-Host "Enter backup file path"),
    [string]$ContainerName = "sekailib-db",
    [string]$Username = "user",
    [string]$Password = "password",
    [string]$Database = "sekailib_db",
    [switch]$Force  # Коли встановлено, восстановлює без запиту на підтвердження
)

if (-not (Test-Path $BackupFilePath)) {
    Write-Host "❌ ERROR: Backup file not found: $BackupFilePath"
    exit 1
}

$backupFileName = Split-Path $BackupFilePath -Leaf
$containerPath = "/var/lib/postgresql/backups/$backupFileName"

Write-Host "================================"
Write-Host "PostgreSQL Database Restore"
Write-Host "================================"
Write-Host "Backup file: $BackupFilePath"
Write-Host "Container: $ContainerName"
Write-Host "Database: $Database"
Write-Host ""

if (-not $Force) {
    $confirmation = Read-Host "Are you sure you want to restore? (yes/no)"
    if ($confirmation -ne "yes") {
        Write-Host "Restore cancelled."
        exit 0
    }
}

try {
    Write-Host "Copying backup file to container..."
    docker cp "$BackupFilePath" "${ContainerName}:${containerPath}"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ COPY ERROR"
        exit 1
    }

    Write-Host "✔️ File copied to container"
    Write-Host ""
    Write-Host "Executing RESTORE..."

    # Визначаємо формат файлу за розширенням
    $extension = [System.IO.Path]::GetExtension($BackupFilePath).ToLower()
    
    if ($extension -eq ".dump" -or $extension -eq ".custom") {
        # Восстановлення з custom формату (набагато швидше)
        $restoreCmd = "pg_restore -h localhost -U $Username -d $Database --no-owner --no-privileges $containerPath"
    } else {
        # Восстановлення зі звичайного SQL формату
        $restoreCmd = "psql -h localhost -U $Username -d $Database < $containerPath"
    }

    $result = docker exec -e PGPASSWORD=$Password $ContainerName bash -c $restoreCmd 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ RESTORE ERROR:"
        Write-Host $result
        exit 1
    }

    Write-Host "✔️ Restore completed"
    Write-Host ""
    Write-Host "================================"
    Write-Host "✔️ RESTORE SUCCESSFUL"
    Write-Host "Database: $Database"
    Write-Host "Time: $(Get-Date -Format 'dd.MM.yyyy HH:mm:ss')"
    Write-Host "================================"
}
catch {
    Write-Host "❌ EXCEPTION: $_"
    exit 1
}

Write-Host "Done!"
