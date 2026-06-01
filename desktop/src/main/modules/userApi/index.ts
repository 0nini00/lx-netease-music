import { closeWindow } from './main'
import {
  getUserApis,
  getUserApisFull,
  importApi as handleImportApi,
  overwriteUserApisFull,
  removeApi as handleRemoveApi,
  setAllowShowUpdateAlert as saveAllowShowUpdateAlert,
} from './utils'
import { loadApi, setAllowShowUpdateAlert as setRendererEventAllowShowUpdateAlert, init } from './rendererEvent/rendererEvent'

let userApiId: string | null

export const getApiList = getUserApis

export const importApi = async(script: string): Promise<LX.UserApi.ImportUserApi> => {
  return {
    apiInfo: await handleImportApi(script),
    apiList: getUserApis(),
  }
}
export const removeApi = async(ids: string[]): Promise<LX.UserApi.UserApiInfo[]> => {
  if (userApiId && ids.includes(userApiId)) {
    userApiId = null
    await closeWindow()
  }
  handleRemoveApi(ids)
  return getUserApis()
}

export const exportApiFull = async(): Promise<LX.UserApi.UserApiSyncData> => {
  return getUserApisFull()
}

export const overwriteApiFull = async(apis: LX.UserApi.UserApiSyncData): Promise<LX.UserApi.UserApiInfo[]> => {
  if (userApiId) {
    userApiId = null
    await closeWindow()
  }
  overwriteUserApisFull(apis)
  return getUserApis()
}

export const setApi = async(id: string) => {
  if (userApiId) {
    userApiId = null
    await closeWindow()
  }
  const apiList = getUserApis()
  if (!apiList.some(a => a.id === id)) return
  userApiId ||= id
  await loadApi(id)
}

export const setAllowShowUpdateAlert = (id: string, enable: boolean) => {
  saveAllowShowUpdateAlert(id, enable)
  setRendererEventAllowShowUpdateAlert(id, enable)
}


export * from './rendererEvent/rendererEvent'

export default () => {
  init()

  global.lx.event_app.on('main_window_close', () => {
    void closeWindow()
  })
}
