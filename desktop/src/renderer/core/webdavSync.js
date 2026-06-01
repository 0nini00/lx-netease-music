import { toRaw } from '@common/utils/vueTools'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { userApi } from '@renderer/store'
import { defaultList, loveList, userLists } from '@renderer/store/list/state'
import { getListMusics, overwriteListFull } from '@renderer/store/list/action'
import { exportUserApiFull, overwriteUserApiFull } from '@renderer/utils/ipc'
import {
  downloadWebDAVFile,
  getWebDAVFilePath,
  testWebDAVConnection,
  uploadWebDAVFile,
} from '@renderer/utils/webdav'

const version = '2'
const playlistsFileName = 'playlists.json'
const userApisFileName = 'user_apis.json'
const musicApiGatewayFileName = 'music_api_gateway.json'

const getLocalListData = async() => {
  const lists = {
    defaultList: await getListMusics(defaultList.id).then(musics => toRaw(musics)),
    loveList: await getListMusics(loveList.id).then(musics => toRaw(musics)),
    userList: [],
  }

  for await (const list of userLists) {
    lists.userList.push(await getListMusics(list.id).then(musics => ({
      ...toRaw(list),
      list: toRaw(musics),
    })))
  }

  return lists
}

const buildPayload = data => JSON.stringify({
  version,
  lastModified: Date.now(),
  data,
}, null, 2)

const parsePayload = (content, dataType) => {
  let payload
  try {
    payload = JSON.parse(content)
  } catch (err) {
    throw new Error(`${dataType} data format is invalid`)
  }
  if (!payload || typeof payload != 'object' || !payload.data) {
    throw new Error(`${dataType} data format is invalid`)
  }
  return payload
}

const assertListData = data => {
  if (!data || !Array.isArray(data.defaultList) || !Array.isArray(data.loveList) || !Array.isArray(data.userList)) {
    throw new Error('Playlist data format is invalid')
  }

  for (const list of data.userList) {
    if (!list || typeof list.id != 'string' || typeof list.name != 'string' || !Array.isArray(list.list)) {
      throw new Error('Playlist data format is invalid')
    }
  }
}

const assertUserApisData = data => {
  if (!Array.isArray(data)) throw new Error('User API data format is invalid')
  for (const api of data) {
    if (!api || typeof api.id != 'string' || typeof api.name != 'string' || typeof api.script != 'string') {
      throw new Error('User API data format is invalid')
    }
  }
}

const getMusicApiGatewayData = () => ({
  url: appSetting['common.music_api_gateway_url'],
  key: appSetting['common.music_api_gateway_key'],
  keyHeader: appSetting['common.music_api_gateway_key_header'],
})

const assertMusicApiGatewayData = data => {
  if (!data || typeof data != 'object' || Array.isArray(data)) {
    throw new Error('Music API gateway data format is invalid')
  }
  if (typeof data.url != 'string' || typeof data.key != 'string' || typeof data.keyHeader != 'string') {
    throw new Error('Music API gateway data format is invalid')
  }
}

const readRemotePayload = async(fileName, dataType) => {
  const content = await downloadWebDAVFile(getWebDAVFilePath(fileName))
  if (!content) throw new Error(`${dataType} file does not exist on WebDAV`)
  return parsePayload(content, dataType)
}

export const checkWebDAVConnection = testWebDAVConnection

// NOTE: WebDAV sync now only syncs User API (audio sources). App settings are NOT synced.

export const uploadWebDAVAllData = async() => {
  const userApis = await exportUserApiFull()
  await uploadWebDAVFile(getWebDAVFilePath(userApisFileName), buildPayload(userApis))
}

export const downloadWebDAVAllData = async() => {
  // Backward compatible: if remote has settings.json, ignore it and never overwrite local settings.
  const userApisPayload = await readRemotePayload(userApisFileName, 'User API')
  assertUserApisData(userApisPayload.data)
  userApi.list = await overwriteUserApiFull(userApisPayload.data)
}

export const uploadWebDAVLists = async() => {
  const lists = await getLocalListData()
  await uploadWebDAVFile(getWebDAVFilePath(playlistsFileName), buildPayload(lists))
}

export const downloadWebDAVLists = async() => {
  const payload = await readRemotePayload(playlistsFileName, 'Playlist')
  assertListData(payload.data)
  await overwriteListFull(payload.data)
}

// Settings sync is disabled on purpose.
export const uploadWebDAVSettings = async() => {
  throw new Error('Settings sync is disabled')
}

export const downloadWebDAVSettings = async() => {
  throw new Error('Settings sync is disabled')
}

export const uploadWebDAVMusicApiGateway = async() => {
  await uploadWebDAVFile(getWebDAVFilePath(musicApiGatewayFileName), buildPayload(getMusicApiGatewayData()))
}

export const downloadWebDAVMusicApiGateway = async() => {
  const payload = await readRemotePayload(musicApiGatewayFileName, 'Music API gateway')
  assertMusicApiGatewayData(payload.data)
  updateSetting({
    'common.music_api_gateway_url': payload.data.url,
    'common.music_api_gateway_key': payload.data.key,
    'common.music_api_gateway_key_header': payload.data.keyHeader || 'X-API-Key',
  })
}
