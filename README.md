# LX Netease Music

基于 [lyswhut/lx-music-desktop](https://github.com/lyswhut/lx-music-desktop) 和 [souvenp/lx-netease-music-mobile](https://github.com/souvenp/lx-netease-music-mobile) 的多平台音乐播放器。

## 项目结构

```
lx-netease-music/
├── desktop/     # 桌面端 (Electron + Vue 3)
└── mobile/      # 移动端 (React Native)
```

## 桌面端 (Desktop)

### 技术栈
- Electron 40.10.0
- Vue 3 (Composition API)
- Webpack 5
- electron-builder

### 核心功能
- 多音源搜索（歌曲、歌单）
- 在线播放与音质选择
- 歌单管理
- 下载管理
- 桌面歌词

### 音乐源
- 网易云音乐 (wy)
- 酷狗音乐 (kg)
- 酷我音乐 (kw)
- 咪咕音乐 (mg)
- 千千音乐 (tx)

### 开发运行
```bash
cd desktop
npm install
npm run dev
```

### 打包
```bash
npm run build                    # 编译代码
npm run pack:win:setup:x64       # Windows 安装包
```

---

## 移动端 (Mobile)

### 技术栈
- React Native 0.73.11
- TypeScript
- react-native-track-player
- react-native-navigation 7.39.2

### 核心功能
- 多音源搜索（歌曲、歌手、歌单）
- 网易云账号登录（VIP 支持）
- 歌手详情页（热门歌曲、专辑列表）
- 下载管理器
- 睡眠定时器
- WebDAV 同步
- 桌面歌词

### 音乐源
- 网易云音乐 (wy)
- 酷狗音乐 (kg)
- 酷我音乐 (kw)
- 咪咕音乐 (mg)
- 千千音乐 (tx)
- YouTube（需配置）

### 开发运行
```bash
cd mobile
npm install
npm run dev              # Android 开发模式
```

### 打包
```bash
npm run pack:android:win           # 正式包
npm run pack:android:debug:win     # 调试包
```

---

## 注意事项

- 本项目仅供学习交流使用
- VIP 歌曲播放需要网易云账号登录
- 遵守音乐版权相关法律法规

## 上游项目

- 桌面端基础：[lyswhut/lx-music-desktop](https://github.com/lyswhut/lx-music-desktop)
- 移动端基础：[souvenp/lx-netease-music-mobile](https://github.com/souvenp/lx-netease-music-mobile)

## 许可证

Apache-2.0
