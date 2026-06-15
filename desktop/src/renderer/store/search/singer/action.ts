import state, { type SingerItem } from './state'

export default {
  setList(list: SingerItem[], total: number, page: number, key: string) {
    state.list = list
    state.total = total
    state.page = page
    state.key = key
  },

  clearList() {
    state.list = []
    state.total = 0
    state.page = 1
    state.key = null
  },
}
