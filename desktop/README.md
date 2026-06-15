# LX Netease Music Desktop

基于 Electron + Vue 3 构建的桌面音乐播放器，参考 [lyswhut/lx-music-desktop](https://github.com/lyswhut/lx-music-desktop) 开发。

## 技术栈

- Electron 40.10.0
- Vue 3 (Composition API)
- TypeScript
- Webpack 5
- electron-builder

## 核心功能

### 搜索与播放
- 多音源搜索（歌曲、歌单）
- 在线播放
- 音质选择（128k/320k/flac/flac24bit）
- 播放列表管理

### 下载管理
- 批量下载
- 下载任务管理
- 音质选择

### 界面功能
- 桌面歌词
- 播放控制
- 主题切换

### 其他
- 热键支持
- WebDAV 同步
- 自定义音源 API

## 内置音乐源

- 网易云音乐 (wy)
- QQ 音乐 (tx)
- 酷狗音乐 (kg)

> 其他音源可通过「自定义音源脚本」导入。

## 开发

### 环境要求
- Node.js >= 18
- npm >= 8

### 运行
```bash
npm install
npm run dev
```

### 构建
```bash
npm run build                    # 编译代码到 dist/
npm run pack:win:setup:x64       # Windows x64 安装包
```

### 目录结构
```
src/
├── main/              # 主进程
├── renderer/          # 渲染进程 (Vue 3)
├── renderer-lyric/    # 桌面歌词窗口
├── common/            # 公共代码
└── lang/              # 多语言
```

## 配置文件

配置文件位于 `%APPDATA%/lx-netease-music-desktop/`（Windows）

## 注意事项

- 本项目仅供学习交流使用
- 遵守音乐版权相关法律法规

## 上游项目

- [lyswhut/lx-music-desktop](https://github.com/lyswhut/lx-music-desktop)

## 许可证

Apache-2.0
