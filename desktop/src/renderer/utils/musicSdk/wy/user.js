import { httpFetch } from '../../request'
import { appSetting } from '@renderer/store/setting'
import { weapi } from './utils/crypto'
import musicDetailApi from './musicDetail'

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54'

const getCookie = cookie => (cookie ?? appSetting['common.wy_cookie'] ?? '').trim()

const getCsrfToken = cookie => {
  return (cookie.match(/(?:^|;\s*)__?csrf=([^;]+)/) || [])[1] || ''
}

export const hasCookie = cookie => !!getCookie(cookie)

export const getAccountStatus = (cookie = appSetting['common.wy_cookie']) => {
  const targetCookie = getCookie(cookie)
  if (!targetCookie) return Promise.reject(new Error('未设置网易云 Cookie'))

  const requestObj = httpFetch('https://music.163.com/weapi/nuser/account/get', {
    method: 'post',
    headers: {
      'User-Agent': userAgent,
      origin: 'https://music.163.com',
      Referer: 'https://music.163.com',
      cookie: targetCookie,
    },
    form: weapi({
      csrf_token: getCsrfToken(targetCookie),
    }),
  })

  return requestObj.promise.then(({ body, statusCode }) => {
    if (statusCode !== 200 || body.code !== 200) {
      throw new Error(body.message || '网易云账号检查失败')
    }
    if (!body.account) throw new Error('登录已过期或 Cookie 无效')

    const profile = body.profile || {}
    const vipType = Number(body.account.vipType ?? profile.vipType ?? 0)

    return {
      uid: String(body.account.id ?? profile.userId ?? ''),
      nickname: profile.nickname || '',
      avatarUrl: profile.avatarUrl || '',
      vipType,
      isVip: vipType > 0,
    }
  })
}

export const getLikedSongIds = async({ uid, cookie = appSetting['common.wy_cookie'] } = {}) => {
  const targetCookie = getCookie(cookie)
  if (!targetCookie) throw new Error('未设置网易云 Cookie')

  let targetUid = uid
  if (!targetUid) {
    const account = await getAccountStatus(targetCookie)
    targetUid = account.uid
  }

  const requestObj = httpFetch('https://music.163.com/weapi/song/like/get', {
    method: 'post',
    headers: {
      'User-Agent': userAgent,
      origin: 'https://music.163.com',
      Referer: 'https://music.163.com',
      cookie: targetCookie,
    },
    form: weapi({
      uid: String(targetUid),
      csrf_token: getCsrfToken(targetCookie),
    }),
  })

  const { body, statusCode } = await requestObj.promise
  if (statusCode !== 200 || body.code !== 200) {
    throw new Error(body.message || '获取喜欢歌曲列表失败')
  }

  return body.ids || []
}

export const getLikedMusicList = async({ uid, cookie = appSetting['common.wy_cookie'], limit = 30 } = {}) => {
  const ids = await getLikedSongIds({ uid, cookie })
  if (!ids.length) {
    return {
      ids,
      list: [],
      total: 0,
      source: 'wy',
    }
  }

  const limitedIds = ids.slice(0, limit)
  const { list } = await musicDetailApi.getList(limitedIds)

  return {
    ids,
    list,
    total: ids.length,
    source: 'wy',
  }
}

export const getDailyRecommendMusicList = async({
  cookie = appSetting['common.wy_cookie'],
  limit = 30,
} = {}) => {
  const targetCookie = getCookie(cookie)
  if (!targetCookie) throw new Error('未设置网易云 Cookie')

  const requestObj = httpFetch('https://music.163.com/weapi/v3/discovery/recommend/songs', {
    method: 'post',
    headers: {
      'User-Agent': userAgent,
      origin: 'https://music.163.com',
      Referer: 'https://music.163.com',
      cookie: targetCookie,
    },
    form: weapi({
      offset: 0,
      total: true,
      limit,
      csrf_token: getCsrfToken(targetCookie),
    }),
  })

  const { body, statusCode } = await requestObj.promise
  if (statusCode !== 200 || body.code !== 200 || !body.data) {
    throw new Error(body.message || '获取每日推荐失败')
  }

  const songs = body.data.dailySongs || []
  const ids = songs.map(song => song.id).filter(Boolean).slice(0, limit)
  let list = []
  if (ids.length) {
    const detail = await musicDetailApi.getList(ids)
    list = detail.list
  }

  return {
    list,
    total: songs.length,
    source: 'wy',
  }
}

export const getDailyRecommendPlaylists = async({
  cookie = appSetting['common.wy_cookie'],
} = {}) => {
  const targetCookie = getCookie(cookie)
  if (!targetCookie) throw new Error('未设置网易云 Cookie')

  const requestObj = httpFetch('https://music.163.com/weapi/v1/discovery/recommend/resource', {
    method: 'post',
    headers: {
      'User-Agent': userAgent,
      origin: 'https://music.163.com',
      Referer: 'https://music.163.com',
      cookie: targetCookie,
    },
    form: weapi({
      csrf_token: getCsrfToken(targetCookie),
    }),
  })

  const { body, statusCode } = await requestObj.promise
  if (statusCode !== 200 || body.code !== 200) {
    throw new Error(body.message || '获取每日推荐歌单失败')
  }

  return {
    list: body.recommend || [],
    total: body.recommend?.length ?? 0,
    source: 'wy',
  }
}

export const getSimilarMusicList = async({
  songId,
  cookie = appSetting['common.wy_cookie'],
  limit = 10,
  offset = 0,
} = {}) => {
  const targetCookie = getCookie(cookie)
  if (!targetCookie) throw new Error('未设置网易云 Cookie')
  if (!songId) throw new Error('缺少网易云歌曲 ID')

  const requestObj = httpFetch('https://music.163.com/weapi/v1/discovery/simiSong', {
    method: 'post',
    headers: {
      'User-Agent': userAgent,
      origin: 'https://music.163.com',
      Referer: 'https://music.163.com',
      cookie: targetCookie,
    },
    form: weapi({
      songid: songId,
      limit,
      offset,
    }),
  })

  const { body, statusCode } = await requestObj.promise
  if (statusCode !== 200 || body.code !== 200) {
    throw new Error(body.message || '获取相似歌曲失败')
  }

  const songs = body.songs || []
  const ids = songs.map(song => song.id).filter(Boolean).slice(0, limit)
  let list = []
  if (ids.length) {
    const detail = await musicDetailApi.getList(ids)
    list = detail.list
  }

  return {
    list,
    total: songs.length,
    source: 'wy',
  }
}

export const getHeartbeatModeMusicList = async({
  playlistId,
  songId,
  cookie = appSetting['common.wy_cookie'],
  count = 150,
} = {}) => {
  const targetCookie = getCookie(cookie)
  if (!targetCookie) throw new Error('未设置网易云 Cookie')
  if (!playlistId) throw new Error('缺少网易云歌单 ID')
  if (!songId) throw new Error('缺少网易云歌曲 ID')

  const csrfToken = getCsrfToken(targetCookie)
  const requestObj = httpFetch(`https://music.163.com/weapi/playmode/intelligence/list?csrf_token=${csrfToken}`, {
    method: 'post',
    headers: {
      'User-Agent': userAgent,
      origin: 'https://music.163.com',
      Referer: 'https://music.163.com',
      cookie: targetCookie,
    },
    form: weapi({
      playlistId,
      songId,
      type: 'fromPlayOne',
      startMusicId: songId,
      count: String(count),
      csrf_token: csrfToken,
    }),
  })

  const { body, statusCode } = await requestObj.promise
  if (statusCode !== 200 || body.code !== 200) {
    throw new Error(body.message || '获取心动模式列表失败')
  }

  const ids = (body.data || []).map(item => item.id || item.songInfo?.id).filter(Boolean)
  if (!ids.length) {
    return {
      list: [],
      total: 0,
      source: 'wy',
    }
  }

  const detail = await musicDetailApi.getList(ids.slice(0, count))
  return {
    list: detail.list,
    total: ids.length,
    source: 'wy',
  }
}

export const getUserPlaylists = async({
  uid,
  cookie = appSetting['common.wy_cookie'],
  limit = 1000,
  offset = 0,
} = {}) => {
  const targetCookie = getCookie(cookie)
  if (!targetCookie) throw new Error('未设置网易云 Cookie')

  let targetUid = uid
  if (!targetUid) {
    const account = await getAccountStatus(targetCookie)
    targetUid = account.uid
  }

  const requestObj = httpFetch('https://music.163.com/weapi/user/playlist', {
    method: 'post',
    headers: {
      'User-Agent': userAgent,
      origin: 'https://music.163.com',
      Referer: `https://music.163.com/user/home?id=${targetUid}`,
      cookie: targetCookie,
    },
    form: weapi({
      uid: String(targetUid),
      limit,
      offset,
      includeVideo: true,
      csrf_token: getCsrfToken(targetCookie),
    }),
  })

  const { body, statusCode } = await requestObj.promise
  if (statusCode !== 200 || body.code !== 200) {
    throw new Error(body.message || '获取用户歌单失败')
  }

  return {
    list: body.playlist || [],
    total: body.playlist?.length ?? 0,
    more: !!body.more,
    source: 'wy',
  }
}

export const getPlaylistDetail = async({
  id,
  cookie = appSetting['common.wy_cookie'],
  page = 1,
  limit = 1000,
} = {}) => {
  const targetCookie = getCookie(cookie)
  if (!targetCookie) throw new Error('未设置网易云 Cookie')
  if (!id) throw new Error('缺少网易云歌单 ID')

  const requestObj = httpFetch('https://music.163.com/weapi/v3/playlist/detail', {
    method: 'post',
    headers: {
      'User-Agent': userAgent,
      origin: 'https://music.163.com',
      Referer: 'https://music.163.com',
      cookie: targetCookie,
    },
    form: weapi({
      id: String(id),
      n: 100000,
      s: 8,
      csrf_token: getCsrfToken(targetCookie),
    }),
  })

  const { body, statusCode } = await requestObj.promise
  if (statusCode !== 200 || body.code !== 200) {
    throw new Error(body.message || '获取歌单详情失败')
  }

  const playlist = body.playlist || {}
  const trackIds = playlist.trackIds || []
  const rangeStart = (page - 1) * limit
  const ids = trackIds.slice(rangeStart, limit * page).map(track => track.id)
  let list = []

  // Some subscribed playlists only return the first 20 tracks in `playlist.tracks`.
  // Only trust the embedded tracks when they match the full trackIds length.
  if (
    playlist.tracks?.length &&
    playlist.tracks.length === trackIds.length &&
    playlist.tracks.length === body.privileges?.length
  ) {
    list = musicDetailApi.filterList({
      songs: playlist.tracks,
      privileges: body.privileges,
    })
  } else if (ids.length) {
    const detail = await musicDetailApi.getList(ids)
    list = detail.list
  }

  return {
    list,
    page,
    limit,
    total: trackIds.length,
    source: 'wy',
    info: {
      id: String(playlist.id || id),
      name: playlist.name || '',
      img: playlist.coverImgUrl || '',
      desc: playlist.description || '',
      author: playlist.creator?.nickname || '',
      userId: playlist.userId,
      trackCount: playlist.trackCount ?? trackIds.length,
      subscribed: !!playlist.subscribed,
    },
  }
}

export const createPlaylist = async({
  name,
  privacy = '10',
  cookie = appSetting['common.wy_cookie'],
} = {}) => {
  const targetCookie = getCookie(cookie)
  if (!targetCookie) throw new Error('未设置网易云 Cookie')
  if (!name?.trim()) throw new Error('缺少网易云歌单名称')

  const requestObj = httpFetch('https://music.163.com/weapi/playlist/create', {
    method: 'post',
    headers: {
      'User-Agent': userAgent,
      origin: 'https://music.163.com',
      Referer: 'https://music.163.com',
      cookie: targetCookie,
    },
    form: weapi({
      name: name.trim(),
      privacy,
      type: 'NORMAL',
      csrf_token: getCsrfToken(targetCookie),
    }),
  })

  const { body, statusCode } = await requestObj.promise
  if (statusCode !== 200 || body.code !== 200) {
    throw new Error(body.message || '创建歌单失败')
  }

  return body.playlist
}

export const deletePlaylist = async({
  id,
  cookie = appSetting['common.wy_cookie'],
} = {}) => {
  const targetCookie = getCookie(cookie)
  if (!targetCookie) throw new Error('未设置网易云 Cookie')
  if (!id) throw new Error('缺少网易云歌单 ID')

  const requestObj = httpFetch('https://music.163.com/weapi/playlist/remove', {
    method: 'post',
    headers: {
      'User-Agent': userAgent,
      origin: 'https://music.163.com',
      Referer: 'https://music.163.com',
      cookie: targetCookie,
    },
    form: weapi({
      ids: `[${String(id)}]`,
      csrf_token: getCsrfToken(targetCookie),
    }),
  })

  const { body, statusCode } = await requestObj.promise
  if (statusCode !== 200 || body.code !== 200) {
    throw new Error(body.message || '删除歌单失败')
  }

  return body
}

export const updatePlaylist = async({
  id,
  name,
  desc,
  cookie = appSetting['common.wy_cookie'],
} = {}) => {
  const targetCookie = getCookie(cookie)
  if (!targetCookie) throw new Error('未设置网易云 Cookie')
  if (!id) throw new Error('缺少网易云歌单 ID')
  if (!name?.trim()) throw new Error('缺少网易云歌单名称')

  const requestData = {
    '/api/playlist/update/name': JSON.stringify({ id: Number(id), name: name.trim() }),
    csrf_token: getCsrfToken(targetCookie),
  }
  if (desc != null) {
    requestData['/api/playlist/desc/update'] = JSON.stringify({ id: Number(id), desc })
  }

  const requestObj = httpFetch('https://music.163.com/weapi/batch', {
    method: 'post',
    headers: {
      'User-Agent': userAgent,
      origin: 'https://music.163.com',
      Referer: 'https://music.163.com',
      cookie: targetCookie,
    },
    form: weapi(requestData),
  })

  const { body, statusCode } = await requestObj.promise
  if (statusCode !== 200 || body.code !== 200) {
    throw new Error(body.message || '编辑歌单失败')
  }

  return body
}

export const subscribePlaylist = async({
  id,
  isSub = true,
  cookie = appSetting['common.wy_cookie'],
} = {}) => {
  const targetCookie = getCookie(cookie)
  if (!targetCookie) throw new Error('未设置网易云 Cookie')
  if (!id) throw new Error('缺少网易云歌单 ID')

  const action = isSub ? 'subscribe' : 'unsubscribe'
  const requestObj = httpFetch(`https://music.163.com/weapi/playlist/${action}`, {
    method: 'post',
    headers: {
      'User-Agent': userAgent,
      origin: 'https://music.163.com',
      Referer: 'https://music.163.com',
      cookie: targetCookie,
    },
    form: weapi({
      id: String(id),
      csrf_token: getCsrfToken(targetCookie),
    }),
  })

  const { body, statusCode } = await requestObj.promise
  if (statusCode !== 200 || body.code !== 200) {
    throw new Error(body.message || '歌单收藏操作失败')
  }

  return body
}

export const manipulatePlaylistTracks = async({
  op,
  playlistId,
  trackIds,
  cookie = appSetting['common.wy_cookie'],
} = {}) => {
  const targetCookie = getCookie(cookie)
  if (!targetCookie) throw new Error('未设置网易云 Cookie')
  if (!playlistId) throw new Error('缺少网易云歌单 ID')
  if (op !== 'add' && op !== 'del') throw new Error('不支持的网易云歌单操作')

  const ids = (Array.isArray(trackIds) ? trackIds : [trackIds]).map(id => String(id)).filter(Boolean)
  if (!ids.length) throw new Error('缺少网易云歌曲 ID')

  const buildRequestData = targetIds => ({
    op,
    pid: String(playlistId),
    trackIds: JSON.stringify(targetIds),
    imme: 'true',
    csrf_token: getCsrfToken(targetCookie),
  })
  const request = requestData => httpFetch('https://music.163.com/weapi/playlist/manipulate/tracks', {
    method: 'post',
    headers: {
      'User-Agent': userAgent,
      origin: 'https://music.163.com',
      Referer: 'https://music.163.com',
      cookie: targetCookie,
    },
    form: weapi(requestData),
  }).promise

  let { body, statusCode } = await request(buildRequestData(ids))
  if (op == 'add' && body.code === 512) {
    ;({ body, statusCode } = await request(buildRequestData([...ids, ...ids])))
  }
  if (statusCode !== 200 || (body.code !== 200 && body.code !== 201)) {
    throw new Error(body.message || '网易云歌单歌曲操作失败')
  }
  return body
}

export const removePlaylistTracks = async({
  playlistId,
  trackIds,
  cookie = appSetting['common.wy_cookie'],
} = {}) => {
  return manipulatePlaylistTracks({
    op: 'del',
    playlistId,
    trackIds,
    cookie,
  })
}

export const addPlaylistTracks = async({
  playlistId,
  trackIds,
  cookie = appSetting['common.wy_cookie'],
} = {}) => {
  return manipulatePlaylistTracks({
    op: 'add',
    playlistId,
    trackIds,
    cookie,
  })
}
