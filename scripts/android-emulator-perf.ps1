# Android emulyatorunu suretlendirme komokcisi (TopdanBazar mobil)
#
# Istifade:
#   npm run emu:status   - diaqnoz (accel, AVD konfiqurasiyasi, GPU renderer, animasiyalar)
#   npm run emu:turbo    - isleyen emulyatoru suretlendir (animasiyalar saxlanir, fon prosesler temizlenir)
#   npm run emu:lowres   - eyni + 720x1600 / 320dpi (daha az piksel = daha yuksek FPS)
#   npm run emu:reset    - turbo deyisikliklerini geri qaytar
#   npm run emu:config   - AVD config.ini-ni optimallashdir (emulyator BAGLI olmalidir)
#   npm run emu:launch   - emulyatoru suretli flaglarla bashlat
[CmdletBinding()]
param(
  [ValidateSet('status', 'turbo', 'reset', 'config', 'launch')][string]$Mode = 'status',
  [string]$Avd = 'Medium_Phone',
  [switch]$LowRes,
  [switch]$DisableAnimations
)

$ErrorActionPreference = 'Stop'

$sdkRoot = if ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT }
           elseif ($env:ANDROID_HOME) { $env:ANDROID_HOME }
           else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$emulatorExe = Join-Path $sdkRoot 'emulator\emulator.exe'
$adbExe = Join-Path $sdkRoot 'platform-tools\adb.exe'
$configFile = Join-Path $env:USERPROFILE ('.android\avd\' + $Avd + '.avd\config.ini')

if (-not (Test-Path $emulatorExe)) { throw ('emulator.exe tapilmadi: ' + $emulatorExe) }
if (-not (Test-Path $adbExe)) { throw ('adb.exe tapilmadi: ' + $adbExe) }
if (-not (Test-Path $configFile)) { throw ('AVD konfiqurasiyasi tapilmadi: ' + $configFile) }

function Get-AdbText([string[]]$adbArgs) {
  $output = & $adbExe @adbArgs 2>$null
  return (($output | Out-String).Trim())
}
function Test-EmulatorRunning {
  return ((Get-AdbText @('devices')) -match 'emulator-\d+\s+device')
}
function Get-ConfigValue([string]$Path, [string]$Key) {
  $line = Select-String -Path $Path -Pattern ('^\s*' + [regex]::Escape($Key) + '\s*=') | Select-Object -First 1
  if ($line) { return (($line.Line -split '=', 2)[1]).Trim() }
  return '(yoxdur)'
}
function Set-ConfigValue([string]$Path, [string]$Key, [string]$Value) {
  $lines = [System.IO.File]::ReadAllLines($Path)
  $updated = $false
  for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match ('^\s*' + [regex]::Escape($Key) + '\s*=')) { $lines[$i] = $Key + '=' + $Value; $updated = $true }
  }
  if (-not $updated) { $lines += ($Key + '=' + $Value) }
  [System.IO.File]::WriteAllLines($Path, $lines, (New-Object System.Text.UTF8Encoding($false)))
}

Write-Host ('== TopdanBazar emulyator komokcisi | rejim: ' + $Mode + ' | AVD: ' + $Avd + ' ==') -ForegroundColor Cyan

switch ($Mode) {
  'status' {
    Write-Host '-- Hardware acceleration --'
    & $emulatorExe -accel-check
    Write-Host '-- AVD konfiqurasiyasi --'
    foreach ($key in @('hw.gpu.mode', 'hw.gpu.enabled', 'hw.ramSize', 'hw.cpu.ncore', 'hw.audioInput',
        'hw.camera.back', 'hw.camera.front', 'hw.keyboard', 'vm.heapSize', 'showDeviceFrame', 'image.sysdir.1')) {
      Write-Host ('   ' + $key.PadRight(18) + ' = ' + (Get-ConfigValue $configFile $key))
    }
    Write-Host '-- Cihazlar --'
    Write-Host ('   ' + (Get-AdbText @('devices', '-l')).Replace("`n", "`n   "))
    if (Test-EmulatorRunning) {
      Write-Host '-- Canli olcumler --'
      Write-Host ('   olcu / sixliq : ' + (Get-AdbText @('shell', 'wm', 'size')) + ' / ' + (Get-AdbText @('shell', 'wm', 'density')))
      Write-Host ('   animasiya     : window=' + (Get-AdbText @('shell', 'settings', 'get', 'global', 'window_animation_scale')) +
        ' transition=' + (Get-AdbText @('shell', 'settings', 'get', 'global', 'transition_animation_scale')) +
        ' animator=' + (Get-AdbText @('shell', 'settings', 'get', 'global', 'animator_duration_scale')))
      $gles = & $adbExe shell dumpsys SurfaceFlinger 2>$null | Select-String -Pattern '^GLES: ' | Select-Object -First 1
      Write-Host ('   renderer      : ' + $gles)
    }
  }
  'turbo' {
    if (-not (Test-EmulatorRunning)) { throw 'Isleyen emulyator yoxdur. Evvelce: npm run emu:launch' }
    $animationScale = if ($DisableAnimations) { 0 } else { 1.0 }
    & $adbExe shell settings put global window_animation_scale $animationScale | Out-Null
    & $adbExe shell settings put global transition_animation_scale $animationScale | Out-Null
    & $adbExe shell settings put global animator_duration_scale $animationScale | Out-Null
    & $adbExe shell am kill-all | Out-Null
    if ($LowRes) {
      & $adbExe shell wm size 720x1600 | Out-Null
      & $adbExe shell wm density 320 | Out-Null
      Write-Host 'Asagi olcu aktivdir: 720x1600 / 320dpi (geri: npm run emu:reset)' -ForegroundColor Yellow
    }
    Write-Host ('Animasiya seviyyəsi: '+ $animationScale + '. Fon prosesler temizlendi.') -ForegroundColor Green
  }
  'reset' {
    if (-not (Test-EmulatorRunning)) { throw 'Isleyen emulyator yoxdur.' }
    & $adbExe shell settings put global window_animation_scale 1.0 | Out-Null
    & $adbExe shell settings put global transition_animation_scale 1.0 | Out-Null
    & $adbExe shell settings put global animator_duration_scale 1.0 | Out-Null
    & $adbExe shell wm size reset | Out-Null
    & $adbExe shell wm density reset | Out-Null
    Write-Host 'Animasiyalar ve ekran olcusu ilkin veziyyete qaytarildi.' -ForegroundColor Green
  }
  'config' {
    if (Test-EmulatorRunning) { throw 'Emulyator isleyir. Konfiqurasiyani deyishmek ucun evvelce onu baglayin.' }
    $backup = $configFile + '.bak'
    if (-not (Test-Path $backup)) { Copy-Item $configFile $backup }
    Set-ConfigValue $configFile 'hw.gpu.mode' 'host'
    Set-ConfigValue $configFile 'hw.ramSize' '4096'
    Set-ConfigValue $configFile 'hw.cpu.ncore' '8'
    Set-ConfigValue $configFile 'hw.audioInput' 'no'
    Set-ConfigValue $configFile 'hw.camera.back' 'none'
    Set-ConfigValue $configFile 'hw.camera.front' 'none'
    Set-ConfigValue $configFile 'hw.keyboard' 'yes'
    Set-ConfigValue $configFile 'showDeviceFrame' 'no'
    Write-Host 'AVD konfiqurasiyasi yenilendi.' -ForegroundColor Green
    Write-Host ('Ehtiyat nusxe: ' + $backup)
  }
  'launch' {
    if (Test-EmulatorRunning) { throw 'Emulyator artiq isleyir.' }
    $emuArgs = @('-avd', $Avd, '-gpu', 'host', '-no-audio', '-no-boot-anim',
      '-netdelay', 'none', '-netspeed', 'full', '-no-metrics')
    Write-Host ('Bashladilir: emulator ' + ($emuArgs -join ' ')) -ForegroundColor Green
    Start-Process -FilePath $emulatorExe -ArgumentList $emuArgs
  }
}
