import searchSingerState, { type Source } from '@/store/search/singer/state'
import searchSingerActions from '@/store/search/singer/action'
import type { SingerResult, SingerDetailData } from '@/store/search/singer/state'
import musicSdk from '@/utils/musicSdk'

export const setSource: (source: Source) => void = (source) => {
  searchSingerActions.setSource(source)
}
export const setSearchText: (text: string) => void = (text) => {
  searchSingerActions.setSearchText(text)
}
const setListInfo = (results: SingerResult[], page: number, text: string, sourceId: Source) => {
  return searchSingerActions.setListInfo(sourceId, results, page, text)
}
export const clearListInfo: (source: Source) => void = (source) => {
  searchSingerActions.clearListInfo(source)
}

async function searchWySinger(text: string, page: number): Promise<SingerResult[]> {
  const wy = musicSdk.wy
  if (!wy?.musicSearch) return []
  try {
    const result = await (wy.musicSearch as any).searchSinger(text, page, 20)
    const rawList = result?.list ?? []
    if (!rawList.length) return []
    return rawList.map((item: any) => ({
      id: String(item.id),
      name: item.name,
      picUrl: item.picUrl || null,
      desc: item.alias?.length ? item.alias.join('、') : '',
      source: 'wy' as LX.OnlineSource,
    }))
  } catch (err) {
    console.log('wy singer search failed:', err)
    return []
  }
}

async function searchKgSinger(text: string): Promise<SingerResult[]> {
  const kg = musicSdk.kg
  if (!kg?.musicSearch) return []
  try {
    const body = await (kg.musicSearch as any).musicSearch(text, 1, 20)
    const rawList = body?.data?.lists ?? body?.data?.info ?? []
    if (!rawList.length) return []
    const singerMap = new Map<string, { id: string; name: string }>()
    for (const item of rawList) {
      const singers = item.Singers || []
      for (const s of singers) {
        const sid = String(s.SingerId || s.id || '')
        const sname = s.name || s.SingerName || ''
        if (sid && sname && !singerMap.has(sid)) {
          singerMap.set(sid, { id: sid, name: sname })
        }
      }
    }
    const results: SingerResult[] = []
    for (const [, singer] of singerMap) {
      try {
        const info = await (kg.singer as any).getSingerInfo(singer.id)
        results.push({
          id: singer.id,
          name: info.info?.name || singer.name,
          picUrl: info.info?.img || null,
          desc: info.info?.desc || '',
          source: 'kg',
        })
      } catch {
        results.push({
          id: singer.id,
          name: singer.name,
          picUrl: null,
          desc: '',
          source: 'kg',
        })
      }
    }
    return results
  } catch (err) {
    console.log('kg singer search failed:', err)
    return []
  }
}

export const search = async (
  text: string,
  page: number,
  sourceId: Source
): Promise<SingerResult[]> => {
  if (!text) return []
  const key = `${page}__${text}`
  const listInfo = searchSingerState.listInfos.all!
  if (listInfo.key == key && listInfo.list.length) return listInfo.list
  listInfo.key = key

  const tasks: Promise<SingerResult[]>[] = []
  if (sourceId === 'all' || sourceId === 'wy') {
    tasks.push(searchWySinger(text, page))
  }
  if (sourceId === 'all' || sourceId === 'kg') {
    tasks.push(searchKgSinger(text))
  }

  const allResults = await Promise.all(tasks)
  const merged = allResults.flat()
  // Check again after async operation to prevent race condition
  if (key != listInfo.key) return []
  // Final check before setting state
  const currentListInfo = searchSingerState.listInfos.all!
  if (currentListInfo.key !== key) return []
  setSearchText(text)
  setSource(sourceId)
  return setListInfo(merged, page, text, sourceId)
}

export async function getSingerDetail(
  singerId: string,
  source: LX.OnlineSource,
  page: number = 1
): Promise<SingerDetailData> {
  if (source === 'wy') {
    const wy = musicSdk.wy
    const [songsRes, albumsRes] = await Promise.all([
      (wy?.artist as any)?.getSongs(singerId, 'time', 500, (page - 1) * 500) ?? { list: [], total: 0, hasMore: false },
      (wy?.artist as any)?.getAlbums(singerId, 100, 0) ?? { hotAlbums: [], hasMore: false },
    ])
    return {
      songs: songsRes.list || [],
      total: songsRes.total || 0,
      hasMore: songsRes.hasMore ?? false,
      albums: (albumsRes.hotAlbums || []).map((a: any) => ({
        id: String(a.id),
        name: a.name,
        picUrl: a.picUrl || '',
        publishTime: a.publishTime || 0,
        size: a.size || 0,
        source: 'wy' as LX.OnlineSource,
      })),
      albumHasMore: albumsRes.hasMore ?? false,
    }
  } else if (source === 'kg') {
    const kg = musicSdk.kg
    const [songsRes, albumsRes] = await Promise.all([
      (kg?.singer as any)?.getSingerSongList(singerId, page, 500) ?? { list: [], total: 0, allPage: 1 },
      (kg?.singer as any)?.getSingerAlbumList(singerId, 1, 100) ?? { albums: [] },
    ])
    return {
      songs: songsRes.list || [],
      total: songsRes.total || 0,
      hasMore: page < (songsRes.allPage || 1),
      albums: (albumsRes.albums || []).map((a: any) => ({
        id: a.album_id,
        name: a.name,
        picUrl: a.img || '',
        publishTime: a.publishTime ? new Date(a.publishTime).getTime() : 0,
        size: 0,
        source: 'kg' as LX.OnlineSource,
      })),
      albumHasMore: false,
    }
  }
  return { songs: [], total: 0, hasMore: false, albums: [], albumHasMore: false }
}
