#requires -Version 5.1
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '..\tools\windows\Ecos-Actualizar.ps1')
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$script:Tests = 0
function Assert-Ecos($Condition, [string]$Message) { if (-not $Condition) { throw $Message } }
function Test-EcosCase([string]$Name, [scriptblock]$Body) {
    & $Body; $script:Tests++; Write-Host "OK $Name"
}
$script:Fixtures = Join-Path ([IO.Path]::GetTempPath()) ('ecos-test-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $script:Fixtures | Out-Null
$script:ActualBackup = (Get-Command Backup-EcosWorldData).ScriptBlock
function Backup-EcosWorldData([string]$DataRoot, [string]$Backup) {
    & $script:ActualBackup $DataRoot $Backup
    if ($script:FailSwap) {
        Get-ChildItem -LiteralPath (Join-Path $DataRoot 'Backups\Ecos-Frontera') -Directory -Filter '.trabajo-*' | ForEach-Object {
            Remove-Item -LiteralPath (Join-Path $_.FullName 'modulo') -Recurse -Force
        }
    }
}
function Test-EcosFoundryRunning { $script:ProcessChecks++; return $script:Running -or ($script:OpenAfterDownload -and $script:ProcessChecks -gt 1) }
function Get-EcosRelease($Config) { $script:ApiCalls++; return $script:ReleaseFixture }
function Save-EcosRelease($Config, $Info, [string]$Directory) { $script:Downloads++; return $script:ZipFixture }
function New-EcosFixture([string]$ModuleId = 'ecos-frontera') {
    $dir = Join-Path $script:Fixtures ([guid]::NewGuid().ToString('N'))
    $data = Join-Path $dir 'usuario'; $state = Join-Path $dir 'estado'
    New-Item -ItemType Directory -Path (Join-Path $data 'Data\modules\ecos-frontera\scripts') -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $data 'Data\worlds\campana\data') -Force | Out-Null
    New-Item -ItemType Directory -Path $state -Force | Out-Null
    '{"id":"ecos-frontera","version":"2.9.1"}' | Set-Content -LiteralPath (Join-Path $data 'Data\modules\ecos-frontera\module.json') -Encoding UTF8
    'anterior' | Set-Content -LiteralPath (Join-Path $data 'Data\modules\ecos-frontera\scripts\main.js') -Encoding UTF8
    'actor-42' | Set-Content -LiteralPath (Join-Path $data 'Data\worlds\campana\data\actors.db') -Encoding UTF8
    '{"id":"campana"}' | Set-Content -LiteralPath (Join-Path $data 'Data\worlds\campana\world.json') -Encoding UTF8
    $payload = Join-Path $dir 'payload'; New-Item -ItemType Directory -Path (Join-Path $payload 'ecos-frontera\scripts') -Force | Out-Null
    @{ id = $ModuleId; version = '2.9.2'; esmodules = @('scripts/main.js'); styles = @(); relationships = @{ systems = @() } } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $payload 'ecos-frontera\module.json') -Encoding UTF8
    'nuevo' | Set-Content -LiteralPath (Join-Path $payload 'ecos-frontera\scripts\main.js') -Encoding UTF8
    $script:ZipFixture = Join-Path $dir 'paquete.zip'
    $archive = [IO.Compression.ZipFile]::Open($script:ZipFixture, [IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($file in Get-ChildItem -LiteralPath $payload -Recurse -File) {
            $relative = $file.FullName.Substring($payload.Length + 1).Replace([char]92, [char]47)
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $relative) | Out-Null
        }
    } finally { $archive.Dispose() }
    $hash = (Get-FileHash -LiteralPath $script:ZipFixture -Algorithm SHA256).Hash.ToLowerInvariant()
    $script:ReleaseFixture = [pscustomobject]@{ tag_name = 'v2.9.2'; draft = $false; prerelease = $false; body = "SHA-256 del ZIP: $hash";
        assets = @([pscustomobject]@{ name = 'ecos-frontera-2.9.2.zip'; digest = "sha256:$hash" }) }
    $script:Running = $false; $script:OpenAfterDownload = $false; $script:FailSwap = $false
    $script:Downloads = 0; $script:ApiCalls = 0; $script:ProcessChecks = 0
    return [pscustomobject]@{ Data = $data; State = $state; Config = [pscustomobject]@{ UserDataPath = $data; GhPath = 'simulado' } }
}
function Assert-EcosOld($Fixture) {
    $file = Join-Path $Fixture.Data 'Data\modules\ecos-frontera\scripts\main.js'
    Assert-Ecos ((Get-Content -LiteralPath $file -Raw).Trim() -eq 'anterior') 'La version anterior se modifico por error.'
}
try {
    Test-EcosCase 'Foundry abierto pospone sin consultar ni descargar' {
        $f = New-EcosFixture; $script:Running = $true
        Assert-Ecos ((Invoke-EcosUpdate $f.Config $f.State) -eq 'Pospuesto') 'Debia posponer.'
        Assert-Ecos ($script:ApiCalls -eq 0 -and $script:Downloads -eq 0) 'No debia consultar GitHub.'; Assert-EcosOld $f
    }
    Test-EcosCase 'SHA incorrecto conserva el modulo instalado' {
        $f = New-EcosFixture; $script:ReleaseFixture.assets[0].digest = 'sha256:' + ('0' * 64)
        $failed = $false; try { Invoke-EcosUpdate $f.Config $f.State } catch { $failed = $true }
        Assert-Ecos $failed 'Debia rechazar el SHA.'; Assert-EcosOld $f
    }
    Test-EcosCase 'Reapertura de Foundry durante descarga pospone' {
        $f = New-EcosFixture; $script:OpenAfterDownload = $true
        Assert-Ecos ((Invoke-EcosUpdate $f.Config $f.State) -eq 'Pospuesto') 'Debia posponer al reabrirse.'; Assert-EcosOld $f
    }
    Test-EcosCase 'Instalacion guarda modulo anterior y bases de mundos' {
        $f = New-EcosFixture
        Assert-Ecos ((Invoke-EcosUpdate $f.Config $f.State) -eq 'Actualizado') 'No actualizo.'
        $m = Get-Content -LiteralPath (Join-Path $f.Data 'Data\modules\ecos-frontera\module.json') -Raw | ConvertFrom-Json
        Assert-Ecos ($m.version -eq '2.9.2') 'Version incorrecta.'
        $b = @(Get-ChildItem -LiteralPath (Join-Path $f.Data 'Backups\Ecos-Frontera') -Directory)
        Assert-Ecos ($b.Count -eq 1) 'Falta respaldo o quedo una carpeta temporal.'
        Assert-Ecos ((Get-Content -LiteralPath (Join-Path $b[0].FullName 'modulo-anterior\scripts\main.js') -Raw).Trim() -eq 'anterior') 'Falta el modulo anterior.'
        Assert-Ecos ((Get-Content -LiteralPath (Join-Path $b[0].FullName 'worlds\campana\data\actors.db') -Raw).Trim() -eq 'actor-42') 'Falta respaldo de actores.'
        Assert-Ecos ((Get-Content -LiteralPath (Join-Path $f.Data 'Data\worlds\campana\data\actors.db') -Raw).Trim() -eq 'actor-42') 'Cambio el mundo.'
    }
    Test-EcosCase 'No vuelve a descargar ni baja de version' {
        $f = New-EcosFixture
        '{"id":"ecos-frontera","version":"3.0.0"}' | Set-Content -LiteralPath (Join-Path $f.Data 'Data\modules\ecos-frontera\module.json') -Encoding UTF8
        Assert-Ecos ((Invoke-EcosUpdate $f.Config $f.State) -eq 'SinCambios') 'No debe bajar de version.'
        Assert-Ecos ($script:Downloads -eq 0) 'Descarga innecesaria.'
    }
    Test-EcosCase 'Identificador ajeno no sustituye el modulo' {
        $f = New-EcosFixture 'otro-modulo'; $failed = $false
        try { Invoke-EcosUpdate $f.Config $f.State } catch { $failed = $true }
        Assert-Ecos $failed 'No rechazo un modulo distinto.'; Assert-EcosOld $f
    }
    Test-EcosCase 'Fallo al intercambiar carpetas restaura la anterior' {
        $f = New-EcosFixture; $script:FailSwap = $true; $failed = $false
        try { Invoke-EcosUpdate $f.Config $f.State } catch { $failed = $true }
        Assert-Ecos $failed 'Debia fallar el intercambio.'; Assert-EcosOld $f
    }
    Test-EcosCase 'Rutas ZIP peligrosas o duplicadas se rechazan' {
        foreach ($bad in @('ecos-frontera/../../escape.txt', 'ecos-frontera/..\escape.txt', 'otro/modulo.txt', 'ecos-frontera/C:/escape.txt', 'ecos-frontera/SCRIPTS/main.js')) {
            $f = New-EcosFixture; $archive = [IO.Compression.ZipFile]::Open($script:ZipFixture, [IO.Compression.ZipArchiveMode]::Update)
            try { $entry = $archive.CreateEntry($bad); $writer = [IO.StreamWriter]::new($entry.Open()); $writer.Write('x'); $writer.Dispose() } finally { $archive.Dispose() }
            $failed = $false; try { Expand-EcosPackage $script:ZipFixture (Join-Path $f.State 'extraccion') } catch { $failed = $true }
            Assert-Ecos $failed "Se acepto la ruta $bad"; Assert-EcosOld $f
        }
    }
    Test-EcosCase 'Tarea usa usuario actual, repeticion y privilegios limitados' {
        $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
        $xml = [xml](New-EcosTaskXml 'C:\Trabajo & datos\Ecos-Silencioso.js' $sid 'C:\Windows\System32\wscript.exe')
        Assert-Ecos ($xml.Task.Triggers.CalendarTrigger.Repetition.Interval -eq 'PT5M') 'Intervalo incorrecto.'
        Assert-Ecos ($xml.Task.Principals.Principal.LogonType -eq 'InteractiveToken') 'No debe guardar contrasenas.'
        Assert-Ecos ($xml.Task.Principals.Principal.RunLevel -eq 'LeastPrivilege') 'No debe ejecutarse con privilegios elevados.'
        Assert-Ecos ($xml.Task.Actions.Exec.Arguments.Contains('C:\Trabajo & datos\Ecos-Silencioso.js')) 'La ruta no se conservo.'
        Assert-Ecos ($xml.Task.Actions.Exec.Command.EndsWith('wscript.exe')) 'No debe crear una consola de PowerShell.'
        Assert-Ecos ($xml.Task.Actions.Exec.Arguments.StartsWith('//B //Nologo')) 'Debe evitar cuadros de dialogo.'
        $service = New-Object -ComObject Schedule.Service; $service.Connect()
        $definition = $service.NewTask(0); $definition.XmlText = $xml.OuterXml
    }
    Test-EcosCase 'SHA de notas cubre metadatos antiguos sin digest' {
        $f = New-EcosFixture; $script:ReleaseFixture.assets[0].PSObject.Properties.Remove('digest')
        $info = Get-EcosReleaseInfo $script:ReleaseFixture
        Assert-Ecos ($info.Hash -eq (Get-FileHash -LiteralPath $script:ZipFixture -Algorithm SHA256).Hash.ToLowerInvariant()) 'No se interpreto el SHA.'
    }
    Test-EcosCase 'BAT activa, pausa y consulta sin borrar ni interrumpir una instalacion' {
        $bat = Get-Content -LiteralPath (Join-Path $PSScriptRoot '..\tools\windows\Ecos-Autoactualizacion.bat') -Raw
        $mark = '# ECOS_' + 'POWERSHELL'
        $env:ECOS_AUTO_TEST = '1'
        . ([scriptblock]::Create($bat.Substring($bat.IndexOf($mark) + $mark.Length)))
        Remove-Item Env:ECOS_AUTO_TEST
        $root = Join-Path $script:Fixtures 'Control & datos con espacios'
        New-Item -ItemType Directory -Path $root | Out-Null
        'param([switch]$Check,[string]$StateRoot) [IO.File]::WriteAllText((Join-Path $StateRoot "prueba.txt"), "ok")' | Set-Content -LiteralPath (Join-Path $root 'Ecos-Actualizar.ps1') -Encoding UTF8
        $real = New-Object -ComObject Schedule.Service; $real.Connect()
        $script:FakeTask = [pscustomobject]@{ Enabled = $true; Definition = $real.NewTask(0); Runs = 0 }
        $script:FakeTask.Definition.Principal.UserId = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
        $script:FakeTask.Definition.Principal.LogonType = 3
        $script:FakeTask | Add-Member ScriptMethod Run { param($Arg) $this.Runs++ }
        $folder = [pscustomobject]@{ Registered = 0 }
        $folder | Add-Member ScriptMethod GetTask { param($Name) return $script:FakeTask }
        $folder | Add-Member ScriptMethod RegisterTaskDefinition { param($Name,$Def,$Flags,$User,$Password,$Logon) $this.Registered++; $script:FakeTask.Definition = $Def; $script:FakeTask.Enabled = $Def.Settings.Enabled; return $script:FakeTask }
        $service = [pscustomobject]@{ Folder = $folder; Real = $real }
        $service | Add-Member ScriptMethod GetFolder { param($Name) return $this.Folder }
        $service | Add-Member ScriptMethod NewTask { param($Flags) return $this.Real.NewTask($Flags) }
        Set-EcosTaskState $service 'prueba' $root 'detener'
        Assert-Ecos (-not $script:FakeTask.Enabled -and $script:FakeTask.Runs -eq 0) 'Pausar no debe iniciar ni matar tareas.'
        Set-EcosTaskState $service 'prueba' $root 'estado'
        Assert-Ecos ($folder.Registered -eq 0) 'Consultar no debe modificar la tarea.'
        Set-EcosTaskState $service 'prueba' $root 'activar'
        Assert-Ecos ($script:FakeTask.Enabled -and $script:FakeTask.Runs -eq 1 -and $folder.Registered -eq 1) 'No activo la tarea.'
        Assert-Ecos ($script:FakeTask.Definition.Actions.Item(1).Path.EndsWith('wscript.exe')) 'El BAT debe corregir la tarea antigua para no abrir ventanas.'
        $launcher = Join-Path $root 'Ecos-Silencioso.js'
        $process = Start-Process -FilePath (Join-Path $env:SystemRoot 'System32\wscript.exe') -ArgumentList @('//B','//Nologo',('"{0}"' -f $launcher)) -PassThru
        Assert-Ecos ($process.WaitForExit(15000)) 'El lanzador no termino.'
        Assert-Ecos ($process.ExitCode -eq 0 -and (Test-Path -LiteralPath (Join-Path $root 'prueba.txt'))) 'El lanzador no ejecuto el PS1 con una ruta con espacios.'
        $service.Folder | Add-Member ScriptMethod GetTask { param($Name) throw 'No existe' } -Force
        Set-EcosTaskState $service 'prueba' $root 'activar'
        Assert-Ecos ($script:FakeTask.Definition.Triggers.Count -eq 2) 'Debe recrear la tarea eliminada por -Remove.'
        Assert-Ecos ($script:FakeTask.Definition.Triggers.Item(1).Repetition.Interval -eq 'PT5M') 'Debe comprobar cada cinco minutos.'
    }
    Write-Host "$script:Tests pruebas del actualizador aprobadas. No se usaron credenciales ni tareas reales."
} finally { Remove-Item -LiteralPath $script:Fixtures -Recurse -Force }
