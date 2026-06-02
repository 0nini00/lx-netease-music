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
    const body = await (wy.musicSearch as any).musicSearch(text, page, 20)
    const rawList = body?.data?.list ?? body?.result?.songs ?? []
    if (!rawList.length) return []
    const singerMap = new Map<string, { id: string; name: string }>()
    for (const item of rawList) {
      const ar = item.ar || item.artists || []
      for (const artist of ar) {
        if (artist.name && String(artist.id)) {
          const existing = singerMap.get(String(artist.id))
          if (!existing) {
            singerMap.set(String(artist.id), { id: String(artist.id), name: artist.name })
          }
        }
      }
    }
    const seen = new Set<string>()
    const results: SingerResult[] = []
    for (const [, singer] of singerMap) {
      if (seen.has(singer.id)) continue
      seen.add(singer.id)
      try {
        const detail = await (wy.artist as any).getDetail(singer.id)
        const artist = detail?.data?.artist ?? detail?.artist ?? {}
        results.push({
          id: singer.id,
          name: artist.name || singer.name,
          picUrl: artist.picUrl || artist.img1v1Url || artist.cover || null,
          desc: artist.briefDesc || '',
          source: 'wy',
        })
      } catch {
        results.push({
          id: singer.id,
          name: singer.name,
          picUrl: null,
          desc: '',
          source: 'wy',
        })
      }
    }
    return results
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
  if (key != listInfo.key) return []
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
      (wy?.artist as any)?.getSongs(singerId, 'time', 30, (page - 1) * 30) ?? { list: [], total: 0, hasMore: false },
      (wy?.artist as any)?.getAlbums(singerId, 20, 0) ?? { hotAlbums: [], hasMore: false },
    ])
    return {
      songs: songsRes.list || [],
      total: songsRes.total || 0,
      hasMore: songsRes.hasMore ?? false,
      albums: (albumsRes.hotAlbums || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        picUrl: a.picUrl || '',
        publishTime: a.publishTime || 0,
        size: a.size || 0,
      })),
      albumHasMore: albumsRes.hasMore ?? false,
    }
  } else if (source === 'kg') {
    const kg = musicSdk.kg
    const [songsRes] = await Promise.all([
      (kg?.singer as any)?.getSingerSongList(singerId, page, 30) ?? { list: [], total: 0, allPage: 1 },
    ])
    return {
      songs: songsRes.list || [],
      total: songsRes.total || 0,
      hasMore: page < (songsRes.allPage || 1),
      albums: [],
      albumHasMore: false,
    }
  }
  return { songs: [], total: 0, hasMore: false, albums: [], albumHasMore: false }
}