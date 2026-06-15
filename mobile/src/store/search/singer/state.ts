export interface SingerResult {
  id: string
  name: string
  picUrl: string | null
  desc: string
  source: LX.OnlineSource
}

export interface SingerDetailData {
  songs: LX.Music.MusicInfoOnline[]
  total: number
  hasMore: boolean
  albums: Array<{
    id: string | number
    name: string
    picUrl: string
    publishTime: number
    size: number
    source: LX.OnlineSource
  }>
  albumHasMore: boolean
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
    list: SingerResult[]
    key: string | null
    detailData: SingerDetailData | null
  }>> & { all: {
    page: number
    limit: number
    total: number
    list: SingerResult[]
    key: string | null
    detailData: SingerDetailData | null
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
      detailData: null,
    },
  },
}

export default state
