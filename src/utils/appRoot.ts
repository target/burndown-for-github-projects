import path from 'path'

export const appRoot = path.resolve(__dirname, '../')
export const resolveFromAppRoot = (...resolvePathParts: string[]): string =>
  path.resolve(appRoot, ...resolvePathParts)
