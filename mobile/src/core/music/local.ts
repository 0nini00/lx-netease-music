import { saveLyric, saveMusicUrl } from '@/utils/data'
import { updateListMusics } from '@/core/list'
import {
  buildLyricInfo,
  getCachedLyricInfo,
  getOnlineOtherSourceLyricByLocal,
  getOnlineOtherSourceLyricInfo,
  getOnlineOtherSourceMusicUrl,
  getOnlineOtherSourceMusicUrlByLocal,
  getOnlineOtherSourcePicByLocal,
  getOnlineOtherSourcePicUrl,
  getOtherSource,
} from './utils'
import { getLocalFilePath } from '@/utils/music'
import { readLyric, readPic } from '@/utils/localMediaMetadata'
import { stat } from '@/utils/fs'

const getOtherSourceByLocal = async <T>(
  musicInfo: LX.Music.MusicInfoLocal,
  handler: (infos: LX.Music.MusicInfoOnline[]) => Promise<T>
) => {
  let result: LX.Music.MusicInfoOnline[] = []
  result = await getOtherSource(musicInfo)
  if (result.length)
    try {
      return await handler(result)
    } catch (err) {
      console.log('getOtherSourceByLocal handler failed:', err)
    }
  if (musicInfo.name.includes('-')) {
    const [name, singer] = musicInfo.name.split('-').map((val) => val.trim())
    result = await getOtherSource(
      {
        ...musicInfo,
        name,
        singer,
      },
      true
    )
    if (result.length)
      try {
        return await handler(result)
      } catch (err) {
        console.log('getOtherSourceByLocal handler failed (name-singer):', err)
      }
    result = await getOtherSource(
      {
        ...musicInfo,
        name: singer,
        singer: name,
      },
      true
    )
    if (result.length)
      try {
        return await handler(result)
      } catch (err) {
        console.log('getOtherSourceByLocal handler failed (singer-name):', err)
      }
  }
  let fileName =
    (await stat(musicInfo.meta.filePath).catch(() => ({ name: null }))).name ??
    musicInfo.meta.filePath.split(/\/|\\/).at(-1)
  if (fileName) {
    fileName = fileName.substring(0, fileName.lastIndexOf('.'))
    if (fileName != musicInfo.name) {
      if (fileName.includes('-')) {
        const [name, singer] = fileName.split('-').map((val: string) => val.trim())
        result = await getOtherSource(
          {
            ...musicInfo,
            name,
            singer,
          },
          true
        )
        if (result.length)
          try {
            return await handler(result)
          } catch (err) {
            console.log('getOtherSourceByLocal handler failed (filename):', err)
          }
        result = await getOtherSource(
          {
            ...musicInfo,
            name: singer,
            singer: name,
          },
          true
        )
      } else {
        result = await getOtherSource(
          {
            ...musicInfo,
            name: fileName,
            singer: '',
          },
          true
        )
      }
      if (result.length)
        try {
          return await handler(result)
        } catch (err) {
          console.log('getOtherSourceByLocal handler failed (alternative):', err)
        }
    }
  }

  throw new Error('source not found')
}

export const getMusicUrl = async ({
  musicInfo,
  isRefresh,
  allowToggleSource = true,
  onToggleSource = () => {},
}: {
  musicInfo: LX.Music.MusicInfoLocal
  isRefresh: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
  allowToggleSource?: boolean
}): Promise<string> => {
  if (!isRefresh) {
    const path = await getLocalFilePath(musicInfo)
    // console.log(path)
    if (path) return path
  }

  try {
    return await getOnlineOtherSourceMusicUrlByLocal(musicInfo, isRefresh).then(
      ({ url, quality, isFromCache }) => {
        if (!isFromCache) void saveMusicUrl(musicInfo, quality, url)
        return url
      }
    )
  } catch (err) {
    console.log('getLocalMusicUrl online source failed:', err)
  }

  if (!allowToggleSource) throw new Error('failed')

  onToggleSource()
  return getOtherSourceByLocal(musicInfo, async (otherSource) => {
    return getOnlineOtherSourceMusicUrl({
      musicInfos: [...otherSource],
      onToggleSource,
      isRefresh,
    }).then(({ url, quality: targetQuality, musicInfo: targetMusicInfo, isFromCache }) => {
      if (!isFromCache) void saveMusicUrl(targetMusicInfo, targetQuality, url)
      // Note: URL is already saved via saveMusicUrl, no need to save again
      return url
    })
  })
}

export const getPicUrl = async ({
  musicInfo,
  listId,
  isRefresh,
  skipFilePic,
  onToggleSource = () => {},
}: {
  musicInfo: LX.Music.MusicInfoLocal
  listId?: string | null
  isRefresh: boolean
  skipFilePic?: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<string> => {
  if (!isRefresh && !skipFilePic) {
    let pic = await readPic(musicInfo.meta.filePath).catch(() => null)
    if (pic) {
      if (pic.startsWith('/')) pic = `file://${pic}`
      return pic
    }

    if (musicInfo.meta.picUrl) return musicInfo.meta.picUrl
  }

  try {
    return await getOnlineOtherSourcePicByLocal(musicInfo).then(({ url }) => {
      return url
    })
  } catch (err) {
    console.log('getPicUrl online source failed:', err)
  }

  onToggleSource()
  return getOtherSourceByLocal(musicInfo, async (otherSource) => {
    return getOnlineOtherSourcePicUrl({
      musicInfos: [...otherSource],
      onToggleSource,
      isRefresh,
    }).then(({ url, musicInfo: targetMusicInfo, isFromCache }) => {
      if (listId) {
        musicInfo.meta.picUrl = url
        void updateListMusics([{ id: listId, musicInfo }])
      }

      return url
    })
  })
}

const getMusicFileLyric = async (filePath: string) => {
  const lyric = await readLyric(filePath).catch(() => null)
  if (!lyric) return null
  return {
    lyric,
  }
}
export const getLyricInfo = async ({
  musicInfo,
  isRefresh,
  skipFileLyric,
  onToggleSource = () => {},
}: {
  musicInfo: LX.Music.MusicInfoLocal
  skipFileLyric?: boolean
  isRefresh: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<LX.Player.LyricInfo> => {
  if (!isRefresh && !skipFileLyric) {
    // const lyricInfo = await getCachedLyricInfo(musicInfo)
    // if (lyricInfo?.rawlrcInfo.lyric && lyricInfo.lyric != lyricInfo.rawlrcInfo.lyric) {
    //   // 存在已编辑歌词
    //   return buildLyricInfo(lyricInfo)
    // }

    // 尝试读取文件内歌词
    const rawlrcInfo = await getMusicFileLyric(musicInfo.meta.filePath)
    if (rawlrcInfo) return buildLyricInfo(rawlrcInfo)

    const lyricInfo = await getCachedLyricInfo(musicInfo)
    if (lyricInfo?.lyric) return buildLyricInfo(lyricInfo)
  }

  try {
    return await getOnlineOtherSourceLyricByLocal(musicInfo, isRefresh).then(
      ({ lyricInfo, isFromCache }) => {
        if (!isFromCache) void saveLyric(musicInfo, lyricInfo)
        return buildLyricInfo(lyricInfo)
      }
    )
  } catch (err) {
    console.log('getLyricInfo online source failed:', err)
  }

  onToggleSource()
  return getOtherSourceByLocal(musicInfo, async (otherSource) => {
    return getOnlineOtherSourceLyricInfo({
      musicInfos: [...otherSource],
      onToggleSource,
      isRefresh,
    }).then(async ({ lyricInfo, musicInfo: targetMusicInfo, isFromCache }) => {
      void saveLyric(musicInfo, lyricInfo)

      if (isFromCache) return buildLyricInfo(lyricInfo)
      void saveLyric(targetMusicInfo, lyricInfo)

      return buildLyricInfo(lyricInfo)
    })
  })
}
