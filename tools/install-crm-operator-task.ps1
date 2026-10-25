param([string]$OperatorHome = (Join-Path $env:USERPROFILE '.kingson-crm-operator'))
$ErrorActionPreference = 'Stop'
$worker = Join-Path $OperatorHome 'crm-operator.mjs'
if (!(Test-Path -LiteralPath $worker) -or !(Test-Path -LiteralPath (Join-Path $OperatorHome 'config.json'))) { throw 'Install and verify the reviewed worker first.' }
$name = 'Kingson CRM scans and encrypted backups'
$user = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$launcher=Join-Path $OperatorHome 'CrmOperatorLauncher.exe'
if(!(Test-Path -LiteralPath $launcher)){throw 'Build and verify the reviewed Windows GUI launcher first.'}
$action = New-ScheduledTaskAction -Execute $launcher
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(15) -RepetitionInterval (New-TimeSpan -Minutes 15)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 20) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $name -Description 'Checks private CRM files every 15 minutes and makes an encrypted, restore-verified OneDrive backup daily while the owner is signed in. No messages, DNS changes or paid services.' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Select-Object TaskName,State
