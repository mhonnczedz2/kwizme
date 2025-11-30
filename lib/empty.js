// Browser polyfill for Node.js path module
export const join = (...args) => args.filter(Boolean).join('/').replace(/\/+/g, '/')
export const resolve = (...args) => join(...args)
export const dirname = (path) => path.split('/').slice(0, -1).join('/')
export const basename = (path) => path.split('/').pop()
export const extname = (path) => {
  const parts = path.split('.')
  return parts.length > 1 ? '.' + parts.pop() : ''
}
export const normalize = (path) => {
  if (!path || path === '/') return path || '/'
  // Remove duplicate slashes and resolve . and ..
  const parts = path.split('/').filter(p => p && p !== '.')
  const normalized = []
  for (const part of parts) {
    if (part === '..') {
      normalized.pop()
    } else {
      normalized.push(part)
    }
  }
  const result = normalized.join('/')
  // Preserve leading slash
  return path.startsWith('/') ? '/' + result : result
}
export const sep = '/'
export const delimiter = ':'

export default {
  join,
  resolve,
  dirname,
  basename,
  extname,
  normalize,
  sep,
  delimiter
}
