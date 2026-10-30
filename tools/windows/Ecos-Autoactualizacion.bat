@echo off
setlocal
title Ecos de la Frontera - Actualizacion automatica
set "ECOS_AUTO_SELF=%~f0"
if /I "%~1"=="activar" goto activar
if /I "%~1"=="detener" goto detener
if /I "%~1"=="desactivar" goto detener
if /I "%~1"=="estado" goto estado
:menu
cls
echo ECOS DE LA FRONTERA
echo.
echo 1. Activar actualizaciones automaticas
echo 2. Detener actualizaciones automaticas
echo 3. Consultar estado
echo 4. Salir
echo.
choice /C 1234 /N /M "Elige una opcion: "
if errorlevel 4 exit /b 0
if errorlevel 3 goto estado
if errorlevel 2 goto detener
goto activar
:activar
set "ECOS_AUTO_ACTION=activar"
goto ejecutar
:detener
set "ECOS_AUTO_ACTION=detener"
goto ejecutar
:estado
set "ECOS_AUTO_ACTION=estado"
:ejecutar
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $s=[IO.File]::ReadAllText($env:ECOS_AUTO_SELF); $m='# ECOS_'+'POWERSHELL'; & ([scriptblock]::Create($s.Substring($s.IndexOf($m)+$m.Length)))"
set "ECOS_AUTO_RESULT=%errorlevel%"
if not "%~1"=="" exit /b %ECOS_AUTO_RESULT%
echo.
pause
goto menu
exit /b
# ECOS_POWERSHELL
function New-EcosSilentLauncher([string]$Root) {
    $script = Join-Path $Root 'Ecos-Actualizar.ps1'
    if (-not (Test-Path -LiteralPath $script -PathType Leaf)) { throw 'Falta el actualizador instalado. Ejecuta Ecos-Actualizar.ps1 -Install una vez.' }
    $ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    $command = '"{0}" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{1}" -Check -StateRoot "{2}"' -f $ps, $script, $Root
    $literal = ConvertTo-Json -InputObject $command -Compress
    $launcher = Join-Path $Root 'Ecos-Silencioso.js'
    $source = 'var shell = new ActiveXObject("WScript.Shell"); WScript.Quit(shell.Run(' + $literal + ', 0, true));'
    [IO.File]::WriteAllText($launcher, $source, [Text.Encoding]::Unicode)
    return $launcher
}
function Set-EcosTaskState($Service, [string]$TaskName, [string]$Root, [string]$Action) {
    $folder = $Service.GetFolder('\')
    $task = $null
    try { $task = $folder.GetTask($TaskName) } catch {
        if ($Action -ne 'activar') { Write-Host 'Actualizacion automatica: DETENIDA (sin tarea).'; return }
    }
    if ($Action -eq 'detener') {
        $task.Enabled = $false
        Write-Host 'Actualizacion automatica: DETENIDA.'
        Write-Host 'Una instalacion que ya haya comenzado terminara para proteger tus archivos.'
        return
    }
    if ($Action -eq 'estado') {
        if ($task.Enabled) { Write-Host 'Actualizacion automatica: ACTIVADA.' }
        else { Write-Host 'Actualizacion automatica: DETENIDA.' }
        return
    }
    if ($Action -ne 'activar') { throw 'Opcion desconocida.' }
    $launcher = New-EcosSilentLauncher $Root
    if ($task) { $definition = $task.Definition }
    else {
        # Permite reactivar incluso despues de usar el antiguo parametro -Remove.
        $definition = $Service.NewTask(0)
        $definition.RegistrationInfo.Description = 'Actualizacion privada de Ecos de la Frontera.'
        $definition.Principal.UserId = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
        $definition.Principal.LogonType = 3
        $definition.Principal.RunLevel = 0
        $trigger = $definition.Triggers.Create(2)
        $trigger.StartBoundary = (Get-Date).Date.ToString('yyyy-MM-ddTHH:mm:ss')
        $trigger.DaysInterval = 1
        $trigger.Repetition.Interval = 'PT5M'
        $trigger.Repetition.Duration = 'P1D'
        $logon = $definition.Triggers.Create(9)
        $logon.UserId = $definition.Principal.UserId
    }
    $definition.Settings.Enabled = $true
    $definition.Settings.MultipleInstances = 2
    $definition.Settings.DisallowStartIfOnBatteries = $false
    $definition.Settings.StopIfGoingOnBatteries = $false
    $definition.Settings.StartWhenAvailable = $true
    $definition.Settings.ExecutionTimeLimit = 'PT10M'
    $definition.Actions.Clear()
    $exec = $definition.Actions.Create(0)
    $exec.Path = Join-Path $env:SystemRoot 'System32\wscript.exe'
    $exec.Arguments = '//B //Nologo "{0}"' -f $launcher
    $registered = $folder.RegisterTaskDefinition($TaskName, $definition, 6, $definition.Principal.UserId, $null, 3)
    Write-Host 'Actualizacion automatica: ACTIVADA, en segundo plano sin ventanas.'
    Write-Host 'Comprueba cada 5 minutos y al iniciar sesion. Espera a que Foundry este cerrado.'
    # La primera comprobacion tambien se inicia por el lanzador sin consola.
    $registered.Run($null) | Out-Null
}
if ($env:ECOS_AUTO_TEST -ne '1') {
    try {
        $root = Join-Path $env:LOCALAPPDATA 'Ecos-Frontera-Actualizador'
        $file = Join-Path $root 'config.json'
        if (-not (Test-Path -LiteralPath $file)) { throw 'No hay configuracion. Ejecuta primero Ecos-Actualizar.ps1 -Install.' }
        $config = Get-Content -LiteralPath $file -Raw | ConvertFrom-Json
        $expected = 'Ecos-Frontera-Actualizador-' + [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
        if ($config.TaskName -ne $expected) { throw 'La configuracion no pertenece a la tarea de Ecos de este usuario.' }
        $service = New-Object -ComObject Schedule.Service
        $service.Connect()
        Set-EcosTaskState $service $expected $root $env:ECOS_AUTO_ACTION
    } catch { Write-Host ('No se completo: ' + $_.Exception.Message) -ForegroundColor Red; exit 1 }
}
