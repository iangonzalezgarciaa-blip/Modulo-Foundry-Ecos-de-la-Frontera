#requires -Version 5.1
<# Una configuracion inicial; consultas privadas a GitHub y actualizacion con Foundry cerrado. #>
[CmdletBinding()]
param([switch]$Install, [switch]$Check, [switch]$Remove, [string]$UserDataPath, [string]$StateRoot)
Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'
$script:EcosRepo = 'iangonzalezgarciaa-blip/Modulo-Foundry-Ecos-de-la-Frontera'
$script:EcosSource = $PSCommandPath
if (-not $StateRoot) { $StateRoot = Join-Path $env:LOCALAPPDATA 'Ecos-Frontera-Actualizador' }

function Get-EcosField($Object, [string]$Name, $Default = $null) {
    if ($null -ne $Object -and $Object.PSObject.Properties[$Name]) { return $Object.$Name }
    return $Default
}
function Write-EcosLog([string]$Message, [string]$Root) {
    if (-not (Test-Path -LiteralPath $Root)) { New-Item -ItemType Directory -Path $Root -Force | Out-Null }
    $log = Join-Path $Root 'actualizador.log'
    if ((Test-Path -LiteralPath $log) -and (Get-Item -LiteralPath $log).Length -gt 524288) {
        Move-Item -LiteralPath $log -Destination (Join-Path $Root 'actualizador-anterior.log') -Force
    }
    $line = ('{0:u} {1}' -f (Get-Date), $Message)
    Add-Content -LiteralPath $log -Value $line -Encoding UTF8
    Write-Host $line
}
function Find-EcosGh {
    $cmd = Get-Command gh -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    foreach ($p in @((Join-Path $env:ProgramFiles 'GitHub CLI\gh.exe'), (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links\gh.exe'))) {
        if (Test-Path -LiteralPath $p) { return $p }
    }
    return $null
}
function Invoke-EcosGh([string]$GhPath, [string[]]$Arguments) {
    $ErrorActionPreference = 'Continue'
    $result = & $GhPath @Arguments 2>$null
    $code = $LASTEXITCODE
    if ($code -ne 0) { throw 'GitHub no respondio o no autorizo el acceso. Revisa gh auth login y tu conexion.' }
    return ($result -join "`n")
}
function Get-EcosRelease($Config) {
    $json = Invoke-EcosGh $Config.GhPath @('api', '--hostname', 'github.com', "repos/$script:EcosRepo/releases/latest")
    return ($json | ConvertFrom-Json)
}
function Get-EcosReleaseInfo($Release) {
    if ($Release.draft -or $Release.prerelease -or $Release.tag_name -notmatch '^v(\d+\.\d+\.\d+)$') {
        throw 'El Release no es una version estable valida.'
    }
    $version = $Matches[1]
    $name = "ecos-frontera-$version.zip"
    $assets = @($Release.assets | Where-Object { $_.name -eq $name })
    if ($assets.Count -ne 1) { throw 'El Release no contiene un unico ZIP instalable.' }
    $digest = [string](Get-EcosField $assets[0] 'digest' '')
    if ($digest -notmatch '^sha256:([a-fA-F0-9]{64})$') {
        $body = [string](Get-EcosField $Release 'body' '')
        if ($body -notmatch 'SHA-256 del ZIP:\s*`?([a-fA-F0-9]{64})') { throw 'Falta el SHA-256 del ZIP. No se instala sin comprobarlo.' }
    }
    $hash = $Matches[1].ToLowerInvariant()
    return [pscustomobject]@{ Version = $version; Tag = $Release.tag_name; Name = $name; Hash = $hash }
}
function Save-EcosRelease($Config, $Info, [string]$Directory) {
    Invoke-EcosGh $Config.GhPath @('release', 'download', $Info.Tag, '--repo', "github.com/$script:EcosRepo", '--pattern', $Info.Name, '--dir', $Directory) | Out-Null
    return (Join-Path $Directory $Info.Name)
}
function Test-EcosFoundryRunning {
    if (@(Get-Process -ErrorAction Stop | Where-Object { $_.ProcessName -match '(?i)foundry' }).Count) { return $true }
    # Tambien cubre un servidor de Foundry lanzado con Node.
    $nodes = @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction Stop)
    foreach ($node in $nodes) {
        if ([string]$node.CommandLine -match '(?i)foundry|--dataPath') { return $true }
    }
    return $false
}
function Expand-EcosPackage([string]$Zip, [string]$Destination) {
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    $base = [IO.Path]::GetFullPath($Destination).TrimEnd([char[]]@([char]92, [char]47)) + [IO.Path]::DirectorySeparatorChar
    $archive = [IO.Compression.ZipFile]::OpenRead($Zip)
    try {
        $seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
        $entries = @(); [long]$total = 0
        foreach ($entry in $archive.Entries) {
            $name = $entry.FullName
            if (-not $name.StartsWith('ecos-frontera/', [StringComparison]::Ordinal) -or $name.Contains('\') -or $name.Contains(':') -or $name -match '(^|/)\.\.?(/|$)') {
                throw 'El ZIP contiene una ruta no permitida.'
            }
            if ((($entry.ExternalAttributes -shr 16) -band 61440) -eq 40960) { throw 'El ZIP contiene enlaces simbolicos.' }
            $relative = $name.Substring('ecos-frontera/'.Length)
            if (-not $relative) { continue }
            $target = [IO.Path]::GetFullPath((Join-Path $base $relative))
            if (-not $target.StartsWith($base, [StringComparison]::OrdinalIgnoreCase)) { throw 'Una ruta sale de la carpeta del modulo.' }
            if (-not $seen.Add($target)) { throw 'El ZIP contiene rutas duplicadas.' }
            $total += $entry.Length
            if ($total -gt 1073741824) { throw 'El ZIP supera el limite de extraccion de 1 GB.' }
            $entries += [pscustomobject]@{ Entry = $entry; Target = $target; Directory = $name.EndsWith('/') }
        }
        foreach ($item in $entries) {
            if ($item.Directory) { New-Item -ItemType Directory -Path $item.Target -Force | Out-Null; continue }
            New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($item.Target)) -Force | Out-Null
            [IO.Compression.ZipFileExtensions]::ExtractToFile($item.Entry, $item.Target, $false)
        }
    } finally { $archive.Dispose() }
}
function Test-EcosManifest([string]$Directory, [string]$Version, [string]$DataRoot) {
    $manifest = Get-Content -LiteralPath (Join-Path $Directory 'module.json') -Raw | ConvertFrom-Json
    if ($manifest.id -ne 'ecos-frontera' -or $manifest.version -ne $Version) { throw 'El identificador o la version del ZIP no coinciden.' }
    foreach ($file in @($manifest.esmodules) + @($manifest.styles)) {
        if ($file -match '(^|[/\\])\.\.([/\\]|$)' -or [IO.Path]::IsPathRooted($file) -or -not (Test-Path -LiteralPath (Join-Path $Directory $file) -PathType Leaf)) {
            throw 'Faltan archivos del manifiesto o sus rutas no son validas.'
        }
    }
    $systemFile = Join-Path $DataRoot 'Data\systems\dnd5e\system.json'
    if (Test-Path -LiteralPath $systemFile) {
        $system = Get-Content -LiteralPath $systemFile -Raw | ConvertFrom-Json
        $requirement = @($manifest.relationships.systems | Where-Object { $_.id -eq 'dnd5e' })
        if ($requirement.Count -and [version]$system.version -lt [version]$requirement[0].compatibility.minimum) { throw 'Actualiza dnd5e antes de instalar esta version del modulo.' }
    }
}
function Backup-EcosWorldData([string]$DataRoot, [string]$Backup) {
    $worlds = Join-Path $DataRoot 'Data\worlds'
    if (-not (Test-Path -LiteralPath $worlds)) { return }
    foreach ($world in Get-ChildItem -LiteralPath $worlds -Directory) {
        $out = Join-Path (Join-Path $Backup 'worlds') $world.Name
        New-Item -ItemType Directory -Path $out -Force | Out-Null
        foreach ($name in @('data', 'world.json')) {
            $source = Join-Path $world.FullName $name
            if (Test-Path -LiteralPath $source) { Copy-Item -LiteralPath $source -Destination (Join-Path $out $name) -Recurse -Force }
        }
    }
}
function Invoke-EcosUpdate($Config, [string]$Root) {
    if (Test-EcosFoundryRunning) { Write-EcosLog 'Pospuesto: Foundry esta abierto.' $Root; return 'Pospuesto' }
    $info = Get-EcosReleaseInfo (Get-EcosRelease $Config)
    $target = Join-Path $Config.UserDataPath 'Data\modules\ecos-frontera'
    $currentFile = Join-Path $target 'module.json'
    if (Test-Path -LiteralPath $target) {
        $current = Get-Content -LiteralPath $currentFile -Raw | ConvertFrom-Json
        if ($current.id -ne 'ecos-frontera') { throw 'La carpeta de destino pertenece a otro modulo.' }
        if ([version]$current.version -ge [version]$info.Version) { Write-EcosLog "Ya esta instalada la version $($current.version)." $Root; return 'SinCambios' }
    }
    $backups = Join-Path $Config.UserDataPath 'Backups\Ecos-Frontera'
    New-Item -ItemType Directory -Path $backups -Force | Out-Null
    $work = Join-Path $backups ('.trabajo-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $work | Out-Null
    try {
        $zip = Save-EcosRelease $Config $info $work
        if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $info.Hash) { throw 'El SHA-256 no coincide. Se conserva la version instalada.' }
        $stage = Join-Path $work 'modulo'
        Expand-EcosPackage $zip $stage
        Test-EcosManifest $stage $info.Version $Config.UserDataPath
        if (Test-EcosFoundryRunning) { Write-EcosLog 'Pospuesto: Foundry se abrio durante la descarga.' $Root; return 'Pospuesto' }
        $backup = Join-Path $backups ((Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
        New-Item -ItemType Directory -Path $backup | Out-Null
        Backup-EcosWorldData $Config.UserDataPath $backup
        if (Test-EcosFoundryRunning) { Write-EcosLog 'Pospuesto: Foundry se abrio durante el respaldo.' $Root; return 'Pospuesto' }
        $old = Join-Path $backup 'modulo-anterior'
        $moved = $false
        try {
            if (Test-Path -LiteralPath $target) { [IO.Directory]::Move($target, $old); $moved = $true }
            New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($target)) -Force | Out-Null
            [IO.Directory]::Move($stage, $target)
        } catch {
            if ($moved -and -not (Test-Path -LiteralPath $target)) { [IO.Directory]::Move($old, $target) }
            throw
        }
        Write-EcosLog "Instalada $($info.Version). Respaldo: $backup" $Root
        return 'Actualizado'
    } finally { if (Test-Path -LiteralPath $work) { Remove-Item -LiteralPath $work -Recurse -Force } }
}
function New-EcosTaskXml([string]$Script, [string]$UserId, [string]$PowerShell) {
    $exe = [Security.SecurityElement]::Escape($PowerShell)
    $argsXml = [Security.SecurityElement]::Escape(('-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}" -Check -StateRoot "{1}"' -f $Script, [IO.Path]::GetDirectoryName($Script)))
    $userXml = [Security.SecurityElement]::Escape($UserId)
    $start = (Get-Date).Date.ToString('yyyy-MM-ddTHH:mm:ss')
    return @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo><Description>Actualizacion privada de Ecos de la Frontera con Foundry cerrado.</Description></RegistrationInfo>
  <Triggers>
    <CalendarTrigger><Repetition><Interval>PT5M</Interval><Duration>P1D</Duration><StopAtDurationEnd>false</StopAtDurationEnd></Repetition><StartBoundary>$start</StartBoundary><Enabled>true</Enabled><ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay></CalendarTrigger>
    <LogonTrigger><Enabled>true</Enabled><UserId>$userXml</UserId></LogonTrigger>
  </Triggers>
  <Principals><Principal id="Autor"><UserId>$userXml</UserId><LogonType>InteractiveToken</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal></Principals>
  <Settings><MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy><DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries><StopIfGoingOnBatteries>false</StopIfGoingOnBatteries><StartWhenAvailable>true</StartWhenAvailable><ExecutionTimeLimit>PT10M</ExecutionTimeLimit></Settings>
  <Actions Context="Autor"><Exec><Command>$exe</Command><Arguments>$argsXml</Arguments></Exec></Actions>
</Task>
"@
}
function Install-EcosUpdater([string]$Root, [string]$DataPath) {
    $gh = Find-EcosGh
    if (-not $gh) {
        Write-Host 'Instalando GitHub CLI desde WinGet...'
        & winget install --id GitHub.cli --exact --source winget --accept-source-agreements --accept-package-agreements
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo instalar GitHub CLI.' }
        $gh = Find-EcosGh
        if (-not $gh) { throw 'Abre otra ventana de PowerShell y ejecuta de nuevo este instalador.' }
    }
    try { Invoke-EcosGh $gh @('auth', 'status', '--hostname', 'github.com') | Out-Null }
    catch {
        & $gh auth login --hostname github.com --git-protocol https --web --skip-ssh-key
        if ($LASTEXITCODE -ne 0) { throw 'El inicio de sesion en GitHub no termino.' }
    }
    if (-not $DataPath) {
        $defaultPath = Join-Path $env:LOCALAPPDATA 'FoundryVTT'
        $DataPath = Read-Host "Ruta de datos de usuario de Foundry (Enter para $defaultPath)"
        if (-not $DataPath) { $DataPath = $defaultPath }
    }
    $DataPath = [IO.Path]::GetFullPath([Environment]::ExpandEnvironmentVariables($DataPath.Trim('"')))
    if (-not (Test-Path -LiteralPath (Join-Path $DataPath 'Data'))) { throw 'Esa ruta no contiene Data. Indica la carpeta de datos de usuario, no la carpeta del programa.' }
    New-Item -ItemType Directory -Path $Root -Force | Out-Null
    $installed = Join-Path $Root 'Ecos-Actualizar.ps1'
    if ([IO.Path]::GetFullPath($script:EcosSource) -ne [IO.Path]::GetFullPath($installed)) { Copy-Item -LiteralPath $script:EcosSource -Destination $installed -Force }
    $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    $taskName = "Ecos-Frontera-Actualizador-$sid"
    $config = [pscustomobject]@{ UserDataPath = $DataPath; GhPath = $gh; TaskName = $taskName }
    # Comprueba el acceso privado antes de registrar la tarea.
    Get-EcosReleaseInfo (Get-EcosRelease $config) | Out-Null
    $config | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $Root 'config.json') -Encoding UTF8
    $ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    Register-ScheduledTask -TaskName $taskName -Xml (New-EcosTaskXml $installed $sid $ps) -Force | Out-Null
    Write-EcosLog 'Configurado: revisa Releases privados cada 5 minutos y al iniciar sesion. No necesita descargar ZIPs manualmente.' $Root
}
function Start-EcosCheck([string]$Root) {
    $lock = $null
    try {
        $lock = [IO.File]::Open((Join-Path $Root 'actualizador.lock'), [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
    } catch [IO.IOException] { return }
    try {
        $config = Get-Content -LiteralPath (Join-Path $Root 'config.json') -Raw | ConvertFrom-Json
        Invoke-EcosUpdate $config $Root | Out-Null
    } catch { Write-EcosLog ("No se actualizo: " + $_.Exception.Message) $Root }
    finally { $lock.Dispose() }
}
if ($MyInvocation.InvocationName -ne '.') {
    try {
        if ($Remove) {
            $config = Get-Content -LiteralPath (Join-Path $StateRoot 'config.json') -Raw | ConvertFrom-Json
            Unregister-ScheduledTask -TaskName $config.TaskName -Confirm:$false
            Write-EcosLog 'Actualizaciones automaticas desactivadas. Se conservan el modulo y los respaldos.' $StateRoot
        } elseif ($Check) { Start-EcosCheck $StateRoot }
        else { Install-EcosUpdater $StateRoot $UserDataPath; Start-EcosCheck $StateRoot }
    } catch { Write-Host ("No se completo: " + $_.Exception.Message) -ForegroundColor Red; exit 1 }
}
