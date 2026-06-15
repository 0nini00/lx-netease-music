# 📦 构建与安装指南

## 🚀 快速开始

### 方法1: 一键构建并安装（推荐）

在PowerShell中运行：

```powershell
cd C:\Users\chenle\Desktop\lx-netease-music\mobile
.\build-and-install.ps1
```

这个脚本会：
1. ✓ 清理旧的构建文件
2. ✓ 构建Release APK (ARM64)
3. ✓ 显示APK位置和大小
4. ✓ 自动安装到已连接的手机（如果有）

### 方法2: 使用npm脚本

```bash
# 构建通用版APK
npm run pack:android:win

# 构建ARM64版APK（推荐，体积更小）
npm run pack:android:arm64
```

### 方法3: 直接使用Gradle

```bash
cd android
./gradlew.bat assembleRelease
```

---

## 📍 APK输出位置

构建完成后，APK文件在：

```
mobile/android/app/build/outputs/apk/release/
```

**推荐安装**: `app-arm64-v8a-release.apk` (适用于绝大多数现代手机)

---

## 📲 安装方法

### 方法A: USB连接安装

**前置条件**：
1. 手机启用"开发者选项" → "USB调试"
2. 连接电脑后授权USB调试

**安装命令**：
```bash
cd android\app\build\outputs\apk\release
adb install -r app-arm64-v8a-release.apk
```

参数说明：
- `-r`: 覆盖安装（保留数据）
- `-t`: 允许测试APK（如果需要）

### 方法B: 手动传输安装

1. 将APK文件传输到手机（通过：）
   - USB数据线
   - 微信/QQ文件传输
   - 云盘
   - 局域网共享

2. 在手机上点击APK文件
3. 允许"未知来源"安装（如果系统提示）
4. 完成安装

---

## 🔍 构建版本说明

### APK架构选择

| 架构 | 文件名 | 适用设备 | 推荐 |
|------|--------|----------|------|
| ARM64 | `app-arm64-v8a-release.apk` | 2016年后的手机（95%+） | ⭐⭐⭐⭐⭐ |
| ARM32 | `app-armeabi-v7a-release.apk` | 老旧手机 | ⭐⭐ |
| x86_64 | `app-x86_64-release.apk` | 模拟器/Intel手机 | ⭐⭐⭐ |
| x86 | `app-x86-release.apk` | 老模拟器 | ⭐ |
| 通用版 | `app-universal-release.apk` | 所有设备（体积大） | ⭐⭐⭐ |

**推荐**: ARM64版本（体积小，性能好）

---

## 🛠️ 常见问题

### Q1: 构建失败 - 内存不足

**解决方案**：
编辑 `android/gradle.properties`，增加内存：
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### Q2: 构建失败 - 网络错误

**解决方案**：
1. 检查网络连接
2. 使用国内Maven镜像（已配置）
3. 清理缓存重试：
   ```bash
   cd android
   ./gradlew.bat clean
   ./gradlew.bat assembleRelease --refresh-dependencies
   ```

### Q3: 安装失败 - INSTALL_FAILED_UPDATE_INCOMPATIBLE

**原因**: 签名不一致

**解决方案**：
```bash
# 先卸载旧版本
adb uninstall com.lx.netease.music

# 再安装新版本
adb install app-arm64-v8a-release.apk
```

### Q4: 安装失败 - 设备未连接

**解决方案**：
```bash
# 检查设备连接
adb devices

# 如果未显示设备：
# 1. 检查USB线是否连接
# 2. 手机是否开启USB调试
# 3. 是否授权USB调试
# 4. 重启adb服务：
adb kill-server
adb start-server
```

### Q5: 手机提示"禁止安装未知来源应用"

**解决方案**：
1. 打开手机"设置"
2. 找到"应用管理" → "特殊权限"
3. 启用"安装未知应用"
4. 允许对应的文件管理器/浏览器

### Q6: 想要带签名的Release版本

**解决方案**：
创建 `android/keystore.properties` 文件：
```properties
MYAPP_UPLOAD_STORE_FILE=your-release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=your-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=your-store-password
MYAPP_UPLOAD_KEY_PASSWORD=your-key-password
```

生成keystore：
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore your-release-key.keystore \
  -alias your-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000
```

---

## 📊 构建时间参考

| 配置 | 首次构建 | 增量构建 |
|------|----------|----------|
| 标准PC（8核/16GB） | ~5-10分钟 | ~2-3分钟 |
| 高性能PC（16核/32GB） | ~3-5分钟 | ~1-2分钟 |

---

## 🧪 测试淡入淡出功能

安装完成后：

1. 打开应用
2. 进入 **设置 > 播放器**
3. 启用 **"淡入淡出"**
4. 选择时长 **"3s"**
5. 播放任意歌曲，点击"下一首"
6. **预期效果**：音量平滑过渡

---

## 📝 版本信息

查看APK版本信息：
```bash
aapt dump badging app-arm64-v8a-release.apk | findstr "version"
```

---

## 🔗 相关命令

```bash
# 查看已安装的应用版本
adb shell dumpsys package com.lx.netease.music | findstr "versionName"

# 卸载应用
adb uninstall com.lx.netease.music

# 查看应用日志
adb logcat | findstr "ReactNativeJS"

# 清除应用数据
adb shell pm clear com.lx.netease.music
```

---

## ✅ 检查清单

构建前：
- [ ] 已安装Node.js 18+
- [ ] 已安装Android SDK
- [ ] 已配置ANDROID_HOME环境变量
- [ ] 已运行 `npm install`

安装前：
- [ ] 手机已启用USB调试
- [ ] 已授权USB调试权限
- [ ] USB线连接正常
- [ ] 运行 `adb devices` 能看到设备

---

祝你构建顺利！🎉
