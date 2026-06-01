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

const post = (url, data, referer = 'https://music.163.com') => {
  return new Promise((resolve, reject) => {
    needle.post(url, weapi(data), {
      headers: {
        'User-Agent': userAgent,
        origin: 'https://music.163.com',
        Referer: referer,
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

const getAccount = async() => {
  const result = await post('https://music.163.com/weapi/nuser/account/get', {
    csrf_token: getCsrfToken(),
  })
  const account = result.body?.account || {}
  const profile = result.body?.profile || {}
  return {
    statusCode: result.statusCode,
    code: result.body?.code,
    uid: String(account.id ?? profile.userId ?? ''),
    nickname: profile.nickname || '',
    vipType: Number(account.vipType ?? profile.vipType ?? 0),
  }
}

const getUserPlaylists = uid => {
  return post('https://music.163.com/weapi/user/playlist', {
    uid: String(uid),
    limit: 1000,
    offset: 0,
    includeVideo: true,
    csrf_token: getCsrfToken(),
  }, `https://music.163.com/user/home?id=${uid}`)
}

const getPlaylistDetail = id => {
  return post('https://music.163.com/weapi/v3/playlist/detail', {
    id: String(id),
    n: 100000,
    s: 8,
    csrf_token: getCsrfToken(),
  })
}

const simplifyPlaylist = playlist => ({
  id: String(playlist.id || ''),
  name: playlist.name || '',
  trackCount: playlist.trackCount || 0,
  subscribed: !!playlist.subscribed,
})

const main = async() => {
  if (!cookie) throw new Error('missing wy cookie in config_v2.json')

  const account = await getAccount()
  if (!account.uid) throw new Error('missing account uid')

  const playlistResult = await getUserPlaylists(account.uid)
  const playlists = playlistResult.body?.playlist || []
  const created = playlists.filter(playlist => !playlist.subscribed)
  const subscribed = playlists.filter(playlist => playlist.subscribed)
  const detailTargets = [created[0], subscribed[0]].filter(Boolean)
  const details = []

  for (const playlist of detailTargets) {
    const detail = await getPlaylistDetail(playlist.id)
    const target = detail.body?.playlist || {}
    details.push({
      statusCode: detail.statusCode,
      code: detail.body?.code,
      id: String(playlist.id),
      name: playlist.name || '',
      trackIds: target.trackIds?.length || 0,
      tracks: target.tracks?.length || 0,
    })
  }

  console.log(JSON.stringify({
    cookie: {
      present: true,
      length: cookie.length,
      hasCsrf: !!getCsrfToken(),
    },
    account: {
      statusCode: account.statusCode,
      code: account.code,
      uidPresent: !!account.uid,
      nickname: account.nickname,
      vipType: account.vipType,
    },
    playlists: {
      statusCode: playlistResult.statusCode,
      code: playlistResult.body?.code,
      total: playlists.length,
      createdTotal: created.length,
      subscribedTotal: subscribed.length,
      createdPreview: created.slice(0, 5).map(simplifyPlaylist),
      subscribedPreview: subscribed.slice(0, 5).map(simplifyPlaylist),
    },
    details,
  }, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({
    error: err.message || String(err),
  }, null, 2))
  process.exit(1)
})
