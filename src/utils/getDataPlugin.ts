import path from 'path'

import { cosmiconfigSync } from 'cosmiconfig'
import fs from 'fs-extra'

import type DataPlugin from '../types/DataPlugin'
import { resolveFromAppRoot } from './appRoot'

let dataPlugin: DataPlugin

export const getDataPlugin = (): DataPlugin => {
  if (dataPlugin) {
    return dataPlugin
  }

  const { type: pluginName, config: pluginConfig } =
    cosmiconfigSync('burndown').search()?.config?.dataPlugin || {}

  if (!pluginName) {
    console.warn(
      'No data plugin name provided from configuration. Using default FileSystem plugin.',
    )
    const FileSystemDataPlugin = require('../dataPlugins/FileSystem').default

    dataPlugin = new FileSystemDataPlugin({})

    return dataPlugin
  }

  const pluginDir = resolveFromAppRoot('dataPlugins')

  try {
    const pluginPath = path.join(pluginDir, pluginName)

    const Plugin = require(pluginPath).default

    dataPlugin = new Plugin(pluginConfig)

    return dataPlugin
  } catch (err) {
    const pluginFiles = fs
      .readdirSync(pluginDir)
      .map((fileName) => fileName.replace(/\..+$/, ''))
      .reduce((agg, item) => {
        if (!agg.includes(item)) {
          agg = [...agg, item]
        }
        return agg
      }, [])

    throw new Error(
      `Data plugin "${pluginName}" was not found. Plugin options:\n${pluginFiles
        .map((pluginFileName) => `"${pluginFileName}"`)
        .join(', ')}`,
    )
  }
}
