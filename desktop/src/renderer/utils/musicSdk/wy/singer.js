import { eapiRequest } from './utils/index'
import { formatSingerName } from '../utils'
import musicDetailApi from './musicDetail'

export default {
  /**
   * 获取歌手信息
   * @param {*} id
   */
  getInfo(id) {
    const requestObj = eapiRequest('/api/artist/head/info/get', { id })
    return requestObj.promise.then(({ body }) => {
      if (!body || body.code != 200) throw new Error('get singer info faild.')
      return {
        source: 'wy',
        id: body.artist.id,
        info: {
          name: body.artist.name,
          desc: body.artist.briefDesc,
          avatar: body.user.avatarUrl,
          gender: body.user.gender === 1 ? 'man' : 'woman',
        },
        count: {
          music: body.artist.musicSize,
          album: body.artist.albumSize,
        },
      }
    })
  },
  /**
   * 获取歌手歌曲列表
   * @param {*} id
   * @param {*} page
   * @param {*} limit
   */
  getSongList(id, page = 1, limit = 100) {
    if (page === 1) page = 0
    const requestObj = eapiRequest('/api/v1/artist/songs', {
      id,
      private_cloud: 'true',
      work_type: 1,
      order: 'hot',
      offset: limit * page,
      limit,
    })
    return requestObj.promise.then(async({ body }) => {
      if (!body.songs || body.code != 200) throw new Error('get singer song list faild.')

      const list = await musicDetailApi.getList(body.songs.map(s => s.id))
      return {
        list: list.list,
        limit,
        page,
        total: body.total,
        source: 'wy',
      }
    })
  },
  /**
   * 获取歌手专辑列表
   * @param {*} id
   * @param {*} page
   * @param {*} limit
   */
  getAlbumList(id, page = 1, limit = 10) {
    if (page === 1) page = 0
    const requestObj = eapiRequest(`/api/artist/albums/${id}`, {
      limit,
      offset: limit * page,
    })
    return requestObj.promise.then(({ body }) => {
      if (!body.hotAlbums || body.code != 200) throw new Error('get singer album list faild.')

      const list = this.filterAlbumList(body.hotAlbums)
      return {
        source: 'wy',
        list,
        limit,
        page,
        total: body.artist.albumSize,
      }
    })
  },
  filterAlbumList(raw) {
    const list = []
    raw.forEach(item => {
      if (!item.id) return
      list.push({
        id: item.id,
        count: item.size,
        info: {
          name: item.name,
          author: formatSingerName(item.artists),
          img: item.picUrl,
          desc: null,
        },
      })
    })
    return list
  },
}
