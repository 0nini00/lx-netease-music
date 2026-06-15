# 播放过渡功能说明

本项目已添加**淡入淡出 (Crossfade)** 和 **无缝播放 (Gapless)** 功能，提升歌曲切换的听感体验。

## 📋 功能概述

### 🎵 淡入淡出 (Crossfade)
歌曲切换时，当前歌曲音量逐渐降低，新歌曲音量逐渐升高，实现平滑过渡。

**适用场景**：
- 派对/DJ模式
- 背景音乐播放
- 不希望歌曲间有停顿

**配置项**：
- 开关：`设置 > 播放器 > 淡入淡出`
- 时长：1-10秒可选（推荐3秒）

### 🎼 无缝播放 (Gapless)
专辑连续播放时消除歌曲间的静音间隙，适合现场专辑和概念专辑。

**适用场景**：
- 古典音乐专辑
- 现场录音专辑
- 概念专辑（如Pink Floyd的The Wall）

**配置项**：
- 开关：`设置 > 播放器 > 无缝播放`

**注意**：淡入淡出和无缝播放**互斥**，只能启用一个。

## 🔧 技术实现

### 核心文件

1. **crossfade.ts** - 淡入淡出核心逻辑
   - `fadeOut()` - 淡出当前歌曲
   - `fadeIn()` - 淡入新歌曲
   - `stopFade()` - 停止淡入淡出

2. **player.ts** - 播放器集成
   - `handlePlay()` - 切歌时触发淡出
   - `pause()` / `stop()` - 停止淡入淡出

3. **playerEvent.ts** - 事件处理
   - `handlePlaying()` - 播放开始时触发淡入

### 实现原理

**淡入淡出**：
```typescript
// 淡出：将音量从当前值降到0（用时 duration/2）
fadeOut(duration) → 音量: 100% → 0%

// 切换歌曲
setResource(newMusicInfo, url)

// 淡入：将音量从0升到目标值（用时 duration/2）
fadeIn(duration, targetVolume) → 音量: 0% → 100%
```

**无缝播放**：
- 通过增大缓冲区 (`maxBuffer: 1000`) 实现
- 预加载下一首歌曲
- react-native-track-player 默认支持无缝播放

### 配置流程

1. 用户在设置中启用功能
2. 配置保存到 `settingState`
3. 播放器读取配置：
   - `isCrossfadeEnabled()` - 检查是否启用淡入淡出
   - `getCrossfadeDuration()` - 获取时长
   - `isGaplessEnabled()` - 检查是否启用无缝播放

## 📱 UI组件

### 设置界面

**位置**：`设置 > 播放器`

**组件**：
1. **Crossfade.tsx** - 淡入淡出开关
2. **CrossfadeDuration.tsx** - 时长选择器（1s/2s/3s/5s/8s/10s）
3. **Gapless.tsx** - 无缝播放开关

**互斥逻辑**：
- 启用淡入淡出 → 自动禁用无缝播放
- 启用无缝播放 → 自动禁用淡入淡出

## 🌐 国际化

### 中文 (zh-cn.json)
```json
{
  "setting_play_crossfade": "淡入淡出",
  "setting_play_crossfade_tip": "歌曲切换时平滑过渡（推荐：3秒）",
  "setting_play_crossfade_duration": "淡入淡出时长",
  "setting_play_crossfade_duration_tip": "单位：秒（1-10秒）",
  "setting_play_gapless": "无缝播放",
  "setting_play_gapless_tip": "专辑连续播放无间隙（与淡入淡出互斥）"
}
```

### 英文 (en-us.json)
对应英文翻译已添加。

## 🧪 测试建议

### 淡入淡出测试
1. 设置 > 播放器 > 启用淡入淡出，时长3秒
2. 播放任意歌曲
3. 点击"下一首"
4. **预期**：当前歌曲音量逐渐降低（1.5秒），新歌曲音量逐渐升高（1.5秒）

### 无缝播放测试
1. 设置 > 播放器 > 启用无缝播放
2. 播放专辑中的歌曲（如古典音乐专辑）
3. 让歌曲自动切换到下一首
4. **预期**：歌曲间无静音间隙

### 互斥测试
1. 启用淡入淡出
2. 尝试启用无缝播放
3. **预期**：淡入淡出自动关闭

## ⚙️ 默认配置

```typescript
{
  'player.isCrossfadeEnabled': false,  // 默认关闭
  'player.crossfadeDuration': 3,       // 默认3秒
  'player.isGaplessEnabled': false     // 默认关闭
}
```

## 📝 注意事项

1. **性能**：淡入淡出使用定时器实现（20步），对性能影响极小
2. **兼容性**：基于 react-native-track-player，兼容所有支持的设备
3. **音质**：淡入淡出通过调节音量实现，不影响音质
4. **缓存**：无缝播放依赖缓冲区，可能增加内存占用

## 🔮 未来优化

1. **智能淡入淡出**：检测歌曲结尾的静音部分，智能调整淡出时机
2. **AB循环**：循环播放某一段落
3. **响度均衡**：不同歌曲音量统一化
4. **播放队列预加载**：提前加载播放队列中的歌曲

## 🐛 已知问题

1. 如果切歌速度过快，淡入淡出可能被中断（已通过 `stopFade()` 处理）
2. 暂停/停止时会立即停止淡入淡出效果（符合预期）

## 📞 反馈

如有问题或建议，请通过以下方式反馈：
- GitHub Issues
- 应用内反馈功能

---

**版本**: v1.0.0  
**更新时间**: 2026-06-02
