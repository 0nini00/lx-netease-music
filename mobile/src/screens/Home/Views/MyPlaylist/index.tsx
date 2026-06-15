import { memo, useEffect, useState, useCallback, useRef } from 'react'
import { View, FlatList, RefreshControl, BackHandler, StyleSheet, Keyboard, TouchableOpacity } from 'react-native'
import ListItem from './ListItem'
import wyApi from '@/utils/musicSdk/wy/user'
import wyDailyRecApi from '@/utils/musicSdk/wy/dailyRec'
import wyMusicDetailApi from '@/utils/musicSdk/wy/musicDetail'
import { playOnlineList } from '@/core/list'
import { LIST_IDS, MUSIC_TOGGLE_MODE } from '@/config/constant'
import { updateSetting } from '@/core/common'
import { useWySubscribedPlaylists, useWyUid } from '@/store/user/hook.ts'
import userState from '@/store/user/state'
import { useSettingValue } from '@/store/setting/hook'
import { toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import SonglistDetail from '../../../SonglistDetail'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Input from '@/components/common/Input'
import { type ListInfoItem } from '@/store/songlist/state'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import listState from '@/store/list/state'
import { setWySubscribedPlaylists } from '@/store/user/action.ts'
import MusicInfoOnline = LX.Music.MusicInfoOnline

type OverlayView = null
type PlaylistGroup = 'created' | 'subscribed'

export default memo(() => {
  const playlists = useWySubscribedPlaylists()
  const uid = useWyUid()
  const [loading, setLoading] = useState(true)
  const cookie = useSettingValue('common.wy_cookie')
  const theme = useTheme()
  const [selectedPlaylist, setSelectedPlaylist] = useState<ListInfoItem | null>(null)
  const [overlayView, setOverlayView] = useState<OverlayView>(null)
  const [scrollToMusicInfo, setScrollToMusicInfo] = useState<MusicInfoOnline | null>(null)
  const [activeGroup, setActiveGroup] = useState<PlaylistGroup>('created')
  const [createVisible, setCreateVisible] = useState(false)
  const [createName, setCreateName] = useState('')
  const [creating, setCreating] = useState(false)
  const selectedPlaylistRef = useRef(selectedPlaylist)
  const overlayViewRef = useRef<OverlayView>(overlayView)
  const createAlertRef = useRef<ConfirmAlertType>(null)
  selectedPlaylistRef.current = selectedPlaylist
  overlayViewRef.current = overlayView

  const loadPlaylists = useCallback((showErrorPrefix: string) => {
    if (!cookie || !uid) {
      setLoading(false)
      setWySubscribedPlaylists([])
      return Promise.resolve()
    }
    setLoading(true)
    return wyApi.getUserPlaylists(uid, cookie)
      .then((playlists: any) => {
        setWySubscribedPlaylists(playlists)
      })
      .catch((err: any) => {
        toast(`${showErrorPrefix}: ${err.message}`)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [cookie, uid])

  useEffect(() => {
    const handleJumpPosition = async () => {
      let listId = playerState.playMusicInfo.listId
      if (listId === LIST_IDS.TEMP) listId = listState.tempListMeta.id
      if (!listId) return
      if (!listId.startsWith('wy__')) return

      const playlistId = listId.replace('wy__', '')
      const targetPlaylist = playlists.find(p => String(p.id) === playlistId)
      if (!targetPlaylist) return

      const playlistInfo: ListInfoItem = {
        id: String(targetPlaylist.id),
        name: targetPlaylist.name,
        author: targetPlaylist.creator?.nickname ?? '',
        img: targetPlaylist.coverImgUrl,
        play_count: targetPlaylist.playCount ? String(targetPlaylist.playCount) : undefined,
        desc: targetPlaylist.description,
        source: 'wy',
        userId: targetPlaylist.userId,
        total: targetPlaylist.trackCount,
      }
      if (!playerState.playMusicInfo.musicInfo) return
      const musicInfo = 'progress' in playerState.playMusicInfo.musicInfo
        ? playerState.playMusicInfo.musicInfo.metadata.musicInfo
        : playerState.playMusicInfo.musicInfo
      if (musicInfo) setScrollToMusicInfo(musicInfo as MusicInfoOnline)
      setSelectedPlaylist(playlistInfo)
      setOverlayView(null)
    }

    global.app_event.on('jumpListPosition', handleJumpPosition)
    return () => {
      global.app_event.off('jumpListPosition', handleJumpPosition)
    }
  }, [playlists])

  useEffect(() => {
    if (!cookie || !uid) {
      setLoading(false)
      setWySubscribedPlaylists([])
      return
    }
    if (playlists.length > 0) {
      setLoading(false)
      return
    }
    void loadPlaylists('获取歌单失败')
  }, [cookie, uid, playlists.length, loadPlaylists])

  const onRefresh = useCallback(() => {
    void loadPlaylists('刷新歌单失败')
  }, [loadPlaylists])

  useEffect(() => {
    const handleRefresh = () => {
      void loadPlaylists('刷新歌单失败')
    }
    global.app_event.on('wyPlaylistsRefresh', handleRefresh)
    return () => {
      global.app_event.off('wyPlaylistsRefresh', handleRefresh)
    }
  }, [loadPlaylists])

  useEffect(() => {
    const onBackPress = () => {
      if (selectedPlaylistRef.current || overlayViewRef.current) {
        if (commonState.componentIds.length > 1) return false
        setSelectedPlaylist(null)
        setOverlayView(null)
        setScrollToMusicInfo(null)
        return true
      }
      return false
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => subscription.remove()
  }, [])

  const handleItemPress = useCallback((playlistInfo: ListInfoItem) => {
    setSelectedPlaylist(playlistInfo)
    setOverlayView(null)
  }, [])

  const handleHeartbeatPress = useCallback(async (playlistInfo: ListInfoItem) => {
    if (!cookie || !uid) return
    try {
      toast('正在开启心动模式...')
      let ids = Array.from(userState.wy_liked_song_ids)
      if (!ids.length) ids = (await wyApi.getLikedSongList(uid, cookie)).map(String)
      if (!ids.length) {
        toast('没有喜欢的歌曲')
        return
      }

      const randomSongId = ids[Math.floor(Math.random() * ids.length)]
      const musicInfoRes = await wyMusicDetailApi.getList([randomSongId])
      const mInfo = musicInfoRes.list[0]
      if (!mInfo) {
        toast('获取歌曲详情失败')
        return
      }

      const res = await wyDailyRecApi.getHeartbeatModeList(cookie, playlistInfo.id, randomSongId)
      const heartbeatList = [mInfo, ...res.list].filter(Boolean) as any[]
      updateSetting({ 'player.togglePlayMethod': MUSIC_TOGGLE_MODE.heartbeat })
      playOnlineList('heartbeat', heartbeatList, 0, false)
      toast('心动模式已开启')
    } catch (err: any) {
      toast(`开启心动模式失败: ${err.message}`)
    }
  }, [cookie, uid])

  const handleBack = useCallback(() => {
    setSelectedPlaylist(null)
    setOverlayView(null)
    setScrollToMusicInfo(null)
  }, [])

  const handleOpenCreate = useCallback(() => {
    setCreateName('')
    setCreateVisible(true)
    requestAnimationFrame(() => {
      createAlertRef.current?.setVisible(true)
    })
  }, [])

  const handleCreatePlaylist = useCallback(() => {
    const name = createName.trim()
    if (!name) {
      toast('歌单名不能为空')
      return
    }
    if (creating) return
    setCreating(true)
    wyApi.createPlaylist(name)
      .then(() => {
        toast('创建成功')
        setActiveGroup('created')
        createAlertRef.current?.setVisible(false)
        return loadPlaylists('刷新歌单失败')
      })
      .catch((err: any) => {
        toast(`创建失败: ${err.message}`)
      })
      .finally(() => {
        setCreating(false)
      })
  }, [createName, creating, loadPlaylists])

  const createdPlaylists = playlists.filter(item => String(item.userId) == String(uid))
  const subscribedPlaylists = playlists.filter(item => String(item.userId) != String(uid))
  const currentPlaylists = activeGroup == 'created' ? createdPlaylists : subscribedPlaylists

  if (!cookie) {
    return (
      <View style={styles.centerEmpty}>
        <Text>请先设置网易云 Cookie</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[{ flex: 1 }, selectedPlaylist || overlayView ? { opacity: 0 } : null]} pointerEvents={selectedPlaylist || overlayView ? 'none' : 'auto'}>
        <View style={[styles.sectionHeader, { borderBottomColor: theme['c-border-background'] }]}>
          <Text size={15}>网易云歌单</Text>
          <View style={styles.sectionActions}>
            <TouchableOpacity style={[styles.sectionBtn, { borderColor: theme['c-border-background'] }]} onPress={handleOpenCreate}>
              <Text size={12}>新建</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sectionBtn, { borderColor: theme['c-border-background'] }]} onPress={onRefresh}>
              <Text size={12}>刷新</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.groupTabs, { borderBottomColor: theme['c-border-background'] }]}>
          <TouchableOpacity
            style={[styles.groupTab, activeGroup == 'created' ? { borderBottomColor: theme['c-primary-font-active'] } : { borderBottomColor: 'transparent' }]}
            onPress={() => setActiveGroup('created')}
          >
            <Text size={13} color={activeGroup == 'created' ? theme['c-primary-font'] : theme['c-font-label']}>
              自建歌单 {createdPlaylists.length}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.groupTab, activeGroup == 'subscribed' ? { borderBottomColor: theme['c-primary-font-active'] } : { borderBottomColor: 'transparent' }]}
            onPress={() => setActiveGroup('subscribed')}
          >
            <Text size={13} color={activeGroup == 'subscribed' ? theme['c-primary-font'] : theme['c-font-label']}>
              收藏歌单 {subscribedPlaylists.length}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          onScrollBeginDrag={Keyboard.dismiss}
          data={currentPlaylists}
          ListEmptyComponent={(
            <View style={styles.empty}>
              <Text color={theme['c-font-label']}>{activeGroup == 'created' ? '暂无自建歌单' : '暂无收藏歌单'}</Text>
            </View>
          )}
          renderItem={({ item }) => <ListItem item={item} onPress={handleItemPress} onHeartbeatPress={handleHeartbeatPress} />}
          keyExtractor={item => String(item.id)}
          refreshControl={
            <RefreshControl
              colors={[theme['c-primary']]}
              refreshing={loading}
              onRefresh={onRefresh}
            />
          }
        />
      </View>

      {selectedPlaylist ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme['c-content-background'] }]}>
          <SonglistDetail info={selectedPlaylist} onBack={handleBack} initialScrollToInfo={scrollToMusicInfo} />
        </View>
      ) : null}

      {createVisible ? (
        <ConfirmAlert
          ref={createAlertRef}
          title='新建网易云歌单'
          confirmText='创建'
          disabledConfirm={creating}
          onConfirm={handleCreatePlaylist}
          onHide={() => {
            setCreateVisible(false)
            setCreating(false)
          }}
        >
          <View style={styles.createContent}>
            <Text style={styles.createLabel}>歌单名</Text>
            <Input
              value={createName}
              onChangeText={setCreateName}
              placeholder='请输入歌单名'
              autoFocus
              style={{ backgroundColor: theme['c-primary-input-background'] }}
            />
          </View>
        </ConfirmAlert>
      ) : null}
    </View>
  )
})

const styles = StyleSheet.create({
  centerEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 14,
  },
  groupTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  groupTab: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderBottomWidth: 2,
  },
  empty: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  createContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
  },
  createLabel: {
    marginBottom: 5,
  },
})
