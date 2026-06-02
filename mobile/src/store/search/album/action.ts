import state from './state'
import type { Source, AlbumResult } from './state'

export default {
  setSource(source: Source) {
    state.source = source
  },
  setSearchText(text: string) {
    state.searchText = text
  },
  setListInfo(source: Source, list: AlbumResult[], page: number, text: string): AlbumResult[] {
    const listInfo = source === 'all' ? state.listInfos.all : (state.listInfos[source as LX.OnlineSource] ?? state.listInfos.all)
    if (page === 1) {
      listInfo.list = list
    } else {
      listInfo.list = [...listInfo.list, ...list]
    }
    listInfo.page = page
    listInfo.total = list.length > 0 ? Math.max(list.length, listInfo.total) : listInfo.total
    listInfo.key = `${page}__${text}`
    state.source = source
    state.searchText = text
    return listInfo.list
  },
  clearListInfo(source: Source) {
    const listInfo = source === 'all' ? state.listInfos.all : (state.listInfos[source as LX.OnlineSource] ?? state.listInfos.all)
    listInfo.page = 1
    listInfo.total = 0
    listInfo.list = []
    listInfo.key = null
  },
}