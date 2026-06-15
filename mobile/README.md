# LX Netease Music Mobile

基于 React Native 构建的移动端音乐播放器，基于 [souvenp/lx-netease-music-mobile](https://github.com/souvenp/lx-netease-music-mobile) v1.8.85 定制开发。

## 技术栈

- React Native 0.73.11
- TypeScript
- react-native-track-player
- react-native-navigation 7.39.2

## 核心功能

### 搜索与发现
- 多音源搜索（歌曲、歌手、歌单）
- 歌手详情页（热门歌曲、专辑列表）

### 网易云集成
- 账号登录
- VIP 歌曲播放

### 播放功能
- 在线播放
- 音质选择（128k/320k/flac/flac24bit）
- 睡眠定时器
- 桌面歌词

### 下载管理
- 批量下载
- 下载任务管理

### 其他功能
- WebDAV 同步

## 内置音乐源

- 网易云音乐 (wy)
- QQ 音乐 (tx)
- 酷狗音乐 (kg)

> 其他音源可通过「自定义音源脚本」导入。

## 开发

### 环境要求
- Node.js >= 18
- npm >= 8.5.2
- Android SDK
- JDK 17

### 运行调试
```bash
npm install
npm run dev              # Android 开发模式
```

### 构建打包
```bash
npm run pack:android:win           # 正式包
npm run pack:android:debug:win     # 调试包
```

### 清理
```bash
npm run clear              # Gradle clean
```

## 注意事项

- 本项目仅供学习交流使用
- VIP 歌曲播放需要网易云账号登录
- 遵守音乐版权相关法律法规

## 上游项目

- [souvenp/lx-netease-music-mobile](https://github.com/souvenp/lx-netease-music-mobile)
- [lyswhut/lx-music-mobile](https://github.com/lyswhut/lx-music-mobile)

## 许可证

Apache-2.0
