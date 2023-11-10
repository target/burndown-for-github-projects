import fs from 'fs-extra'
import path from 'path'
import { ChartPoint, ChartPointCollection } from '../types/Chart'
import DataPlugin, { GetParams, SetParams } from '../types/DataPlugin'
import * as uuid from 'uuid'

class FileSystemPlugin implements DataPlugin {
  storageFilePath = (fileName: string): string => {
    if (!/\.json$/.test(fileName)) {
      fileName = `${fileName}.json`
    }

    return path.join(process.cwd(), 'data', fileName)
  }

  getRaw = async <T extends { [k: string]: ChartPoint & { sprint: string } }>({
    sprint,
  }: GetParams): Promise<T> => {
    await fs.ensureFile(this.storageFilePath(sprint))

    const rawData =
      (await fs.readFile(this.storageFilePath(sprint), 'utf-8')) ||
      JSON.stringify({})

    const data: T = JSON.parse(rawData)

    return data
  }

  get = async ({ sprint }: GetParams): Promise<ChartPointCollection> => {
    const data = await this.getRaw({ sprint })

    const filteredData = Object.entries(data)
      .filter(([, v]) => v.sprint === sprint)
      .reduce((agg, [k, v]) => {
        delete v.sprint
        return {
          ...agg,
          [k]: v,
        }
      }, {})

    return filteredData
  }

  set = async ({ sprint, newData }: SetParams): Promise<void> => {
    const oldData = await this.getRaw({ sprint })
    const data = {
      ...oldData,
      ...newData.reduce(
        (agg, chartPoint) => ({
          ...agg,
          [uuid.v4()]: {
            ...chartPoint,
            sprint,
          },
        }),
        {},
      ),
    }

    const jsonData = JSON.stringify(data, null, 2)
    await fs.writeFile(this.storageFilePath(sprint), jsonData)
  }
}

export default FileSystemPlugin
