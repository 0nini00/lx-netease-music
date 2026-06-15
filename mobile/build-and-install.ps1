# 构建并安装Release APK

$ErrorActionPreference = 'Stop'

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  洛雪音乐助手 - Release构建脚本" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. 清理旧的构建
Write-Host "[1/4] 清理旧的构建文件..." -ForegroundColor Yellow
Set-Location "$root\android"
./gradlew.bat clean

# 2. 构建Release APK
Write-Host "[2/4] 构建Release APK (ARM64)..." -ForegroundColor Yellow
./gradlew.bat assembleRelease

# 3. 检查构建结果
$apkPath = "$root\android\app\build\outputs\apk\release"
$arm64Apk = "$apkPath\app-arm64-v8a-release.apk"
$universalApk = "$apkPath\app-universal-release.apk"

if (Test-Path $arm64Apk) {
    Write-Host "[3/4] ✓ 构建成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "APK位置: $arm64Apk" -ForegroundColor Green
    $apkSize = (Get-Item $arm64Apk).Length / 1MB
    Write-Host "APK大小: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Green

    # 4. 尝试安装到手机
    Write-Host ""
    Write-Host "[4/4] 尝试安装到手机..." -ForegroundColor Yellow

    # 检查设备连接
    $devices = adb devices
    if ($devices -match "device$") {
        Write-Host "检测到已连接的设备，开始安装..." -ForegroundColor Yellow
        adb install -r $arm64Apk

        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✓ 安装成功！可以在手机上打开应用了。" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "⚠ 安装失败，请手动将APK传输到手机安装。" -ForegroundColor Red
            Write-Host "APK路径: $arm64Apk" -ForegroundColor Yellow
        }
    } else {
        Write-Host "未检测到连接的设备。" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "手动安装方法：" -ForegroundColor Cyan
        Write-Host "1. 将以下APK文件传输到手机：" -ForegroundColor White
        Write-Host "   $arm64Apk" -ForegroundColor Yellow
        Write-Host "2. 在手机上点击APK文件进行安装" -ForegroundColor White
        Write-Host ""
        Write-Host "或者连接手机USB后运行：" -ForegroundColor Cyan
        Write-Host "   adb install -r `"$arm64Apk`"" -ForegroundColor Yellow
    }

} else {
    Write-Host "[3/4] ✗ 构建失败！" -ForegroundColor Red
    Write-Host "请检查上面的错误信息。" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  构建完成" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
