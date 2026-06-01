import leaderboard from './leaderboard'
import { apis } from '../api-source'
import getLyric from './lyric'
import getMusicInfo from './musicInfo'
import musicSearch from './musicSearch'
import songList from './songList'
import hotSearch from './hotSearch'
import comment from './comment'
import * as apiCookie from './api-cookie'
// import tipSearch from './tipSearch'

const wy = {
  // tipSearch,
  leaderboard,
  musicSearch,
  songList,
  hotSearch,
  comment,
  getMusicUrl(songInfo, type) {
    if (!apiCookie.hasCookie()) return apis('wy').getMusicUrl(songInfo, type)

    const requestObj = apiCookie.getMusicUrl(songInfo, type)
    requestObj.promise = requestObj.promise.catch(() => apis('wy').getMusicUrl(songInfo, type).promise)
    return requestObj
  },
  getLyric(songInfo) {
    return getLyric(songInfo.songmid)
  },
  getPic(songInfo) {
    const requestObj = getMusicInfo(songInfo.songmid)
    return requestObj.promise.then(info => info.al.picUrl)
  },
  getMusicDetailPageUrl(songInfo) {
    return `https://music.163.com/#/song?id=${songInfo.songmid}`
  },
}

export default wy
