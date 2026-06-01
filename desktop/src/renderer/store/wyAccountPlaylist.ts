import { reactive } from '@common/utils/vueTools'
import { appSetting } from '@renderer/store/setting'
import { deduplicationList, toNewMusicInfo } from '@renderer/utils'
import {
  addPlaylistTracks,
  createPlaylist,
  deletePlaylist,
  getAccountStatus,
  getDailyRecommendMusicList,
  getPlaylistDetail,
  getUserPlaylists,
  removePlaylistTracks,
  subscribePlaylist,
  updatePlaylist,
} from '@renderer/utils/musicSdk/wy/user'

export interface WyAccountPlaylistInfo {
  id: string
  name: string
  trackCount: number
  subscribed: boolean
  creatorName: string
}

export const WY_ACCOUNT_LIST_PREFIX = 'wy_account__'
export const WY_DAILY_RECOMMEND_LIST_ID = 'wy_daily_recommend'

export const wyAccountPlaylistState = reactive({
  list: [] as WyAccountPlaylistInfo[],
  isLoading: false,
  isLoaded: false,
  message: '',
  currentUid: '',
})

const wyAccountPlaylistMusicCache = new Map<string, LX.Music.MusicInfo[]>()
const wyDailyRecommendMusicCache: LX.Music.MusicInfo[] = []
let lastCookie = ''

export const isWyAccountListId = (id: string | null | undefined): id is string => {
  return typeof id === 'string' && id.startsWith(WY_ACCOUNT_LIST_PREFIX)
}

export const getWyAccountListId = (playlistId: string | number) => {
  return `${WY_ACCOUNT_LIST_PREFIX}${playlistId}`
}

export const isWyDailyRecommendListId = (id: string | null | undefined): id is string => {
  return id === WY_DAILY_RECOMMEND_LIST_ID
}

export const getWyPlaylistIdFromListId = (listId: string) => {
  return listId.replace(WY_ACCOUNT_LIST_PREFIX, '')
}

export const getWyAccountCachedPlaylistMusics = (listId: string | null) => {
  if (!isWyAccountListId(listId)) return []
  return wyAccountPlaylistMusicCache.get(listId) ?? []
}

export const getWyAccountPlaylistInfo = (listId: string | null) => {
  if (!isWyAccountListId(listId)) return null
  const playlistId = getWyPlaylistIdFromListId(listId)
  return getWyAccountPlaylistInfoByPlaylistId(playlistId)
}

export const getWyAccountPlaylistInfoByPlaylistId = (playlistId: string | number | null | undefined) => {
  if (playlistId == null) return null
  return wyAccountPlaylistState.list.find(item => item.id == playlistId) ?? null
}

export const getWyDailyRecommendCachedMusics = () => wyDailyRecommendMusicCache

const removeExpiredPlaylistMusicCache = (playlistIds: string[]) => {
  const listIds = new Set(playlistIds.map(getWyAccountListId))
  for (const listId of wyAccountPlaylistMusicCache.keys()) {
    if (!listIds.has(listId)) wyAccountPlaylistMusicCache.delete(listId)
  }
}

export const loadWyAccountPlaylists = async({ force = false } = {}) => {
  const targetCookie = (appSetting['common.wy_cookie'] || '').trim()
  if (!targetCookie) {
    wyAccountPlaylistState.message = window.i18n.t('setting__basic_wy_status_empty')
    wyAccountPlaylistState.list.splice(0, wyAccountPlaylistState.list.length)
    wyAccountPlaylistMusicCache.clear()
    wyDailyRecommendMusicCache.splice(0, wyDailyRecommendMusicCache.length)
    wyAccountPlaylistState.currentUid = ''
    lastCookie = ''
    wyAccountPlaylistState.isLoaded = false
    return wyAccountPlaylistState.list
  }
  if (targetCookie != lastCookie) {
    lastCookie = targetCookie
    wyAccountPlaylistState.currentUid = ''
    wyAccountPlaylistState.isLoaded = false
    wyAccountPlaylistMusicCache.clear()
    wyDailyRecommendMusicCache.splice(0, wyDailyRecommendMusicCache.length)
  }
  if (!force && wyAccountPlaylistState.isLoaded) return wyAccountPlaylistState.list

  wyAccountPlaylistState.isLoading = true
  wyAccountPlaylistState.message = ''
  try {
    if (!wyAccountPlaylistState.currentUid) {
      const account = await getAccountStatus(targetCookie)
      wyAccountPlaylistState.currentUid = account.uid
    }
    const result = await getUserPlaylists({
      uid: wyAccountPlaylistState.currentUid,
      cookie: targetCookie,
    } as any) as { list: any[] }
    const list = result.list.map((item: any) => ({
      id: String(item.id),
      name: item.name || '',
      trackCount: item.trackCount || 0,
      subscribed: !!item.subscribed,
      creatorName: item.creator?.nickname || '',
    }))
    removeExpiredPlaylistMusicCache(list.map(item => item.id))
    wyAccountPlaylistState.list.splice(0, wyAccountPlaylistState.list.length, ...list)
    wyAccountPlaylistState.isLoaded = true
    wyAccountPlaylistState.message = ''
    return wyAccountPlaylistState.list
  } catch (err) {
    wyAccountPlaylistState.message = err instanceof Error ? err.message : String(err)
    throw err
  } finally {
    wyAccountPlaylistState.isLoading = false
  }
}

export const refreshWyAccountPlaylists = async() => {
  return loadWyAccountPlaylists({ force: true })
}

export const loadWyAccountPlaylistMusics = async(listId: string) => {
  const playlistId = getWyPlaylistIdFromListId(listId)
  try {
    const detail = await getPlaylistDetail({
      id: playlistId,
      limit: 1000,
    } as any) as { list: LX.Music.MusicInfo[] }
    const list = deduplicationList(detail.list.map(musicInfo => {
      return 'meta' in musicInfo ? musicInfo : toNewMusicInfo(musicInfo)
    }) as LX.Music.MusicInfo[])
    wyAccountPlaylistMusicCache.set(listId, list)
    return list
  } catch (err) {
    const cachedList = wyAccountPlaylistMusicCache.get(listId)
    if (cachedList) return cachedList
    throw err
  }
}

export const loadWyDailyRecommendMusics = async({ force = false } = {}) => {
  const cachedList = wyDailyRecommendMusicCache
  if (!force && cachedList.length) return cachedList

  const result = await getDailyRecommendMusicList({
    limit: 1000,
  } as any) as { list: LX.Music.MusicInfo[] }
  const list = deduplicationList(result.list.map(musicInfo => {
    return 'meta' in musicInfo ? musicInfo : toNewMusicInfo(musicInfo)
  }) as LX.Music.MusicInfo[])
  wyDailyRecommendMusicCache.splice(0, wyDailyRecommendMusicCache.length, ...list)
  return wyDailyRecommendMusicCache
}

const getWyTrackIds = (musicInfos: LX.Music.MusicInfo[]) => {
  return musicInfos.map(musicInfo => String((musicInfo as any).songmid || musicInfo.meta?.songId || '')).filter(Boolean)
}

export const canAddToWyAccountPlaylist = (musicInfos: LX.Music.MusicInfo[]) => {
  return musicInfos.length > 0 && musicInfos.every(musicInfo => musicInfo.source == 'wy' && !!((musicInfo as any).songmid || musicInfo.meta?.songId))
}

export const getWritableWyAccountPlaylistTargets = () => {
  return wyAccountPlaylistState.list
    .filter(item => !item.subscribed)
    .map(item => ({
      ...item,
      id: getWyAccountListId(item.id),
      name: `网易云：${item.name}`,
      isWyAccountPlaylist: true,
    }))
}

export const addWyAccountPlaylistMusics = async(listId: string, musicInfos: LX.Music.MusicInfo[]) => {
  if (!isWyAccountListId(listId)) throw new Error('不是网易云账号歌单')

  const playlistInfo = getWyAccountPlaylistInfo(listId)
  if (playlistInfo?.subscribed) throw new Error('收藏歌单不支持添加歌曲')
  if (!canAddToWyAccountPlaylist(musicInfos)) throw new Error('当前只支持添加网易云歌曲到网易云歌单')

  const playlistId = getWyPlaylistIdFromListId(listId)
  const trackIds = getWyTrackIds(musicInfos)
  if (!trackIds.length) throw new Error('缺少网易云歌曲 ID')

  await addPlaylistTracks({
    playlistId,
    trackIds,
  } as any)

  const cachedList = wyAccountPlaylistMusicCache.get(listId)
  if (cachedList) {
    wyAccountPlaylistMusicCache.set(listId, deduplicationList([...musicInfos, ...cachedList]))
  }

  if (playlistInfo) {
    playlistInfo.trackCount += trackIds.length
  }

  return wyAccountPlaylistMusicCache.get(listId) ?? []
}

export const createWyAccountPlaylist = async(name: string) => {
  const playlist = await createPlaylist({
    name,
  } as any)

  await refreshWyAccountPlaylists()
  return playlist
}

export const updateWyAccountPlaylist = async(listId: string, name: string) => {
  if (!isWyAccountListId(listId)) throw new Error('不是网易云账号歌单')

  const playlistInfo = getWyAccountPlaylistInfo(listId)
  if (playlistInfo?.subscribed) throw new Error('收藏歌单不支持编辑')

  const playlistId = getWyPlaylistIdFromListId(listId)
  await updatePlaylist({
    id: playlistId,
    name,
  } as any)

  if (playlistInfo) playlistInfo.name = name
  return playlistInfo
}

export const deleteWyAccountPlaylist = async(listId: string) => {
  if (!isWyAccountListId(listId)) throw new Error('不是网易云账号歌单')

  const playlistInfo = getWyAccountPlaylistInfo(listId)
  if (playlistInfo?.subscribed) throw new Error('收藏歌单不支持删除')

  const playlistId = getWyPlaylistIdFromListId(listId)
  await deletePlaylist({
    id: playlistId,
  } as any)

  const index = wyAccountPlaylistState.list.findIndex(item => item.id == playlistId)
  if (index > -1) wyAccountPlaylistState.list.splice(index, 1)
  wyAccountPlaylistMusicCache.delete(listId)
}

export const subscribeWyPlaylist = async(playlistId: string | number, isSub = true) => {
  await subscribePlaylist({
    id: playlistId,
    isSub,
  } as any)

  await refreshWyAccountPlaylists()
  return getWyAccountPlaylistInfoByPlaylistId(playlistId)
}

export const unsubscribeWyAccountPlaylist = async(listId: string) => {
  if (!isWyAccountListId(listId)) throw new Error('不是网易云账号歌单')

  const playlistInfo = getWyAccountPlaylistInfo(listId)
  if (playlistInfo?.subscribed === false) throw new Error('自建歌单不能取消收藏')

  const playlistId = getWyPlaylistIdFromListId(listId)
  await subscribeWyPlaylist(playlistId, false)
  wyAccountPlaylistMusicCache.delete(listId)
}

export const removeWyAccountPlaylistMusics = async(listId: string, musicInfos: LX.Music.MusicInfo[]) => {
  if (!isWyAccountListId(listId)) throw new Error('不是网易云账号歌单')

  const playlistInfo = getWyAccountPlaylistInfo(listId)
  if (playlistInfo?.subscribed) throw new Error('收藏歌单不支持删除歌曲')

  const playlistId = getWyPlaylistIdFromListId(listId)
  const trackIds = getWyTrackIds(musicInfos)
  if (!trackIds.length) throw new Error('缺少网易云歌曲 ID')

  await removePlaylistTracks({
    playlistId,
    trackIds,
  } as any)

  const removeTrackIds = new Set(trackIds)
  const cachedList = wyAccountPlaylistMusicCache.get(listId)
  if (cachedList) {
    const nextList = cachedList.filter(musicInfo => !removeTrackIds.has(String((musicInfo as any).songmid || musicInfo.meta?.songId || '')))
    wyAccountPlaylistMusicCache.set(listId, nextList)
  }

  if (playlistInfo) {
    playlistInfo.trackCount = Math.max(0, playlistInfo.trackCount - trackIds.length)
  }

  return wyAccountPlaylistMusicCache.get(listId) ?? []
}
