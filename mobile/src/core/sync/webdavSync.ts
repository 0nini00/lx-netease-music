import * as webdav from '@/utils/webdav'
import { overwriteListFull } from '@/core/list'
import { filterSensitiveSettingsForSync, getAllDataForSync } from './syncHelpers'
import { confirmDialog, toast } from '@/utils/tools'
import { updateSetting } from '@/core/common'
import settingState from '@/store/setting/state'
import { log } from '@/utils/log'
import { debounce } from '@/utils/common'
import { getOperationQueue, clearOperationQueue, loadOperationQueue } from './opQueue'
import { applyListOperation } from '@/utils/listManage'
import { overwriteUserApis } from '@/core/userApi.ts'
import { setApiSource } from '@/core/apiSource'
import { getPlayHistory, normalizeUserApiScripts, savePlayHistory } from '@/utils/data'
import {
  normalizeDownloadTasksForSync,
  normalizeRemoteSyncedDownloadTasks,
  saveDownloadTasks,
} from '@/utils/data/download'
import downloadState from '@/store/download/state'

let listsChanged = false
let isSyncing = false
let nextListsUploadExtraData: ListsSyncExtraData | null = null

interface ListsSyncFile {
  version?: string
  lastModified: number
  data: LX.List.ListDataFull
  playHistory?: LX.Player.PlayHistoryItem[]
  downloadTasks?: LX.Download.DownloadTask[]
}

interface ListsSyncExtraData {
  playHistory: LX.Player.PlayHistoryItem[]
  downloadTasks: LX.Download.DownloadTask[]
}

interface WebdavSimpleSyncFile<T> {
  version?: string
  lastModified: number
  data: T
}

void loadOperationQueue()

const debouncedSync = debounce(() => {
  if (!settingState.setting['sync.webdav.enable']) return
  if (listsChanged) {
    void triggerWebDAVSync(false).finally(() => {
      listsChanged = false
    })
  }
}, 3000)

export const markListsChanged = () => {
  if (!settingState.setting['sync.webdav.enable']) return
  listsChanged = true
  debouncedSync()
}

function getRemoteDataDirPath(): string {
  const path = settingState.setting['sync.webdav.path'] || '/LX_Music/'
  return '/' + path.replace(/^\/|\/$/g, '')
}

function getRemoteListsFilePath(): string {
  return `${getRemoteDataDirPath()}/playlists.json`
}

function getRemoteSettingsFilePath(): string {
  return `${getRemoteDataDirPath()}/settings.json`
}

function getRemoteUserApisFilePath(): string {
  return `${getRemoteDataDirPath()}/user_apis.json`
}

function getRemoteMusicSourceFilePath(): string {
  return `${getRemoteDataDirPath()}/user_apis.json`
}

function getRemoteMusicGatewayFilePath(): string {
  return `${getRemoteDataDirPath()}/music_api_gateway.json`
}

function getLegacyRemoteMusicSourceFilePath(): string {
  return `${getRemoteDataDirPath()}/music_source.json`
}

function getLegacyRemoteMusicGatewayFilePath(): string {
  return `${getRemoteDataDirPath()}/music_gateway.json`
}

const ensureWebDAVSyncEnabled = () => {
  if (!settingState.setting['sync.webdav.enable'] || !settingState.setting['sync.webdav.url']) {
    throw new Error('请先启用并配置 WebDAV 同步')
  }
}

async function uploadUserApis(path: string): Promise<number> {
  const timestamp = Date.now()
  const { userApis } = await getAllDataForSync()
  const dataObject: WebdavSimpleSyncFile<typeof userApis> = {
    version: '2',
    lastModified: timestamp,
    data: userApis,
  }
  await webdav.uploadFile(path, JSON.stringify(dataObject))
  return timestamp
}

async function uploadLists(path: string, listsData: LX.List.ListDataFull): Promise<number> {
  const timestamp = Date.now()
  const { playHistory, downloadTasks } = nextListsUploadExtraData ?? await getAllDataForSync()
  nextListsUploadExtraData = null
  const dataObject: ListsSyncFile = {
    version: '2',
    lastModified: timestamp,
    data: listsData,
    playHistory,
    downloadTasks,
  }
  await webdav.uploadFile(path, JSON.stringify(dataObject))
  updateSetting({ 'sync.webdav.lastSyncTimeLists': timestamp })
  return timestamp
}

const normalizeRemoteListsData = (remoteData: ListsSyncFile | any): ListsSyncFile => ({
  ...remoteData,
  data: remoteData.data,
  lastModified: remoteData.lastModified ?? 0,
  playHistory: Array.isArray(remoteData.playHistory) ? remoteData.playHistory : undefined,
  downloadTasks: Array.isArray(remoteData.downloadTasks) ? remoteData.downloadTasks : undefined,
})

const mergePlayHistory = (
  localHistory: LX.Player.PlayHistoryItem[],
  remoteHistory?: LX.Player.PlayHistoryItem[]
) => {
  const historyMap = new Map<string, LX.Player.PlayHistoryItem>()
  for (const item of remoteHistory ?? []) historyMap.set(item.id, item)
  for (const item of localHistory) historyMap.set(item.id, item)
  return [...historyMap.values()]
    .sort((a, b) => b.playedAt - a.playedAt)
    .slice(0, 5000)
}

const mergeDownloadTasks = (
  localTasks: LX.Download.DownloadTask[],
  remoteTasks?: LX.Download.DownloadTask[]
) => {
  const taskMap = new Map<string, LX.Download.DownloadTask>()
  for (const task of remoteTasks ?? []) taskMap.set(task.id, task)
  for (const task of localTasks) taskMap.set(task.id, task)
  return normalizeDownloadTasksForSync([...taskMap.values()].sort((a, b) => b.createdAt - a.createdAt))
}

const mergeDownloadTasksForLocal = (
  localTasks: LX.Download.DownloadTask[],
  remoteTasks?: LX.Download.DownloadTask[]
) => {
  const taskMap = new Map<string, LX.Download.DownloadTask>()
  for (const task of normalizeRemoteSyncedDownloadTasks(remoteTasks ?? [])) taskMap.set(task.id, task)
  for (const task of localTasks) taskMap.set(task.id, task)
  return [...taskMap.values()].sort((a, b) => b.createdAt - a.createdAt)
}

const getRemoteDownloadTasksForLocal = (remoteTasks: LX.Download.DownloadTask[]) => {
  const localTaskMap = new Map(downloadState.tasks.map(task => [task.id, task]))
  return normalizeRemoteSyncedDownloadTasks(remoteTasks)
    .map(task => {
      const localTask = localTaskMap.get(task.id)
      if (!localTask) return task
      return {
        ...task,
        status: localTask.status,
        errorMsg: localTask.errorMsg,
        progress: localTask.progress,
        metadataStatus: localTask.metadataStatus,
        isRemoteSynced: localTask.isRemoteSynced,
      }
    })
    .sort((a, b) => b.createdAt - a.createdAt)
}

const getMergedExtraData = async (remoteData: ListsSyncFile): Promise<ListsSyncExtraData> => {
  const localHistory = await getPlayHistory()
  return {
    playHistory: mergePlayHistory(localHistory, remoteData.playHistory),
    downloadTasks: mergeDownloadTasks(downloadState.tasks, remoteData.downloadTasks),
  }
}

const getLocalExtraDataForSync = async (): Promise<ListsSyncExtraData> => ({
  playHistory: await getPlayHistory(),
  downloadTasks: normalizeDownloadTasksForSync(downloadState.tasks),
})

const hasLocalExtraDataChanges = async (remoteData: ListsSyncFile) => {
  const localExtraData = await getLocalExtraDataForSync()
  const remoteExtraData: ListsSyncExtraData = {
    playHistory: remoteData.playHistory ?? [],
    downloadTasks: normalizeDownloadTasksForSync(remoteData.downloadTasks ?? []),
  }
  return JSON.stringify(localExtraData) !== JSON.stringify(remoteExtraData)
}

async function applySyncedExtraData(remoteData: ListsSyncFile) {
  if (Array.isArray(remoteData.playHistory)) {
    await savePlayHistory(remoteData.playHistory)
    global.app_event.playHistoryUpdated()
  }
  if (Array.isArray(remoteData.downloadTasks)) {
    const tasks = getRemoteDownloadTasksForLocal(remoteData.downloadTasks)
    downloadState.tasks = tasks
    await saveDownloadTasks(tasks)
    global.app_event.download_list_changed()
  }
}

async function applyMergedExtraData(remoteData: ListsSyncFile) {
  const localHistory = await getPlayHistory()
  await savePlayHistory(mergePlayHistory(localHistory, remoteData.playHistory))
  global.app_event.playHistoryUpdated()

  const tasks = mergeDownloadTasksForLocal(downloadState.tasks, remoteData.downloadTasks)
  downloadState.tasks = tasks
  await saveDownloadTasks(tasks)
  global.app_event.download_list_changed()
}

async function uploadSettings(path: string): Promise<number> {
  const timestamp = Date.now()
  const { settings } = await getAllDataForSync()
  const dataObject: WebdavSimpleSyncFile<Partial<LX.AppSetting>> = {
    version: '2',
    lastModified: timestamp,
    data: filterSensitiveSettingsForSync(settings),
  }
  await webdav.uploadFile(path, JSON.stringify(dataObject))
  return timestamp
}

async function downloadSettings(path: string) {
  const remoteSettingsContent = await webdav.downloadFile(path)
  if (!remoteSettingsContent) return null
  const remoteSettingsData = JSON.parse(remoteSettingsContent) as WebdavSimpleSyncFile<Partial<LX.AppSetting>>
  updateSetting(filterSensitiveSettingsForSync(remoteSettingsData.data))
  return remoteSettingsData
}

const normalizeUserApisForOverwrite = (payload: { list: LX.UserApi.UserApiInfo[], scripts: Record<string, string> }) => ({
  ...payload,
  scripts: normalizeUserApiScripts(payload.scripts),
})

async function downloadUserApis(path: string) {
  const remoteUserApisContent = await webdav.downloadFile(path)
  if (!remoteUserApisContent) return null
  const remoteApisData = JSON.parse(remoteUserApisContent) as WebdavSimpleSyncFile<LX.UserApi.UserApiInfo[] | { list?: LX.UserApi.UserApiInfo[], scripts?: Record<string, string> }>
  const data = remoteApisData.data as any
  if (Array.isArray(data)) {
    const list = data.map((item: any) => {
      const { script, ...rest } = item ?? {}
      return rest
    })
    const scripts = Object.fromEntries(
      data
        .filter((item: any) => item && typeof item.id === 'string' && typeof item.script === 'string' && item.script.trim())
        .map((item: any) => [item.id, item.script])
    )
    await overwriteUserApis(normalizeUserApisForOverwrite({ list, scripts }))
  } else {
    await overwriteUserApis(normalizeUserApisForOverwrite({ list: data.list ?? [], scripts: data.scripts ?? {} }))
  }
  return remoteApisData
}

async function uploadMusicGatewayConfig(path: string): Promise<number> {
  const timestamp = Date.now()
  const { settings } = await getAllDataForSync()
  const dataObject: WebdavSimpleSyncFile<Record<string, any>> = {
    version: '2',
    lastModified: timestamp,
    data: {
      'common.music_play_use_gateway': settings['common.music_play_use_gateway'],
      'common.music_api_gateway_enable': settings['common.music_api_gateway_enable'],
      'common.music_api_gateway_url': settings['common.music_api_gateway_url'],
      'common.music_api_gateway_header_name': settings['common.music_api_gateway_header_name'],
      'common.music_api_gateway_header_value': settings['common.music_api_gateway_header_value'],
    },
  }
  await webdav.uploadFile(path, JSON.stringify(dataObject))
  return timestamp
}

async function downloadMusicGatewayConfig(path: string) {
  const remoteContent = await webdav.downloadFile(path)
  if (!remoteContent) return null
  const remoteData = JSON.parse(remoteContent) as WebdavSimpleSyncFile<Record<string, any>>
  const data = remoteData.data ?? {}
  const normalizedSetting: Partial<LX.AppSetting> = {}

  if (typeof data.url === 'string') normalizedSetting['common.music_api_gateway_url'] = data.url
  if (typeof data.key === 'string') normalizedSetting['common.music_api_gateway_header_value'] = data.key
  if (typeof data.keyHeader === 'string' && data.keyHeader) normalizedSetting['common.music_api_gateway_header_name'] = data.keyHeader

  if (typeof data['common.music_play_use_gateway'] === 'boolean') normalizedSetting['common.music_play_use_gateway'] = data['common.music_play_use_gateway']
  if (typeof data['common.music_api_gateway_enable'] === 'boolean') normalizedSetting['common.music_api_gateway_enable'] = data['common.music_api_gateway_enable']
  if (typeof data['common.music_api_gateway_url'] === 'string') normalizedSetting['common.music_api_gateway_url'] = data['common.music_api_gateway_url']
  if (typeof data['common.music_api_gateway_header_name'] === 'string') normalizedSetting['common.music_api_gateway_header_name'] = data['common.music_api_gateway_header_name']
  if (typeof data['common.music_api_gateway_header_value'] === 'string') normalizedSetting['common.music_api_gateway_header_value'] = data['common.music_api_gateway_header_value']
  if (typeof data['common.music_api_gateway_key_header'] === 'string') normalizedSetting['common.music_api_gateway_header_name'] = data['common.music_api_gateway_key_header']
  if (typeof data['common.music_api_gateway_key'] === 'string') normalizedSetting['common.music_api_gateway_header_value'] = data['common.music_api_gateway_key']

  updateSetting(normalizedSetting)
  return {
    ...remoteData,
    data: normalizedSetting,
  }
}

async function downloadMusicSources(path: string) {
  const remoteContent = await webdav.downloadFile(path)
  if (!remoteContent) return null
  const remoteData = JSON.parse(remoteContent) as WebdavSimpleSyncFile<any>
  const data = remoteData.data

  if (Array.isArray(data?.list) && data.scripts) {
    await overwriteUserApis(normalizeUserApisForOverwrite({ list: data.list, scripts: data.scripts }))
  } else if (Array.isArray(data)) {
    const list = data.map((item: any) => {
      const { script, ...rest } = item ?? {}
      return rest
    })
    const scripts = Object.fromEntries(
      data
        .filter((item: any) => item && typeof item.id === 'string' && typeof item.script === 'string' && item.script.trim())
        .map((item: any) => [item.id, item.script])
    )
    if (!Object.keys(scripts).length) {
      throw new Error('云端音源缺少有效脚本内容，无法初始化')
    }
    await overwriteUserApis(normalizeUserApisForOverwrite({ list, scripts }))
  } else if (data && typeof data === 'object') {
    if (!data.scripts || typeof data.scripts !== 'object') {
      throw new Error('云端音源缺少 scripts 脚本内容，无法初始化')
    }
    await overwriteUserApis(normalizeUserApisForOverwrite({ list: data.list ?? [], scripts: data.scripts ?? {} }))
  }
  return remoteData
}

const downloadFirstAvailableFile = async(paths: string[]) => {
  for (const path of paths) {
    const content = await webdav.downloadFile(path)
    if (content) return { path, content }
  }
  return null
}

async function downloadMusicSourcesCompat(paths: string[]) {
  const remoteFile = await downloadFirstAvailableFile(paths)
  if (!remoteFile) return null
  const remoteData = JSON.parse(remoteFile.content) as WebdavSimpleSyncFile<any>
  const data = remoteData.data

  if (Array.isArray(data?.list) && data.scripts) {
    await overwriteUserApis(normalizeUserApisForOverwrite({ list: data.list, scripts: data.scripts }))
  } else if (Array.isArray(data)) {
    const list = data.map((item: any) => {
      const { script, ...rest } = item ?? {}
      return rest
    })
    const scripts = Object.fromEntries(
      data
        .filter((item: any) => item && typeof item.id === 'string' && typeof item.script === 'string' && item.script.trim())
        .map((item: any) => [item.id, item.script])
    )
    if (!Object.keys(scripts).length) {
      throw new Error('云端音源缺少有效脚本内容，无法初始化')
    }
    await overwriteUserApis(normalizeUserApisForOverwrite({ list, scripts }))
  } else if (data && typeof data === 'object') {
    if (!data.scripts || typeof data.scripts !== 'object') {
      throw new Error('云端音源缺少 scripts 脚本内容，无法初始化')
    }
    await overwriteUserApis(normalizeUserApisForOverwrite({ list: data.list ?? [], scripts: data.scripts ?? {} }))
  }
  return {
    ...remoteData,
    sourcePath: remoteFile.path,
  }
}

async function downloadMusicGatewayConfigCompat(paths: string[]) {
  const remoteFile = await downloadFirstAvailableFile(paths)
  if (!remoteFile) return null
  const remoteData = JSON.parse(remoteFile.content) as WebdavSimpleSyncFile<Record<string, any>>
  const remoteSetting = remoteData.data ?? {}
  const normalizedSetting: Partial<LX.AppSetting> = {}

  if (typeof remoteSetting.url === 'string') normalizedSetting['common.music_api_gateway_url'] = remoteSetting.url
  if (typeof remoteSetting.key === 'string') normalizedSetting['common.music_api_gateway_header_value'] = remoteSetting.key
  if (typeof remoteSetting.keyHeader === 'string' && remoteSetting.keyHeader) normalizedSetting['common.music_api_gateway_header_name'] = remoteSetting.keyHeader

  if (typeof remoteSetting['common.music_play_use_gateway'] == 'boolean') normalizedSetting['common.music_play_use_gateway'] = remoteSetting['common.music_play_use_gateway']
  if (typeof remoteSetting['common.music_api_gateway_enable'] == 'boolean') normalizedSetting['common.music_api_gateway_enable'] = remoteSetting['common.music_api_gateway_enable']
  if (typeof remoteSetting['common.music_api_gateway_url'] == 'string') normalizedSetting['common.music_api_gateway_url'] = remoteSetting['common.music_api_gateway_url']
  if (typeof remoteSetting['common.music_api_gateway_header_name'] == 'string') normalizedSetting['common.music_api_gateway_header_name'] = remoteSetting['common.music_api_gateway_header_name']
  if (typeof remoteSetting['common.music_api_gateway_header_value'] == 'string') normalizedSetting['common.music_api_gateway_header_value'] = remoteSetting['common.music_api_gateway_header_value']
  if (typeof remoteSetting['common.music_api_gateway_key_header'] == 'string') normalizedSetting['common.music_api_gateway_header_name'] = remoteSetting['common.music_api_gateway_key_header']
  if (typeof remoteSetting['common.music_api_gateway_key'] == 'string') normalizedSetting['common.music_api_gateway_header_value'] = remoteSetting['common.music_api_gateway_key']

  updateSetting(normalizedSetting)
  return {
    ...remoteData,
    data: normalizedSetting,
    sourcePath: remoteFile.path,
  }
}

async function downloadLists(path: string) {
  const remoteListsContent = await webdav.downloadFile(path)
  if (!remoteListsContent) return null
  return normalizeRemoteListsData(JSON.parse(remoteListsContent))
}

function mergeRemoteLists(localData: LX.List.ListDataFull, remoteData: LX.List.ListDataFull) {
  const mergedData = structuredClone(localData)
  const operationQueue = getOperationQueue()
  let hasConflict = false

  for (const operation of operationQueue) {
    const result = applyListOperation(mergedData, operation)
    if (!result.success) {
      hasConflict = true
      log.warn(`[WebDAV Sync] Failed to apply operation during merge: ${result.error}`)
    }
  }

  for (const listId of Object.keys(remoteData)) {
    if (mergedData[listId]) continue
    mergedData[listId] = remoteData[listId]
  }

  return { mergedData, hasConflict }
}

export async function manualUploadMusicSources() {
  if (isSyncing) {
    toast('正在同步中，请稍后...')
    return
  }
  try {
    ensureWebDAVSyncEnabled()
  } catch (error: any) {
    toast(error.message)
    return
  }

  const confirm = await confirmDialog({
    title: '确认上传',
    message: '这将使用本地的“音源”完全覆盖云端的 user_apis.json，此操作不可逆，确定要继续吗？',
    confirmButtonText: '上传',
  })
  if (!confirm) return

  isSyncing = true
  toast('开始上传音源...')
  try {
    await uploadUserApis(getRemoteMusicSourceFilePath())
    toast('音源上传成功！')
  } catch (error: any) {
    log.error(`[WebDAV Manual Upload Music Sources] Failed: ${error.stack ?? error.message}`)
    toast(`上传失败: ${error.message}`, 'long')
  } finally {
    isSyncing = false
  }
}

export async function manualDownloadMusicSources() {
  if (isSyncing) {
    toast('正在同步中，请稍后...')
    return
  }
  try {
    ensureWebDAVSyncEnabled()
  } catch (error: any) {
    toast(error.message)
    return
  }

  const confirm = await confirmDialog({
    title: '确认下载',
    message: '这将使用云端的 user_apis.json（兼容旧版 music_source.json）完全覆盖本地“音源”，确定要继续吗？',
    confirmButtonText: '下载',
  })
  if (!confirm) return

  isSyncing = true
  toast('开始下载音源...')
  try {
    const remoteData = await downloadMusicSourcesCompat([
      getRemoteMusicSourceFilePath(),
      getLegacyRemoteMusicSourceFilePath(),
    ])
    if (!remoteData) {
      toast('云端暂无音源数据')
      return
    }

    const currentApiSource = settingState.setting['common.apiSource']
    if (/^user_api/.test(currentApiSource)) {
      setApiSource(currentApiSource)
    }

    toast('音源下载成功！')
  } catch (error: any) {
    log.error(`[WebDAV Manual Download Music Sources] Failed: ${error.stack ?? error.message}`)
    toast(`下载失败: ${error.message}`, 'long')
  } finally {
    isSyncing = false
  }
}

export async function manualUploadMusicApiGateway() {
  if (isSyncing) {
    toast('正在同步中，请稍后...')
    return
  }
  try {
    ensureWebDAVSyncEnabled()
  } catch (error: any) {
    toast(error.message)
    return
  }

  const confirm = await confirmDialog({
    title: '确认上传',
    message: '这将使用本地的“音乐 API 网关”配置完全覆盖云端的 music_api_gateway.json，此操作不可逆，确定要继续吗？',
    confirmButtonText: '上传',
  })
  if (!confirm) return

  isSyncing = true
  toast('开始上传音乐 API 网关配置...')
  try {
    await uploadMusicGatewayConfig(getRemoteMusicGatewayFilePath())
    toast('音乐 API 网关配置上传成功！')
  } catch (error: any) {
    log.error(`[WebDAV Manual Upload Music API Gateway] Failed: ${error.stack ?? error.message}`)
    toast(`上传失败: ${error.message}`, 'long')
  } finally {
    isSyncing = false
  }
}

export async function manualDownloadMusicApiGateway() {
  if (isSyncing) {
    toast('正在同步中，请稍后...')
    return
  }
  try {
    ensureWebDAVSyncEnabled()
  } catch (error: any) {
    toast(error.message)
    return
  }

  const confirm = await confirmDialog({
    title: '确认下载',
    message: '这将使用云端的 music_api_gateway.json（兼容旧版 music_gateway.json）完全覆盖本地“音乐 API 网关”配置，确定要继续吗？',
    confirmButtonText: '下载',
  })
  if (!confirm) return

  isSyncing = true
  toast('开始下载音乐 API 网关配置...')
  try {
    const remoteData = await downloadMusicGatewayConfigCompat([
      getRemoteMusicGatewayFilePath(),
      getLegacyRemoteMusicGatewayFilePath(),
    ])
    if (!remoteData) {
      toast('云端暂无音乐 API 网关配置')
      return
    }
    toast('音乐 API 网关配置下载成功！')
  } catch (error: any) {
    log.error(`[WebDAV Manual Download Music API Gateway] Failed: ${error.stack ?? error.message}`)
    toast(`下载失败: ${error.message}`, 'long')
  } finally {
    isSyncing = false
  }
}

export async function manualUploadLists() {
  if (isSyncing) {
    toast('正在同步中，请稍后...')
    return
  }
  try {
    ensureWebDAVSyncEnabled()
  } catch (error: any) {
    toast(error.message)
    return
  }

  const confirm = await confirmDialog({
    title: '确认上传',
    message: '这将使用本地的“所有歌单”完全覆盖云端的数据，此操作不可逆，确定要继续吗？',
    confirmButtonText: '上传',
  })
  if (!confirm) return

  isSyncing = true
  toast('开始上传歌单...')
  try {
    const remoteListsPath = getRemoteListsFilePath()
    const { lists } = await getAllDataForSync()
    await uploadLists(remoteListsPath, lists)
    await clearOperationQueue()
    toast('歌单上传成功！')
  } catch (error: any) {
    log.error(`[WebDAV Manual Upload Lists] Failed: ${error.stack ?? error.message}`)
    toast(`上传失败: ${error.message}`, 'long')
  } finally {
    isSyncing = false
  }
}

export async function manualDownloadLists() {
  if (isSyncing) {
    toast('正在同步中，请稍后...')
    return
  }
  try {
    ensureWebDAVSyncEnabled()
  } catch (error: any) {
    toast(error.message)
    return
  }

  const confirm = await confirmDialog({
    title: '确认下载',
    message: '这将使用云端的“所有歌单”完全覆盖本地的数据，此操作不可逆，确定要继续吗？',
    confirmButtonText: '下载',
  })
  if (!confirm) return

  isSyncing = true
  toast('开始下载歌单...')
  try {
    const remoteListsPath = getRemoteListsFilePath()
    const remoteListsData = await downloadLists(remoteListsPath)
    if (remoteListsData) {
      const remoteData = normalizeRemoteListsData(remoteListsData)
      await overwriteListFull(remoteData.data)
      await applySyncedExtraData(remoteData)
      await clearOperationQueue()
      updateSetting({ 'sync.webdav.lastSyncTimeLists': remoteData.lastModified })
      toast('歌单下载同步完成！')
    } else {
      toast('云端未找到歌单文件')
    }
  } catch (error: any) {
    log.error(`[WebDAV Manual Download Lists] Failed: ${error.stack ?? error.message}`)
    toast(`下载失败: ${error.message}`, 'long')
  } finally {
    isSyncing = false
  }
}

export async function triggerWebDAVSync(isManual = false) {
  if (isSyncing) {
    if (isManual) toast('正在同步中，请稍后...')
    return
  }
  try {
    ensureWebDAVSyncEnabled()
  } catch (error: any) {
    if (isManual) toast(error.message)
    return
  }

  isSyncing = true
  if (isManual) toast('开始同步歌单...')

  const remoteListsPath = getRemoteListsFilePath()

  try {
    const remoteListsContent = await webdav.downloadFile(remoteListsPath)
    const localOpQueue = getOperationQueue()

    if (remoteListsContent === null) {
      log.info('[WebDAV Sync] Remote lists not found. Uploading local state.')
      const { lists } = await getAllDataForSync()
      await uploadLists(remoteListsPath, lists)
      await clearOperationQueue()
      if (isManual) toast('歌单上传成功！')
    } else {
      const remoteData = normalizeRemoteListsData(JSON.parse(remoteListsContent))
      const remoteTimestamp = remoteData.lastModified
      const localTimestamp = settingState.setting['sync.webdav.lastSyncTimeLists'] ?? 0

      if (localTimestamp === 0) {
        log.info('[WebDAV Sync] First sync detected with existing remote data. Prompting user.')
        const userChoice = await confirmDialog({
          title: '首次同步确认',
          message: '云端已存在歌单数据。由于这是该设备上首次同步，请选择您的操作：\n\n“下载”：将使用云端数据覆盖本地（推荐用于恢复数据）。\n“上传”：将使用本地数据覆盖云端（请务必确认本地数据是您最终想要的版本）。',
          cancelButtonText: '下载云端并覆盖本地',
          confirmButtonText: '上传本地并覆盖云端',
        })

        if (userChoice === true) {
          log.info('[WebDAV Sync] User chose to upload local state during first sync.')
          const { lists: currentLocalLists } = await getAllDataForSync()
          await uploadLists(remoteListsPath, currentLocalLists)
          await clearOperationQueue()
          toast('本地歌单已上传覆盖云端！')
          return
        } else if (userChoice === false) {
          log.info('[WebDAV Sync] User chose to download remote state during first sync.')
          await overwriteListFull(remoteData.data)
          await applySyncedExtraData(remoteData)
          await clearOperationQueue()
          updateSetting({ 'sync.webdav.lastSyncTimeLists': remoteTimestamp })
          toast('已从云端同步歌单数据到本地！')
          return
        } else {
          log.info('[WebDAV Sync] First sync resolution cancelled.')
          if (isManual) toast('同步已取消')
          return
        }
      }

      const hasRemoteUpdate = remoteTimestamp > localTimestamp
      const hasLocalChanges = localOpQueue.length > 0 || listsChanged || await hasLocalExtraDataChanges(remoteData)

      if (hasRemoteUpdate) {
        log.info('[WebDAV Sync] Remote is newer. Starting merge process.')
        let mergedData = remoteData.data
        let conflictOccurred = false

        if (hasLocalChanges) {
          nextListsUploadExtraData = await getMergedExtraData(remoteData)
          log.info(`[WebDAV Sync] Applying ${localOpQueue.length} local operations onto remote data.`)
          try {
            for (const op of localOpQueue) {
              mergedData = await applyListOperation(mergedData, op)
            }
          } catch (error: any) {
            conflictOccurred = true
            log.error('[WebDAV Sync] A true conflict occurred during operation merge:', error.message)
          }
        }

        if (conflictOccurred) {
          nextListsUploadExtraData = null
          const userChoice = await confirmDialog({
            title: '同步冲突',
            message: '云端和本地的歌单修改无法自动合并。请选择要保留的版本：\n\n为防止意外，建议在操作前先备份当前歌单。',
            cancelButtonText: '云端覆盖本地',
            confirmButtonText: '本地覆盖云端',
          })
          if (userChoice === true) {
            log.info('[WebDAV Sync] Conflict resolved by user: Force pushing local state.')
            const { lists: currentLocalLists } = await getAllDataForSync()
            await uploadLists(remoteListsPath, currentLocalLists)
            await clearOperationQueue()
            toast('已强制使用本地歌单覆盖云端！')
          } else if (userChoice === false) {
            log.info('[WebDAV Sync] Conflict resolved by user: Force pulling remote state.')
            await overwriteListFull(remoteData.data)
            await applySyncedExtraData(remoteData)
            await clearOperationQueue()
            updateSetting({ 'sync.webdav.lastSyncTimeLists': remoteTimestamp })
            toast('已从云端同步歌单，本地更改已放弃！')
          } else {
            log.info('[WebDAV Sync] Conflict resolution cancelled by user.')
            toast('操作已取消')
          }
        } else {
          log.info('[WebDAV Sync] Merge successful or only remote changes detected.')
          await overwriteListFull(mergedData)
          if (hasLocalChanges) {
            await uploadLists(remoteListsPath, mergedData)
            await applyMergedExtraData(remoteData)
            if (isManual) toast('歌单合并同步成功！')
          } else {
            await applySyncedExtraData(remoteData)
            updateSetting({ 'sync.webdav.lastSyncTimeLists': remoteTimestamp })
            if (isManual) toast('歌单已从云端同步！')
          }
          await clearOperationQueue()
        }
      } else if (hasLocalChanges) {
        log.info('[WebDAV Sync] Local has unsynced changes. Uploading.')
        const { lists: currentLocalLists } = await getAllDataForSync()
        await uploadLists(remoteListsPath, currentLocalLists)
        await clearOperationQueue()
        if (isManual) toast('本地歌单已上传！')
      } else if (isManual) {
        log.info('[WebDAV Sync] Lists are up to date.')
        toast('歌单已是最新，无需同步')
      }
    }
  } catch (error: any) {
    log.error(`[WebDAV Sync] Sync failed: ${error.stack ?? error.message}`)
    toast(`同步失败: ${error.message}`, 'long')
  } finally {
    isSyncing = false
  }
}
