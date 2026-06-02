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
import { search as searchAlbum, getAlbumDetail } from '@/core/search/album'
import type { AlbumResult } from '@/store/search/album/state'
import { scaleSizeW } from '@/utils/pixelRatio'
import { BorderWidths } from '@/theme'

export interface AlbumListType {
  loadList: (text: string, source: string) => void
}

export default forwardRef<AlbumListType>((_, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const [loading, setLoading] = useState(false)
  const [albums, setAlbums] = useState<AlbumResult[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumResult | null>(null)
  const [albumDetail, setAlbumDetail] = useState<{ list: LX.Music.MusicInfoOnline[]; info: any } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const currentTextRef = useRef('')

  useImperativeHandle(ref, () => ({
    loadList(text: string, source: string) {
      currentTextRef.current = text
      setSelectedAlbum(null)
      setAlbumDetail(null)
      void loadAlbums(text, source)
    },
  }))

  const loadAlbums = async (text: string, source: string) => {
    if (!text) return
    setLoading(true)
    try {
      const results = await searchAlbum(text, 1, source as any)
      if (currentTextRef.current !== text) return
      setAlbums(results)
    } catch (err: any) {
      toast(err.message || t('search_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleAlbumPress = async (album: AlbumResult) => {
    setSelectedAlbum(album)
    setAlbumDetail(null)
    setDetailLoading(true)
    try {
      const data = await getAlbumDetail(album.id, album.source)
      setAlbumDetail(data)
    } catch {
      toast(t('load_failed'))
    } finally {
      setDetailLoading(false)
    }
  }

  if (selectedAlbum) {
    const songs = albumDetail?.list ?? []
    return (
      <View style={styles.detailContainer}>
        <View style={[styles.detailHeader, { backgroundColor: theme['c-primary-lightest-background-hover'] }]}>
          <TouchableOpacity onPress={() => { setSelectedAlbum(null); setAlbumDetail(null) }} style={styles.backBtn}>
            <RNText style={{ color: theme['c-font-label'], fontSize: 16 }}>{'< ' + t('back')}</RNText>
          </TouchableOpacity>
          <View style={styles.singerInfo}>
            {selectedAlbum.picUrl ? (
              <Image source={{ uri: selectedAlbum.picUrl }} style={styles.singerImgLarge} />
            ) : null}
            <View style={styles.singerTextInfo}>
              <Text size={16} style={{ fontWeight: 'bold' }}>{selectedAlbum.name}</Text>
              <Text size={12} color={theme['c-font']} style={{ marginTop: 4 }}>{selectedAlbum.singer}</Text>
              {selectedAlbum.publishTime ? (
                <Text size={11} color={theme['c-font']}>
                  {new Date(selectedAlbum.publishTime).getFullYear()}{selectedAlbum.size ? ` | ${selectedAlbum.size}首` : ''}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
        {detailLoading ? (
          <ActivityIndicator style={styles.loadingMore} color={theme['c-font-label']} />
        ) : (
          <ScrollView style={styles.detailContent}>
            {songs.length ? songs.map((song, i) => (
              <View key={song.songmid ? `${song.songmid}_${i}` : `${i}`} style={styles.songItem}>
                <Text size={14} numberOfLines={1}>{song.name}</Text>
                <Text size={11} color={theme['c-font']}>{song.singer} | {song.interval}</Text>
              </View>
            )) : (
              <Text style={styles.emptyText} color={theme['c-font']}>{t('no_data')}</Text>
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
          onRefresh={() => loadAlbums(currentTextRef.current, 'all')}
          colors={[theme['c-font-label']]}
        />
      }
    >
      {loading && !albums.length ? (
        <ActivityIndicator style={styles.loadingCenter} color={theme['c-font-label']} />
      ) : albums.length ? (
        albums.map((album, i) => (
          <TouchableOpacity
            key={`${album.source}_${album.id}_${i}`}
            style={[styles.singerCard, { backgroundColor: theme['c-primary-input-background'] }]}
            onPress={() => handleAlbumPress(album)}
          >
            {album.picUrl ? (
              <Image source={{ uri: album.picUrl }} style={styles.singerImg} />
            ) : (
              <View style={[styles.singerImgPlaceholder, { backgroundColor: theme['c-content-background'] }]}>
                <RNText style={{ color: theme['c-font'] }}>{album.name[0]}</RNText>
              </View>
            )}
            <View style={styles.singerMeta}>
              <Text size={14} numberOfLines={1} style={{ fontWeight: 'bold' }}>{album.name}</Text>
              <Text size={11} color={theme['c-font']} numberOfLines={1}>{album.singer} | {album.source.toUpperCase()}</Text>
              {album.publishTime ? (
                <Text size={11} color={theme['c-font']}>
                  {new Date(album.publishTime).getFullYear()}{album.size ? ` | ${album.size}首` : ''}
                </Text>
              ) : null}
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
    borderRadius: 6,
  },
  singerImgPlaceholder: {
    width: scaleSizeW(50),
    height: scaleSizeW(50),
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singerMeta: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  detailContainer: { flex: 1 },
  detailHeader: { paddingTop: scaleSizeW(8), paddingHorizontal: scaleSizeW(10), paddingBottom: 6 },
  backBtn: { paddingVertical: 6 },
  singerInfo: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  singerImgLarge: { width: scaleSizeW(70), height: scaleSizeW(70), borderRadius: 6 },
  singerTextInfo: { flex: 1, marginLeft: 14 },
  detailContent: { flex: 1, paddingHorizontal: scaleSizeW(10) },
  songItem: {
    paddingVertical: scaleSizeW(8),
    borderBottomWidth: BorderWidths.normal,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  },
  emptyText: { textAlign: 'center', marginTop: 40, paddingVertical: 20 },
})