param([Parameter(Mandatory=$true)][string]$Archive,
  [string]$RecoveryKey = (Join-Path $env:OneDrive 'Kingson Engineering CRM Backups\kingson-recovery-key.encrypted.json'))
$ErrorActionPreference='Stop'
$secret=Read-Host 'Backup recovery passphrase' -AsSecureString
$ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
  $env:KINGSON_RECOVERY_PASSPHRASE=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  & 'C:\Program Files\nodejs\node.exe' (Join-Path $PSScriptRoot 'verify-crm-operator.mjs') $Archive $RecoveryKey
  if($LASTEXITCODE -ne 0){throw 'Recovery verification did not pass.'}
} finally {
  Remove-Item Env:KINGSON_RECOVERY_PASSPHRASE -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr);$secret.Dispose()
}
