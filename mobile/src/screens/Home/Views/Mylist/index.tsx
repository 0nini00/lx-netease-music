import { useMemo, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { BorderWidths } from '@/theme'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import MusicList from './MusicList'
import MyList from './MyList'
import MyPlaylist from '../MyPlaylist'

type MyTabId = 'favorite' | 'netease'

const LocalListView = () => {
  const theme = useTheme()

  return (
    <View style={styles.localContainer}>
      <View style={{ ...styles.localListPanel, borderBottomColor: theme['c-border-background'] }}>
        <MyList />
      </View>
      <View style={styles.localMusicPanel}>
        <MusicList />
      </View>
    </View>
  )
}

const NetEaseView = () => {
  return (
    <View style={styles.neteaseContainer}>
      <View style={styles.content}>
        <MyPlaylist />
      </View>
    </View>
  )
}

export default () => {
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState<MyTabId>('favorite')

  const content = useMemo(() => {
    switch (activeTab) {
      case 'netease':
        return <NetEaseView />
      case 'favorite':
      default:
        return <LocalListView />
    }
  }, [activeTab])

  const openDownloadManager = () => {
    const componentId = commonState.componentIds[commonState.componentIds.length - 1]?.id
    if (!componentId) return
    navigations.pushDownloadManagerScreen(componentId)
  }

  return (
    <View style={styles.container}>
      <View
        style={{
          ...styles.header,
          borderBottomColor: theme['c-border-background'],
          backgroundColor: theme['c-content-background'],
        }}
      >
        <View style={styles.tabs}>
          <TouchableOpacity
            style={{ ...styles.tab, borderBottomColor: activeTab === 'favorite' ? theme['c-primary-font-active'] : 'transparent' }}
            activeOpacity={0.75}
            onPress={() => setActiveTab('favorite')}
          >
            <Text size={13} color={activeTab === 'favorite' ? theme['c-primary-font'] : theme['c-font-label']}>
              本地收藏
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ ...styles.tab, borderBottomColor: activeTab === 'netease' ? theme['c-primary-font-active'] : 'transparent' }}
            activeOpacity={0.75}
            onPress={() => setActiveTab('netease')}
          >
            <Text size={13} color={activeTab === 'netease' ? theme['c-primary-font'] : theme['c-font-label']}>
              网易云歌单
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.75} onPress={openDownloadManager}>
          <Icon name="download-2" size={16} color={theme['c-font-label']} />
          <Text style={styles.downloadText} size={12} color={theme['c-font-label']}>下载</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>{content}</View>
    </View>
  )
}

const styles = createStyle({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: BorderWidths.normal,
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: BorderWidths.normal2,
  },
  downloadBtn: {
    width: 58,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  downloadText: {
    marginLeft: 3,
  },
  content: {
    flex: 1,
  },
  localContainer: {
    flex: 1,
  },
  localListPanel: {
    maxHeight: 140,
    borderBottomWidth: BorderWidths.normal,
  },
  localMusicPanel: {
    flex: 1,
  },
  neteaseContainer: {
    flex: 1,
  },
})
