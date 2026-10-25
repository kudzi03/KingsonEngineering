param([string]$OperatorHome = (Join-Path $env:USERPROFILE '.kingson-crm-operator'))
$ErrorActionPreference = 'Stop'
$secure = Read-Host 'Choose a unique recovery passphrase (20+ characters). Keep it outside this PC and OneDrive' -AsSecureString
$confirm = Read-Host 'Enter that recovery passphrase again' -AsSecureString
$first = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$second = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirm)
try {
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($first)
  if ($password.Length -lt 20) { throw 'Use at least 20 characters.' }
  if ($password -cne [Runtime.InteropServices.Marshal]::PtrToStringBSTR($second)) { throw 'Passphrases did not match.' }
  $env:KINGSON_RECOVERY_PASSPHRASE = $password
  $env:KINGSON_OPS_HOME = $OperatorHome
  & 'C:\Program Files\nodejs\node.exe' (Join-Path $OperatorHome 'crm-operator.mjs') --export-recovery
  if ($LASTEXITCODE -eq 75) { throw 'A scan or backup is running. Wait for it to finish, then run this recovery command again.' }
  if ($LASTEXITCODE -ne 0) { throw 'Recovery export failed. No verified recovery copy was confirmed.' }
  Write-Host 'Keep the passphrase independently in your password manager or another safe place. Do not paste it into chat.'
} finally {
  Remove-Item Env:KINGSON_RECOVERY_PASSPHRASE -ErrorAction SilentlyContinue
  $password = $null
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($first)
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($second)
  $secure.Dispose(); $confirm.Dispose()
}
