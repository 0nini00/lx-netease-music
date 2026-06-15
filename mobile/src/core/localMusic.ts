import { toast } from '@/utils/tools'
import listState from '@/store/list/state'
import { playList } from '@/core/player/player'
import { overwriteListMusics, createList, setActiveList } from '@/core/list'
import RNFS from 'react-native-fs'
import { requestStoragePermission } from '@/core/common'
import { Alert, Linking } from 'react-native'

const SUPPORTED_EXTENSIONS = ['.mp3', '.flac', '.wav', '.aac', '.ogg', '.m4a', '.wma']

const getFileExtension = (filePath: string) => {
  const lastDotIndex = filePath.lastIndexOf('.')
  return lastDotIndex < 0 ? '' : filePath.substring(lastDotIndex + 1).toLowerCase()
}

export interface LocalMusicInfo {
  id: string
  name: string
  singer: string
  albumName: string
  interval: string | null
  filePath: string
  size: number
}

let cachedResults: LocalMusicInfo[] | null = null
let scanAborted = false

export function isAudioFile(fileName: string): boolean {
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex < 0) return false
  const ext = fileName.substring(lastDotIndex).toLowerCase()
  return SUPPORTED_EXTENSIONS.includes(ext)
}

// 递归扫描音频文件
export const LOCAL_LIST_ID = 'userlist_local_music_list'
export const LOCAL_LIST_NAME = '本地歌曲'

export async function scanLocalFiles(directoryPath: string, depth = 0): Promise<LocalMusicInfo[]> {
  if (depth > 10) return [] // 限制最大递归深度为 10
  if (scanAborted) return [] // 检查是否被取消
  try {
    const files = await RNFS.readDir(directoryPath)
    let results: LocalMusicInfo[] = []
    for (const file of files) {
      if (scanAborted) break // 检查是否被取消
      if (file.isDirectory()) {
        const subFiles = await scanLocalFiles(file.path, depth + 1)
        results = results.concat(subFiles)
      } else if (file.isFile() && isAudioFile(file.name)) {
        // 解析歌手和歌名，支持多种格式
        const cleanName = file.name.replace(/\.[^/.]+$/, '')
        let singer = 'Unknown'
        let name = cleanName

        // 支持 "歌手 - 歌名" 或 "歌名 - 歌手" 格式
        if (cleanName.includes(' - ')) {
          const parts = cleanName.split(' - ')
          if (parts.length >= 2) {
            // 简单启发式：如果第一部分较短，可能是歌手
            if (parts[0].length <= 20) {
              singer = parts[0].trim()
              name = parts.slice(1).join(' - ').trim()
            } else {
              // 否则认为是 "歌名 - 歌手"
              name = parts[0].trim()
              singer = parts[1].trim()
            }
          }
        }

        results.push({
          id: `local_${file.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name,
          singer,
          albumName: '',
          interval: null,
          filePath: file.path,
          size: file.size ?? 0,
        })
      }
    }

    if (depth === 0) {
      cachedResults = results
    }
    return results
  } catch (err) {
    console.log('scan local files failed:', err)
    if (depth === 0) {
      toast('Scan failed: ' + (err as Error).message)
    }
    return []
  }
}

export function getCachedLocalMusic(): LocalMusicInfo[] {
  return cachedResults ?? []
}

// 默认导入方法
export async function addLocalMusicToList(): Promise<void> {
  const musics = cachedResults
  if (!musics?.length) {
    toast('No local music found')
    return
  }
  const musicInfos = musics.map(m => ({
    id: m.id,
    name: m.name,
    singer: m.singer,
    source: 'local' as const,
    interval: m.interval,
    meta: {
      songId: m.id,
      albumName: m.albumName,
      filePath: m.filePath,
      ext: getFileExtension(m.filePath),
    },
  })) as LX.Music.MusicInfoLocal[]

  const targetListId = listState.defaultList.id
  await overwriteListMusics(targetListId, musicInfos)
  await playList(targetListId, 0)
}

// 执行扫描并自动导入到”本地歌曲”歌单的主入口
export async function scanAndImportLocalMusic(): Promise<void> {
  const hasPermission = await requestStoragePermission()
  if (!hasPermission) {
    Alert.alert(
      '权限被拒',
      '需要存储权限才能扫描本地音乐。请前往设置开启权限。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '去设置',
          onPress: () => {
            void Linking.openSettings()
          },
        },
      ]
    )
    return
  }

  const rootPath = RNFS.ExternalStorageDirectoryPath || '/storage/emulated/0'

  // 直接开始全盘扫描
  Alert.alert(
    '扫描本地歌曲',
    `即将扫描手机存储中的所有音频文件并导入”本地歌曲”歌单，可能需要较长时间。`,
    [
      { text: '取消', style: 'cancel' },
      {
        text: '开始扫描',
        onPress: () => {
          scanAborted = false
          void startScan(rootPath)
        },
      },
    ]
  )
}

async function startScan(directoryPath: string) {
  toast('正在扫描本地音乐文件...')

  let progressCount = 0
  const progressInterval = setInterval(() => {
    progressCount++
    if (progressCount % 3 === 0) {
      toast(`已扫描 ${progressCount * 10} 个文件...`, 'short')
    }
  }, 2000)

  try {
    const results = await scanLocalFiles(directoryPath)
    clearInterval(progressInterval)

    if (scanAborted) {
      toast('扫描已取消')
      return
    }

    if (!results.length) {
      toast('未找到支持的音频文件')
      return
    }

    const hasLocalList = listState.userList.some(item => item.id === LOCAL_LIST_ID)

    // 映射到 MusicInfo 格式
    const musicInfos: LX.Music.MusicInfoLocal[] = results.map(m => ({
      id: m.id,
      name: m.name,
      singer: m.singer,
      source: 'local' as const,
      interval: m.interval,
      meta: {
        songId: m.id,
        albumName: m.albumName,
        filePath: m.filePath,
        ext: getFileExtension(m.filePath),
      },
    }))

    if (hasLocalList) {
      await overwriteListMusics(LOCAL_LIST_ID, musicInfos)
    } else {
      // 如果没有本地歌单，创建一个，放在用户歌单的第一个位置
      await createList({
        name: LOCAL_LIST_NAME,
        id: LOCAL_LIST_ID,
        list: musicInfos,
        position: 0,
      })
    }

    // 切换当前激活歌单为本地歌曲
    setActiveList(LOCAL_LIST_ID)
    toast(`扫描完成，已导入 ${results.length} 首歌曲`)
  } catch (err) {
    clearInterval(progressInterval)
    console.error('startScan error:', err)
    toast('扫描失败: ' + (err as Error).message, 'long')
  }
}
