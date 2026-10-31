#requires -Version 5.1
param([string]$StateRoot)
$ErrorActionPreference = 'Stop'
function Get-EcosInstalledVersion([string]$Root) {
    try {
        $config = Get-Content -LiteralPath (Join-Path $Root 'config.json') -Raw | ConvertFrom-Json
        $file = Join-Path $config.UserDataPath 'Data\modules\ecos-frontera\module.json'
        $manifest = Get-Content -LiteralPath $file -Raw | ConvertFrom-Json
        if ($manifest.id -ne 'ecos-frontera') { return $null }
        return [version]$manifest.version
    } catch { return $null }
}
function Show-EcosUpdateNotification([string]$Version, [string]$Root) {
    # Registra primero: si Windows silencia avisos, Estado sigue mostrando la actualizacion.
    @{ version = $Version; fecha = (Get-Date).ToString('o') } | ConvertTo-Json |
        Set-Content -LiteralPath (Join-Path $Root 'ultima-actualizacion.json') -Encoding UTF8
    $icon = $null; $timer = $null; $context = $null
    try {
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        $icon = New-Object System.Windows.Forms.NotifyIcon
        $icon.Icon = [System.Drawing.SystemIcons]::Information
        $icon.Text = 'Ecos de la Frontera'
        $icon.Visible = $true
        $icon.ShowBalloonTip(10000, 'Ecos de la Frontera actualizado', "Instalada la version $Version. Ya puedes abrir Foundry.", [System.Windows.Forms.ToolTipIcon]::Info)
        $context = New-Object System.Windows.Forms.ApplicationContext
        $timer = New-Object System.Windows.Forms.Timer
        $timer.Interval = 12000
        $timer.add_Tick({ $timer.Stop(); $context.ExitThread() }.GetNewClosure())
        $timer.Start()
        [System.Windows.Forms.Application]::Run($context)
    } catch {
        Add-Content -LiteralPath (Join-Path $Root 'actualizador.log') -Encoding UTF8 -Value ('Actualizado a ' + $Version + '; Windows no pudo mostrar el aviso: ' + $_.Exception.Message)
    } finally {
        if ($timer) { $timer.Dispose() }
        if ($icon) { $icon.Visible = $false; $icon.Dispose() }
        if ($context) { $context.Dispose() }
    }
}
function Invoke-EcosNotifyingCheck([string]$Root) {
    $before = Get-EcosInstalledVersion $Root
    & (Join-Path $Root 'Ecos-Actualizar.ps1') -Check -StateRoot $Root
    $after = Get-EcosInstalledVersion $Root
    if ($after -and (-not $before -or $after -gt $before)) { Show-EcosUpdateNotification ([string]$after) $Root }
}
if ($MyInvocation.InvocationName -ne '.') { Invoke-EcosNotifyingCheck $StateRoot }
