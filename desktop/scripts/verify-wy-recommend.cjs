const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const needle = require('needle')

const configPath = path.join(process.env.APPDATA || '', 'Electron', 'LxDatas', 'config_v2.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const cookie = ((config.setting || {})['common.wy_cookie'] || '').trim()

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54'
const iv = Buffer.from('0102030405060708')
const presetKey = Buffer.from('0CoJUm6Qyw8W8jud')
const base62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const publicKey = '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgtQn2JZ34ZC28NWYpAUd98iZ37BUrX/aKzmFbt7clFSs6sXqHauqKWqdtLkF2KexO40H1YTX8z2lSgBBOAxLsvaklV8k4cBFK9snQXE9/DDaFt6Rr7iVZMldczhC0JNgTz+SHXT6CBHuX3e9SdB1Ua44oncaTWz7OBGLbCiK45wIDAQAB\n-----END PUBLIC KEY-----'

const aesEncrypt = (buffer, mode, key, targetIv) => {
  const cipher = crypto.createCipheriv(mode, key, targetIv)
  return Buffer.concat([cipher.update(buffer), cipher.final()])
}

const rsaEncrypt = (buffer, key) => {
  const input = Buffer.concat([Buffer.alloc(128 - buffer.length), buffer])
  return crypto.publicEncrypt({ key, padding: crypto.constants.RSA_NO_PADDING }, input)
}

const weapi = object => {
  const text = JSON.stringify(object)
  const secretKey = crypto.randomBytes(16).map(n => base62.charAt(n % 62).charCodeAt())
  return {
    params: aesEncrypt(Buffer.from(aesEncrypt(Buffer.from(text), 'aes-128-cbc', presetKey, iv).toString('base64')), 'aes-128-cbc', secretKey, iv).toString('base64'),
    encSecKey: rsaEncrypt(secretKey.reverse(), publicKey).toString('hex'),
  }
}

const getCsrfToken = () => {
  return (cookie.match(/(?:^|;\s*)__?csrf=([^;]+)/) || [])[1] || ''
}

const post = (url, data) => {
  return new Promise((resolve, reject) => {
    needle.post(url, weapi(data), {
      headers: {
        'User-Agent': userAgent,
        origin: 'https://music.163.com',
        Referer: 'https://music.163.com',
        cookie,
      },
      json: false,
      timeout: 15000,
    }, (err, resp, body) => {
      if (err) return reject(err)
      try {
        body = typeof body === 'string' ? JSON.parse(body) : body
      } catch (_) {}
      resolve({
        statusCode: resp && resp.statusCode,
        body,
      })
    })
  })
}

const main = async() => {
  if (!cookie) throw new Error('missing wy cookie in config_v2.json')

  const daily = await post('https://music.163.com/weapi/v3/discovery/recommend/songs', {
    offset: 0,
    total: true,
    limit: 10,
    csrf_token: getCsrfToken(),
  })
  const songs = daily.body?.data?.dailySongs || []
  const ids = songs.map(song => song.id).filter(Boolean).slice(0, 10)
  let detail = { statusCode: 0, body: { songs: [] } }
  if (ids.length) {
    detail = await post('https://music.163.com/weapi/v3/song/detail', {
      c: JSON.stringify(ids.map(id => ({ id }))),
      ids: JSON.stringify(ids),
    })
  }

  const playlistsResult = await post('https://music.163.com/weapi/v1/discovery/recommend/resource', {
    csrf_token: getCsrfToken(),
  })
  const playlists = playlistsResult.body?.recommend || []
  const targetPlaylist = playlists.find(playlist => playlist.id)
  const targetSong = detail.body?.songs?.[0]

  let similar = { statusCode: 0, body: { songs: [] } }
  if (targetSong?.id) {
    similar = await post('https://music.163.com/weapi/v1/discovery/simiSong', {
      songid: targetSong.id,
      limit: 10,
      offset: 0,
    })
  }

  let heartbeat = { statusCode: 0, body: { data: [] } }
  if (targetPlaylist?.id && targetSong?.id) {
    heartbeat = await post(`https://music.163.com/weapi/playmode/intelligence/list?csrf_token=${getCsrfToken()}`, {
      playlistId: targetPlaylist.id,
      songId: targetSong.id,
      type: 'fromPlayOne',
      startMusicId: targetSong.id,
      count: '20',
      csrf_token: getCsrfToken(),
    })
  }
  const heartbeatIds = (heartbeat.body?.data || []).map(item => item.id || item.songInfo?.id).filter(Boolean)

  console.log(JSON.stringify({
    cookie: {
      present: true,
      length: cookie.length,
      hasCsrf: !!getCsrfToken(),
    },
    dailySongs: {
      statusCode: daily.statusCode,
      code: daily.body?.code,
      total: songs.length,
      detailCode: detail.body?.code,
      detailTotal: detail.body?.songs?.length || 0,
      preview: (detail.body?.songs || []).slice(0, 5).map(song => song.name),
    },
    dailyPlaylists: {
      statusCode: playlistsResult.statusCode,
      code: playlistsResult.body?.code,
      total: playlists.length,
      preview: playlists.slice(0, 5).map(playlist => ({
        name: playlist.name,
        trackCount: playlist.trackCount || playlist.songCount || 0,
      })),
    },
    similarSongs: {
      sourceSong: targetSong?.name || '',
      statusCode: similar.statusCode,
      code: similar.body?.code,
      total: similar.body?.songs?.length || 0,
      preview: (similar.body?.songs || []).slice(0, 5).map(song => song.name),
    },
    heartbeat: {
      sourcePlaylist: targetPlaylist?.name || '',
      sourceSong: targetSong?.name || '',
      statusCode: heartbeat.statusCode,
      code: heartbeat.body?.code,
      total: heartbeatIds.length,
      previewIds: heartbeatIds.slice(0, 5),
    },
  }, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({
    error: err.message || String(err),
  }, null, 2))
  process.exit(1)
})
