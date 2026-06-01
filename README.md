# lx-netease-music

基于 [lyswhut/lx-music-desktop](https://github.com/lyswhut/lx-music-desktop) 和 [lyswhut/lx-music-mobile](https://github.com/lyswhut/lx-music-mobile) 定制开发的落雪音乐助手项目，包含 Windows 桌面端和 Android 移动端。

## 项目结构

```
lx-netease-music/
├── desktop/          # Windows 桌面端 (Electron + Vue 3)
├── mobile/           # Android 移动端 (React Native)
├── .editorconfig     # 编辑器统一配置
├── .gitignore        # Git 忽略规则
└── README.md
```

## 桌面端 (desktop/)

- **技术栈**: Electron + Vue 3 + TypeScript + Webpack
- **运行方式**: 见 [desktop/README.md](desktop/README.md)
- **构建输出**: Windows 安装包 (electron-builder)

## 移动端 (mobile/)

- **技术栈**: React Native + TypeScript
- **运行方式**: 见 [mobile/README.md](mobile/README.md)
- **构建输出**: Android APK

## 音乐源支持

两个平台共享统一的音乐源接口，支持以下平台：

- 网易云音乐 (wy)
- 酷狗音乐 (kg)
- 酷我音乐 (kw)
- 咪咕音乐 (mg)
- 千千音乐 (tx)
- YouTube (mobile only)

## 上游项目

- 桌面端基础: <https://github.com/lyswhut/lx-music-desktop>
- 移动端基础: <https://github.com/lyswhut/lx-music-mobile>
- 移动端网易云定制: <https://github.com/souvenp/lx-netease-music-mobile>
