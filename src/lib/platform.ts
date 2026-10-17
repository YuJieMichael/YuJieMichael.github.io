/** 苹果设备用 ⌘，其他用 Ctrl */
export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

/** 把文案里的「⌘K」换成当前平台的写法 */
export const withModKey = (text: string) => (isMac ? text : text.replace('⌘K', 'Ctrl K'))
