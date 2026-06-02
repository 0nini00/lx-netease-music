export interface AlbumResult {
  id: string
  name: string
  singer: string
  picUrl: string | null
  publishTime: number
  size: number
  source: LX.OnlineSource
  desc: string
}

export type Source = LX.OnlineSource | 'all'

export interface InitState {
  searchText: string
  source: Source
  sources: Source[]
  listInfos: Partial<Record<LX.OnlineSource, {
    page: number
    limit: number
    total: number
    list: AlbumResult[]
    key: string | null
  }>> & { all: {
    page: number
    limit: number
    total: number
    list: AlbumResult[]
    key: string | null
  } }
}

const state: InitState = {
  searchText: '',
  source: 'wy',
  sources: ['wy', 'kg'],
  listInfos: {
    all: {
      page: 1,
      limit: 10,
      total: 0,
      list: [],
      key: null,
    },
  },
}

export default state