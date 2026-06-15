export interface SingerItem {
  id: string
  name: string
  picUrl: string | null
  alias: string[]
}

export interface SingerListInfo {
  list: SingerItem[]
  total: number
  page: number
  key: string | null
}

export interface State {
  list: SingerItem[]
  total: number
  page: number
  key: string | null
}

export default {
  list: [],
  total: 0,
  page: 1,
  key: null,
} as State
