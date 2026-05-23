import api from './api'

export async function downloadGeneratedFile(downloadUrl, filename) {
  const apiPath = downloadUrl?.startsWith('/api/')
    ? downloadUrl.slice(4)
    : downloadUrl

  const { data } = await api.get(apiPath, { responseType: 'blob' })
  const blobUrl = URL.createObjectURL(data)
  const anchor = document.createElement('a')

  anchor.href = blobUrl
  anchor.download = filename || 'download'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(blobUrl)
}
