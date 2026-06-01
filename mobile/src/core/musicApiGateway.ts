import settingState from '@/store/setting/state'
import { httpFetch } from '@/utils/request'

const providerMap: Partial<Record<LX.Source, string>> = {
  wy: 'netease',
  tx: 'qqmusic',
  kg: 'kugou',
}

const qualityMap: Partial<Record<LX.Quality, string>> = {
  '128k': 'MP3_128',
  '320k': 'MP3_320',
  flac: 'FLAC',
  hires: 'FLAC_24',
  master: 'FLAC_24',
}

const fallbackQualityMap: Partial<Record<LX.Quality, string[]>> = {
  master: ['FLAC_24', 'FLAC', 'MP3_320', 'MP3_128'],
  hires: ['FLAC_24', 'FLAC', 'MP3_320', 'MP3_128'],
  flac: ['FLAC', 'MP3_320', 'MP3_128'],
  '320k': ['MP3_320', 'MP3_128'],
  '128k': ['MP3_128'],
}

const trimSlash = (value: string) => value.replace(/\/+$/, '')
const joinUrl = (baseUrl: string, path: string) => `${trimSlash(baseUrl)}/${path.replace(/^\/+/, '')}`
const encodeQuery = (value: string) => encodeURIComponent(value).replace(/%20/g, '+')

const normalizeAuthValue = (headerName: string, headerValue: string) => {
  if (headerName.toLowerCase() != 'authorization') return headerValue
  return /^bearer\s+/i.test(headerValue) ? headerValue : `Bearer ${headerValue}`
}

const getHeaders = () => {
  const headerValue = settingState.setting['common.music_api_gateway_header_value'].trim()
  const headerName = settingState.setting['common.music_api_gateway_header_name'].trim() || 'X-API-Key'
  return headerValue
    ? { [headerName]: normalizeAuthValue(headerName, headerValue) }
    : {}
}

const getResponseBody = async(url: string) => {
  const resp = await (httpFetch(url, {
    method: 'get',
    headers: getHeaders(),
    timeout: 15000,
  }) as any).promise

  if (resp.statusCode >= 300 && resp.statusCode < 400) {
    throw new Error(`HTTP ${resp.statusCode}: redirected, check gateway URL and Authorization header`)
  }
  if (resp.statusCode < 200 || resp.statusCode >= 300) {
    throw new Error(`HTTP ${resp.statusCode}`)
  }
  return resp.body
}

const getMusicId = (musicInfo: LX.Music.MusicInfoOnline) => {
  switch (musicInfo.source) {
    case 'wy':
      return musicInfo.meta.songId
    case 'tx':
      return musicInfo.meta.songId ?? musicInfo.meta.id ?? musicInfo.meta.strMediaMid
    case 'kg':
      return musicInfo.meta.hash ?? musicInfo.meta.songId
    default:
      return musicInfo.meta.songId
  }
}

const getAudioUrlFromBody = (body: any) => {
  const url = body?.data?.audio?.url ?? body?.data?.url ?? body?.url
  if (typeof url != 'string' || !/^https?:\/\//.test(url)) {
    throw new Error('music api gateway response has no playable url')
  }
  return url
}

const getSearchItems = (body: any) => {
  const items = body?.data?.items ?? body?.data?.list ?? body?.items ?? body?.list
  return Array.isArray(items) ? items : []
}

const normalizeName = (value: string) => value.toLowerCase().replace(/\s+/g, '')

const pickSearchItem = (items: any[], musicInfo: LX.Music.MusicInfoOnline) => {
  const targetName = normalizeName(musicInfo.name)
  const targetSinger = normalizeName(musicInfo.singer || '')
  return items.find(item => {
    const name = normalizeName(item.title || item.name || '')
    const artist = normalizeName(item.artist || item.singer || item.artists?.join?.('') || '')
    return name == targetName && (!targetSinger || artist.includes(targetSinger) || targetSinger.includes(artist))
  }) ?? items[0]
}

const getProvider = (source: LX.Source) => {
  const provider = providerMap[source]
  if (!provider) throw new Error('music api gateway does not support this source')
  return provider
}

const getBaseUrl = () => {
  const baseUrl = settingState.setting['common.music_api_gateway_url'].trim()
  if (!baseUrl) throw new Error('music api gateway url is empty')
  return baseUrl
}

const getQualityCandidates = (quality: LX.Quality) => fallbackQualityMap[quality] ?? [qualityMap[quality] ?? 'MP3_128']

const requestMusicUrlById = async({ provider, id, quality }: {
  provider: string
  id: string | number
  quality: string
}) => {
  const url = joinUrl(getBaseUrl(), `/${provider}/songs/${encodeURIComponent(String(id))}/url?quality=${encodeURIComponent(quality)}`)
  return getAudioUrlFromBody(await getResponseBody(url))
}

const searchMusicId = async({ provider, musicInfo }: {
  provider: string
  musicInfo: LX.Music.MusicInfoOnline
}) => {
  const query = [musicInfo.name, musicInfo.singer].filter(Boolean).join(' ')
  const url = joinUrl(getBaseUrl(), `/${provider}/search/songs?q=${encodeQuery(query)}&page=1&page_size=5`)
  const item = pickSearchItem(getSearchItems(await getResponseBody(url)), musicInfo)
  const id = item?.id ?? item?.songId ?? item?.songmid ?? item?.hash
  if (id == null || id === '') throw new Error('music api gateway search returned no matched song')
  return id
}

export const isMusicApiGatewayEnabled = () => {
  const setting = settingState.setting
  const useGateway = Object.prototype.hasOwnProperty.call(setting, 'common.music_play_use_gateway')
    ? setting['common.music_play_use_gateway']
    : setting['common.music_api_gateway_enable']

  return !!(useGateway && setting['common.music_api_gateway_url'].trim())
}

export const getMusicApiGatewayUrl = async({ musicInfo, quality }: {
  musicInfo: LX.Music.MusicInfoOnline
  quality: LX.Quality
}) => {
  if (!isMusicApiGatewayEnabled()) throw new Error('music api gateway is disabled')

  const provider = getProvider(musicInfo.source)
  const directId = getMusicId(musicInfo)
  let lastError: unknown

  for (const targetQuality of getQualityCandidates(quality)) {
    if (directId) {
      try {
        return {
          url: await requestMusicUrlById({ provider, id: directId, quality: targetQuality }),
          quality,
        }
      } catch (err) {
        lastError = err
      }
    }

    try {
      const searchId = await searchMusicId({ provider, musicInfo })
      return {
        url: await requestMusicUrlById({ provider, id: searchId, quality: targetQuality }),
        quality,
      }
    } catch (err) {
      lastError = err
    }
  }

  throw lastError instanceof Error ? lastError : new Error('music api gateway failed')
}

export const testMusicApiGateway = async() => {
  const provider = getProvider('wy')
  const body = await getResponseBody(joinUrl(getBaseUrl(), `/${provider}/search/songs?q=${encodeQuery('周杰伦')}&page=1&page_size=1`))
  if (!getSearchItems(body).length) throw new Error('music api gateway test returned empty result')
}
