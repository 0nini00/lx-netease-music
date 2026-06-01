import { httpFetch } from './request'
import { appSetting } from '@renderer/store/setting'

const successCodes = new Set([200, 201, 204, 207])

const normalizeBaseUrl = url => url.trim().replace(/\/+$/, '')

const normalizeRemotePath = path => {
  let targetPath = (path || '/').trim().replace(/\\/g, '/')
  if (!targetPath.startsWith('/')) targetPath = `/${targetPath}`
  targetPath = targetPath.replace(/\/+/g, '/')
  return targetPath
}

const joinRemotePath = (...paths) => normalizeRemotePath(paths.join('/'))

const buildUrl = path => {
  const baseUrl = normalizeBaseUrl(appSetting['sync.webdav.url'])
  if (!baseUrl) throw new Error('WebDAV URL 未配置')
  return `${baseUrl}${normalizeRemotePath(path).split('/').map((part, index) => index ? encodeURIComponent(part) : '').join('/')}`
}

const buildHeaders = (headers = {}) => {
  const username = appSetting['sync.webdav.username'].trim()
  const password = appSetting['sync.webdav.password']
  if (!username) throw new Error('WebDAV 用户名未配置')

  return {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    ...headers,
  }
}

const requestWebDAV = async(path, options = {}) => {
  const resp = await httpFetch(buildUrl(path), {
    timeout: 20000,
    ...options,
    headers: buildHeaders(options.headers),
    format: options.format ?? 'text',
  }).promise

  return resp
}

const isSuccess = statusCode => successCodes.has(statusCode)

export const getWebDAVRootPath = () => normalizeRemotePath(appSetting['sync.webdav.path'] || '/LX_Music/')

export const getWebDAVFilePath = fileName => joinRemotePath(getWebDAVRootPath(), fileName)

export const testWebDAVConnection = async() => {
  const resp = await requestWebDAV('/', {
    method: 'PROPFIND',
    headers: {
      Depth: '0',
    },
  })
  if (!isSuccess(resp.statusCode)) throw new Error(resp.statusMessage || `HTTP ${resp.statusCode}`)
}

const exists = async(path) => {
  const resp = await requestWebDAV(path, {
    method: 'PROPFIND',
    headers: {
      Depth: '0',
    },
  })
  if (isSuccess(resp.statusCode)) return true
  if (resp.statusCode == 404 || resp.statusCode == 409) return false
  throw new Error(resp.statusMessage || `HTTP ${resp.statusCode}`)
}

export const ensureWebDAVDirectory = async(path) => {
  const segments = normalizeRemotePath(path).split('/').filter(Boolean)
  let currentPath = ''

  for (const segment of segments) {
    currentPath = joinRemotePath(currentPath, segment)
    if (await exists(currentPath)) continue

    const resp = await requestWebDAV(currentPath, {
      method: 'MKCOL',
    })
    if (!isSuccess(resp.statusCode) && resp.statusCode != 405) {
      throw new Error(resp.statusMessage || `HTTP ${resp.statusCode}`)
    }
  }
}

export const uploadWebDAVFile = async(path, content) => {
  const remotePath = normalizeRemotePath(path)
  const dirPath = remotePath.substring(0, remotePath.lastIndexOf('/')) || '/'
  await ensureWebDAVDirectory(dirPath)

  const resp = await requestWebDAV(remotePath, {
    method: 'PUT',
    body: content,
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
  })
  if (!isSuccess(resp.statusCode)) throw new Error(resp.statusMessage || `HTTP ${resp.statusCode}`)
}

export const downloadWebDAVFile = async(path) => {
  const resp = await requestWebDAV(path, {
    method: 'GET',
  })
  if (resp.statusCode == 404 || resp.statusCode == 409) return null
  if (!isSuccess(resp.statusCode)) throw new Error(resp.statusMessage || `HTTP ${resp.statusCode}`)
  return typeof resp.body == 'string' ? resp.body : JSON.stringify(resp.body)
}
