import { format, formatDistanceToNow } from 'date-fns'

export const fmtDate = (d) => {
  try { return format(new Date(d), 'MMM d, HH:mm:ss') } catch { return d }
}
export const fmtDateShort = (d) => {
  try { return format(new Date(d), 'HH:mm:ss') } catch { return d }
}
export const timeAgo = (d) => {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }) } catch { return 'Unknown' }
}
export const round2 = (n) => Math.round(n * 100) / 100

export function getStatusLabel(status) {
  return { normal: 'Normal', warning: 'Warning', critical: 'Critical', offline: 'Offline' }[status] || status
}

export function downloadBlob(data, filename) {
  const url = URL.createObjectURL(new Blob([data]))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
