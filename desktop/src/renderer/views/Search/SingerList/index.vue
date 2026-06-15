<template>
  <div :class="$style.container">
    <div v-if="selectedSinger" :class="$style.detailContainer">
      <div :class="$style.detailHeader">
        <button :class="$style.backBtn" @click="handleBack">
          <svg-icon name="angle-left-solid" />
          {{ $t('back') }}
        </button>
        <div :class="$style.singerInfo">
          <img v-if="selectedSinger.picUrl" :src="selectedSinger.picUrl" :class="$style.singerImgLarge" alt="">
          <div :class="$style.singerTextInfo">
            <div :class="$style.singerName">{{ selectedSinger.name }}</div>
            <div v-if="selectedSinger.alias && selectedSinger.alias.length" :class="$style.singerAlias">
              {{ selectedSinger.alias.join('、') }}
            </div>
          </div>
        </div>
      </div>
      <div v-if="detailLoading" :class="$style.loading">
        {{ $t('list__loading') }}
      </div>
      <div v-else :class="$style.detailContent">
        <div v-if="detailData.songs.length" :class="$style.songList">
          <div
            v-for="(song, index) in detailData.songs"
            :key="song.songmid"
            :class="$style.songItem"
            @click="handleSongClick(song, index)"
          >
            <div :class="$style.songName">{{ song.name }}</div>
            <div :class="$style.songMeta">{{ song.singer }} - {{ song.albumName }}</div>
          </div>
        </div>
        <div v-else :class="$style.noData">
          {{ $t('list__no_data') }}
        </div>
      </div>
    </div>
    <div v-else>
      <div v-if="list.length" :class="$style.list">
        <div
          v-for="item in list"
          :key="item.id"
          :class="$style.item"
          @click="handleClick(item)"
        >
          <div :class="$style.pic">
            <img :src="item.picUrl || '/img/singer-default.png'" alt="">
          </div>
          <div :class="$style.info">
            <div :class="$style.name">{{ item.name }}</div>
            <div v-if="item.alias && item.alias.length" :class="$style.alias">
              {{ item.alias.join('、') }}
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="!isLoading" :class="$style.noData">
        {{ $t('list__no_data') }}
      </div>
      <div v-if="isLoading" :class="$style.loading">
        {{ $t('list__loading') }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from '@common/utils/vueTools'
import { search, getSingerDetail } from '@renderer/store/search/singer'
import { searchText } from '@renderer/store/search/state'
import { setTempList } from '@renderer/store/list/action'
import { playList } from '@renderer/core/player'
import { LIST_IDS } from '@common/constants'

export default {
  name: 'SingerList',
  props: {
    page: {
      type: Number,
      required: true,
    },
    sourceId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const list = ref([])
    const isLoading = ref(false)
    const selectedSinger = ref(null)
    const detailData = ref({ songs: [], albums: [] })
    const detailLoading = ref(false)

    const loadList = async(text) => {
      if (!text || props.sourceId === 'all') return

      isLoading.value = true
      try {
        const result = await search(text, props.page, props.sourceId)
        list.value = result.list || []
      } catch (err) {
        console.error('load singer list failed:', err)
        list.value = []
      } finally {
        isLoading.value = false
      }
    }

    watch(
      () => [props.page, props.sourceId, searchText.value],
      () => {
        selectedSinger.value = null
        detailData.value = { songs: [], albums: [] }
        if (searchText.value) void loadList(searchText.value)
      },
      { immediate: true },
    )

    const handleClick = async(item) => {
      selectedSinger.value = item
      detailLoading.value = true
      try {
        const data = await getSingerDetail(item.id, props.sourceId)
        detailData.value = data
      } catch (err) {
        console.error('load singer detail failed:', err)
      } finally {
        detailLoading.value = false
      }
    }

    const handleBack = () => {
      selectedSinger.value = null
      detailData.value = { songs: [], albums: [] }
    }

    const handleSongClick = async(song, index) => {
      if (!detailData.value.songs.length) return
      try {
        const listId = `singer_${props.sourceId}_${selectedSinger.value?.id}`
        const cleanSongs = JSON.parse(JSON.stringify(detailData.value.songs))
        console.log('cleanSongs sample:', cleanSongs[0])
        await setTempList(listId, cleanSongs)
        playList(LIST_IDS.TEMP, index)
      } catch (err) {
        console.error('play song failed:', err)
      }
    }

    return {
      list,
      isLoading,
      selectedSinger,
      detailData,
      detailLoading,
      handleClick,
      handleBack,
      handleSongClick,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
  padding: 20px;
}

.item {
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }
}

.pic {
  width: 100%;
  padding-bottom: 100%;
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-primary-alpha-100);

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.info {
  margin-top: 10px;
  text-align: center;
}

.name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-font);
}

.alias {
  font-size: 12px;
  color: var(--color-font-label);
  margin-top: 4px;
}

.noData,
.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-font-label);
}

.detailContainer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detailHeader {
  padding: 15px 20px;
  border-bottom: 1px solid var(--color-border);
}

.backBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-primary-alpha-200);
  border: none;
  border-radius: 4px;
  color: var(--color-font);
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;

  &:hover {
    background: var(--color-primary-alpha-300);
  }

  svg {
    width: 12px;
    height: 12px;
  }
}

.singerInfo {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 15px;
}

.singerImgLarge {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.singerTextInfo {
  flex: 1;
}

.singerName {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-font);
}

.singerAlias {
  font-size: 13px;
  color: var(--color-font-label);
  margin-top: 4px;
}

.detailContent {
  flex: 1;
  overflow-y: auto;
  padding: 10px 20px;
  min-height: 0;
}

.songList {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.songItem {
  padding: 12px 15px;
  background: transparent;
  border-bottom: 1px solid rgba(128, 128, 128, 0.1);
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }

  &:active {
    background: rgba(0, 0, 0, 0.05);
  }
}

.songName {
  font-size: 14px;
  color: var(--color-font);
  margin-bottom: 4px;
}

.songMeta {
  font-size: 12px;
  color: var(--color-font-label);
}
</style>
