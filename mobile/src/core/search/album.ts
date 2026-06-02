import searchAlbumState, { type Source } from '@/store/search/album/state'
import searchAlbumActions from '@/store/search/album/action'
import type { AlbumResult } from '@/store/search/album/state'
import musicSdk from '@/utils/musicSdk'

export const setSource: (source: Source) => void = (source) => {
  searchAlbumActions.setSource(source)
}
export const setSearchText: (text: string) => void = (text) => {
  searchAlbumActions.setSearchText(text)
}
const setListInfo = (results: AlbumResult[], page: number, text: string, sourceId: Source) => {
  return searchAlbumActions.setListInfo(sourceId, results, page, text)
}
export const clearListInfo: (source: Source) => void = (source) => {
  searchAlbumActions.clearListInfo(source)
}

async function searchWyAlbum(text: string, page: number): Promise<AlbumResult[]> {
  const wy = musicSdk.wy
  if (!wy?.musicSearch) return []
  try {
    const body = await (wy.musicSearch as any).musicSearch(text, page, 20)
    const rawList = body?.data?.list ?? body?.result?.songs ?? []
    if (!rawList.length) return []
    const albumMap = new Map<string, { id: string; name: string; picUrl: string; singer: string; publishTime: number; size: number }>()
    for (const item of rawList) {
      const songData = item.baseInfo?.simpleSongData ?? item
      const album = songData.al ?? songData.album
      const albumId = String(album?.id ?? songData.albumId ?? '')
      const albumName = album?.name ?? songData.albumName ?? ''
      if (!albumId || !albumName || albumMap.has(albumId)) continue
      albumMap.set(albumId, {
        id: albumId,
        name: albumName,
        picUrl: album?.picUrl ?? songData.img ?? '',
        singer: songData.singer ?? songData.name ?? '',
        publishTime: album?.publishTime ?? songData.publishTime ?? 0,
        size: album?.size ?? songData.size ?? 0,
      })
    }
    return Array.from(albumMap.values()).map(a => ({ ...a, source: 'wy' as LX.OnlineSource, desc: '' })).slice(0, 10)
  } catch (err) {
    console.log('wy album search failed:', err)
    return []
  }
}

async function searchKgAlbum(text: string): Promise<AlbumResult[]> {
  const kg = musicSdk.kg
  if (!kg?.musicSearch) return []
  try {
    const body = await (kg.musicSearch as any).musicSearch(text, 1, 20)
    const rawList = body?.data?.lists ?? body?.data?.info ?? []
    if (!rawList.length) return []
    const albumMap = new Map<string, { id: string; name: string; picUrl: string; singer: string }>()
    for (const item of rawList) {
      const albumId = String(item.AlbumID ?? item.album_id ?? '')
      const albumName = item.AlbumName ?? item.album_name ?? ''
      if (!albumId || !albumName || albumMap.has(albumId)) continue
      albumMap.set(albumId, {
        id: albumId,
        name: albumName,
        picUrl: item.AlbumCover ?? item.img ?? '',
        singer: item.SingerName ?? item.author_name ?? '',
      })
    }
    return Array.from(albumMap.values()).map(a => ({ ...a, source: 'kg' as LX.OnlineSource, desc: '', publishTime: 0, size: 0 })).slice(0, 10)
  } catch (err) {
    console.log('kg album search failed:', err)
    return []
  }
}

export const search = async (
  text: string,
  page: number,
  sourceId: Source
): Promise<AlbumResult[]> => {
  if (!text) return []
  const key = `${page}__${text}`
  const listInfo = searchAlbumState.listInfos.all!
  if (listInfo.key == key && listInfo.list.length) return listInfo.list
  listInfo.key = key

  const tasks: Promise<AlbumResult[]>[] = []
  if (sourceId === 'all' || sourceId === 'wy') {
    tasks.push(searchWyAlbum(text, page))
  }
  if (sourceId === 'all' || sourceId === 'kg') {
    tasks.push(searchKgAlbum(text))
  }

  const allResults = await Promise.all(tasks)
  const merged = allResults.flat()
  if (key != listInfo.key) return []
  setSearchText(text)
  setSource(sourceId)
  return setListInfo(merged, page, text, sourceId)
}

export async function getAlbumDetail(
  albumId: string,
  source: LX.OnlineSource
): Promise<{ list: LX.Music.MusicInfoOnline[]; info: any }> {
  if (source === 'wy') {
    const wy = musicSdk.wy
    return (wy?.album as any)?.getAlbum(albumId) ?? { list: [], info: {} }
  } else if (source === 'kg') {
    const kg = musicSdk.kg
    return (kg?.album as any)?.getAlbumDetail(albumId) ?? { list: [], info: {} }
  }
  return { list: [], info: {} }
}