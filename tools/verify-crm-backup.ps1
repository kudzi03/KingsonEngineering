param([Parameter(Mandatory=$true)][string]$Path)
$ErrorActionPreference='Stop'
$backupPassphrase=Read-Host 'Backup passphrase (hidden)' -AsSecureString
$backupPointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($backupPassphrase)
try {
  $env:KINGSON_BACKUP_PASSPHRASE=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($backupPointer)
  & node (Join-Path $PSScriptRoot 'verify-crm-backup.mjs') (Resolve-Path -LiteralPath $Path).Path
  if($LASTEXITCODE -ne 0) {throw 'Backup verification did not pass.'}
} finally {
  Remove-Item Env:KINGSON_BACKUP_PASSPHRASE -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($backupPointer)
  $backupPassphrase.Dispose()
}
