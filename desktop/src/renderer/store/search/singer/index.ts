import music from '@renderer/utils/musicSdk'
import action from './action'
import state from './state'

export const search = async (text: string, page: number, source: LX.OnlineSource) => {
  const key = `${source}_${text}_${page}`

  if (state.key === key && state.list.length) {
    return { list: state.list, total: state.total }
  }

  if (source === 'wy') {
    const result = await music.wy.musicSearch.searchSinger(text, page, 20)
    const list = result.list || []
    const total = result.total || 0

    action.setList(list, total, page, key)
    return { list, total }
  }

  return { list: [], total: 0 }
}

export const getSingerDetail = async (singerId: string, source: LX.OnlineSource) => {
  if (source === 'wy') {
    const [songRes, albumRes] = await Promise.all([
      music.wy.singer.getSongList(singerId, 1, 500),
      music.wy.singer.getAlbumList(singerId, 1, 100),
    ])
    return {
      songs: songRes?.list || [],
      albums: albumRes?.list || [],
    }
  }
  return { songs: [], albums: [] }
}

export { state, action }
