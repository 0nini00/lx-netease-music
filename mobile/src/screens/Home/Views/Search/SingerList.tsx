import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Text as RNText,
} from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { search as searchSinger, getSingerDetail } from '@/core/search/singer'
import type { SingerResult, SingerDetailData } from '@/store/search/singer/state'
import { scaleSizeW } from '@/utils/pixelRatio'
import { BorderWidths } from '@/theme'

export interface SingerListType {
  loadList: (text: string, source: string) => void
}

export default forwardRef<SingerListType>((_, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const [loading, setLoading] = useState(false)
  const [singers, setSingers] = useState<SingerResult[]>([])
  const [selectedSinger, setSelectedSinger] = useState<SingerResult | null>(null)
  const [detailData, setDetailData] = useState<SingerDetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState<'songs' | 'albums'>('songs')
  const [currentSource, setCurrentSource] = useState<string>('all')
  const currentTextRef = useRef('')

  useImperativeHandle(ref, () => ({
    loadList(text: string, source: string) {
      currentTextRef.current = text
      setCurrentSource(source)
      setSelectedSinger(null)
      setDetailData(null)
      void loadSinger(text, source)
    },
  }))

  const loadSinger = async (text: string, source: string) => {
    if (!text) return
    setLoading(true)
    try {
      const results = await searchSinger(text, 1, source as any)
      if (currentTextRef.current !== text) return
      setSingers(results)
    } catch (err: any) {
      toast(err.message || t('search_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSingerPress = async (singer: SingerResult) => {
    setSelectedSinger(singer)
    setDetailData(null)
    setDetailLoading(true)
    try {
      const data = await getSingerDetail(singer.id, singer.source)
      setDetailData(data)
    } catch {
      toast(t('load_failed'))
    } finally {
      setDetailLoading(false)
    }
  }

  const handleBack = () => {
    setSelectedSinger(null)
    setDetailData(null)
  }

  if (selectedSinger) {
    const displaySongs = detailData?.songs ?? []
    const displayAlbums = detailData?.albums ?? []
    return (
      <View style={styles.detailContainer}>
        <View style={[styles.detailHeader, { backgroundColor: theme['c-primary-lightest-background-hover'] }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <RNText style={{ color: theme['c-font-label'], fontSize: 16 }}>{'< ' + t('back')}</RNText>
          </TouchableOpacity>
          <View style={styles.singerInfo}>
            {selectedSinger.picUrl ? (
              <Image source={{ uri: selectedSinger.picUrl }} style={styles.singerImgLarge} />
            ) : null}
            <View style={styles.singerTextInfo}>
              <Text size={16} style={{ fontWeight: 'bold' }}>{selectedSinger.name}</Text>
              {selectedSinger.desc ? (
                <Text size={12} color={theme['c-font']} numberOfLines={2} style={{ marginTop: 4 }}>
                  {selectedSinger.desc}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.detailTabs}>
            <TouchableOpacity onPress={() => setDetailTab('songs')} style={[styles.tab, detailTab === 'songs' && { borderBottomColor: theme['c-font-label'], borderBottomWidth: 2 }]}>
              <Text color={detailTab === 'songs' ? theme['c-font-label'] : theme['c-font']}>{t('search_type_music')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDetailTab('albums')} style={[styles.tab, detailTab === 'albums' && { borderBottomColor: theme['c-font-label'], borderBottomWidth: 2 }]}>
              <Text color={detailTab === 'albums' ? theme['c-font-label'] : theme['c-font']}>{t('search_type_album')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {detailLoading ? (
          <ActivityIndicator style={styles.loadingMore} color={theme['c-font-label']} />
        ) : (
          <ScrollView style={styles.detailContent}>
            {detailTab === 'songs' ? (
              displaySongs.length ? displaySongs.map((song, i) => (
                <View key={song.songmid ? `${song.songmid}_${i}` : `${i}`} style={styles.songItem}>
                  <Text size={14} numberOfLines={1}>{song.name}</Text>
                  <Text size={11} color={theme['c-font']}>{song.singer} | {song.interval}</Text>
                </View>
              )) : (
                <Text style={styles.emptyText} color={theme['c-font']}>{t('no_data')}</Text>
              )
            ) : (
              displayAlbums.length ? displayAlbums.map((album, i) => (
                <View key={`${album.id}_${i}`} style={styles.songItem}>
                  <Text size={14} numberOfLines={1}>{album.name}</Text>
                  <Text size={11} color={theme['c-font']}>
                    {album.publishTime ? new Date(album.publishTime).getFullYear().toString() : ''}
                    {album.size ? ` | ${album.size}首` : ''}
                  </Text>
                </View>
              )) : (
                <Text style={styles.emptyText} color={theme['c-font']}>{t('no_data')}</Text>
              )
            )}
          </ScrollView>
        )}
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => loadSinger(currentTextRef.current, currentSource)}
          colors={[theme['c-font-label']]}
        />
      }
    >
      {loading && !singers.length ? (
        <ActivityIndicator style={styles.loadingCenter} color={theme['c-font-label']} />
      ) : singers.length ? (
        singers.map((singer, i) => (
          <TouchableOpacity
            key={`${singer.source}_${singer.id}_${i}`}
            style={[styles.singerCard, { backgroundColor: theme['c-primary-input-background'] }]}
            onPress={() => handleSingerPress(singer)}
          >
            {singer.picUrl ? (
              <Image source={{ uri: singer.picUrl }} style={styles.singerImg} />
            ) : (
              <View style={[styles.singerImgPlaceholder, { backgroundColor: theme['c-content-background'] }]}>
                <RNText style={{ color: theme['c-font'] }}>{singer.name[0]}</RNText>
              </View>
            )}
            <View style={styles.singerMeta}>
              <Text size={14} numberOfLines={1} style={{ fontWeight: 'bold' }}>{singer.name}</Text>
              <Text size={11} color={theme['c-font']} numberOfLines={1}>
                {singer.source.toUpperCase()}{singer.desc ? ' | ' + singer.desc.slice(0, 30) : ''}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText} color={theme['c-font']}>{t('no_data')}</Text>
      )}
    </ScrollView>
  )
})

const styles = createStyle({
  container: { flex: 1, paddingHorizontal: scaleSizeW(10) },
  loadingCenter: { marginTop: 60 },
  loadingMore: { marginVertical: 20 },
  singerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 4,
    borderRadius: 8,
  },
  singerImg: {
    width: scaleSizeW(50),
    height: scaleSizeW(50),
    borderRadius: scaleSizeW(25),
  },
  singerImgPlaceholder: {
    width: scaleSizeW(50),
    height: scaleSizeW(50),
    borderRadius: scaleSizeW(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  singerMeta: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  detailContainer: { flex: 1 },
  detailHeader: {
    paddingTop: scaleSizeW(8),
    paddingHorizontal: scaleSizeW(10),
    paddingBottom: 0,
  },
  backBtn: { paddingVertical: 6 },
  singerInfo: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  singerImgLarge: {
    width: scaleSizeW(70),
    height: scaleSizeW(70),
    borderRadius: scaleSizeW(35),
  },
  singerTextInfo: { flex: 1, marginLeft: 14 },
  detailTabs: { flexDirection: 'row', marginTop: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 16 },
  detailContent: { flex: 1, paddingHorizontal: scaleSizeW(10) },
  songItem: {
    paddingVertical: scaleSizeW(8),
    borderBottomWidth: BorderWidths.normal,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  },
  emptyText: { textAlign: 'center', marginTop: 40, paddingVertical: 20 },
})