import { ref, watch, computed, onBeforeUnmount } from '@common/utils/vueTools'
import { playMusicInfo, playInfo } from '@renderer/store/player/state'
import { getListMusics, setFetchingListStatus } from '@renderer/store/list/action'
import { appSetting } from '@renderer/store/setting'
import { isWyAccountListId, isWyDailyRecommendListId, loadWyAccountPlaylistMusics, loadWyDailyRecommendMusics } from '@renderer/store/wyAccountPlaylist'


export default ({ props, onLoadedList }) => {
  const rightClickSelectedIndex = ref(-1)
  const selectedIndex = ref(-1)
  const dom_listContent = ref(null)
  const listRef = ref(null)

  const excludeListIds = computed(() => ([props.listId]))


  const list = ref([])
  watch(() => props.listId, id => {
    if (isWyDailyRecommendListId(id)) {
      setFetchingListStatus(id, true)
      list.value = []
      loadWyDailyRecommendMusics({ force: true }).then(l => {
        if (id != props.listId) return
        list.value = [...l]
        onLoadedList()
      }).catch(err => {
        console.log(err)
        if (id == props.listId) list.value = []
      }).finally(() => {
        setFetchingListStatus(id, false)
      })
      return
    }

    if (isWyAccountListId(id)) {
      setFetchingListStatus(id, true)
      list.value = []
      loadWyAccountPlaylistMusics(id).then(l => {
        if (id != props.listId) return
        list.value = [...l]
        onLoadedList()
      }).catch(err => {
        console.log(err)
        if (id == props.listId) list.value = []
      }).finally(() => {
        setFetchingListStatus(id, false)
      })
      return
    }

    getListMusics(id).then(l => {
      list.value = [...l]
      if (id != props.listId) return
      onLoadedList()
    })
  }, {
    immediate: true,
  })

  const playerInfo = computed(() => ({
    isPlayList: playMusicInfo.listId == props.listId,
    playIndex: playInfo.playIndex,
  }))

  const setSelectedIndex = index => {
    selectedIndex.value = index
  }

  const isShowSource = computed(() => appSetting['list.isShowSource'])

  const handleMyListUpdate = (ids) => {
    if (!ids.includes(props.listId)) return
    getListMusics(props.listId).then(l => {
      list.value = [...l]
    })
  }

  window.app_event.on('myListUpdate', handleMyListUpdate)

  onBeforeUnmount(() => {
    window.app_event.off('myListUpdate', handleMyListUpdate)
  })

  return {
    rightClickSelectedIndex,
    selectedIndex,
    dom_listContent,
    listRef,
    list,
    playerInfo,
    setSelectedIndex,
    isShowSource,
    excludeListIds,
  }
}
