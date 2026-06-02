import { createStyle, toast } from '@/utils/tools'
import { getListInfos } from '@/utils/data'
import listState from '@/store/list/state'
import playerState from '@/store/player/state'
import { playList } from '@/core/player/playList'

const SUPPORTED_EXTENSIONS = ['.mp3', '.flac', '.wav', '.aac', '.ogg', '.m4a', '.wma']
const SCAN_RESULT_KEY = '@local_music_scan_result'

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

export function isAudioFile(path: string): boolean {
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase()
  return SUPPORTED_EXTENSIONS.includes(ext)
}

export async function scanLocalFiles(directoryPath: string): Promise<LocalMusicInfo[]> {
  const nativeModules = global.lx?.fs
  if (!nativeModules) {
    toast('Local file access module not available')
    return []
  }

  try {
    const files = await nativeModules.listDir(directoryPath)
    const results: LocalMusicInfo[] = []
    for (const file of files) {
      if (isAudioFile(file)) {
        results.push({
          id: `local_${file}`,
          name: file.split('/').pop()?.replace(/\.[^/.]+$/, '') ?? file,
          singer: 'Unknown',
          albumName: '',
          interval: null,
          filePath: file,
          size: 0,
        })
      }
    }
    cachedResults = results
    return results
  } catch (err) {
    console.log('scan local files failed:', err)
    toast('Scan failed: ' + (err as Error).message)
    return []
  }
}

export function getCachedLocalMusic(): LocalMusicInfo[] {
  return cachedResults ?? []
}

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
    meta: { songId: m.id, albumName: m.albumName },
  })) as any[]

  const targetListId = listState.defaultList.id
  const targetList = listState.defaultList
  if (targetList) {
    targetList.list.push(...musicInfos)
    await playList(targetListId, musicInfos[0])
  }
}