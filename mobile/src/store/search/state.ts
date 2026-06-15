export type SearchType = 'music' | 'songlist' | 'singer' | 'album'

export interface InitState {
  temp_source: 'kg'
  searchType: SearchType
  searchText: string
  tipListInfo: { text: string; source: 'kg'; list: string[] }
  historyList: string[]
}

const state: InitState = {
  temp_source: 'kg',
  searchType: 'music',
  searchText: '',
  tipListInfo: { text: '', source: 'kg', list: [] },
  historyList: [],
}

export default state