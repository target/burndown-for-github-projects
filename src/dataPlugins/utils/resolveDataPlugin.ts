import path from 'node:path'

import fs from 'fs-extra'
import { cosmiconfigSync } from 'cosmiconfig'

import type DataPlugin from '../../types/DataPlugin'

export const resolveDataPlugin = (
  pluginName: string,
  /* eslint-disable-next-line */
  pluginConfig: any
): DataPlugin => {
  const pluginDir = path.join(__dirname, '../', 'dataPlugins')
  const pluginFiles = fs
    .readdirSync(pluginDir)
    .map((fileName) => fileName.replace(/\..+$/, ''))
    .reduce((agg, item) => {
      if (!agg.includes(item)) {
        agg = [...agg, item]
      }
      return agg
    }, [])

  const pluginFile = pluginFiles.find(
    (pluginFileName) =>
      pluginFileName.toLowerCase() === pluginName.toLowerCase(),
  )

  if (!pluginFile) {
    throw new Error(
      `Data plugin "${pluginName}" was not found. Plugin options:\n${pluginFiles
        .map((pluginFileName) => `"${pluginFileName}"`)
        .join(', ')}`,
    )
  }

  const pluginPath = path.join(pluginDir, pluginFile)

  const Plugin = require(pluginPath).default

  return new Plugin(pluginConfig)
}

const { type: dataPluginType, config: dataPluginConfig } =
  cosmiconfigSync('burndown').search().config.dataPlugin

resolveDataPlugin(dataPluginType, dataPluginConfig) as DataPlugin
