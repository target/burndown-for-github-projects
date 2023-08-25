import { Collection, MongoClient } from 'mongodb'
import { ChartPointCollection } from '../types/Chart'
import DataPlugin, { GetParams, SetParams } from '../types/DataPlugin'
import { DBChartPoint, MongoDatabaseConfig } from '../types/MongoDBPlugin'

class MongoDBPlugin implements DataPlugin {
  constructor(config: MongoDatabaseConfig) {
    this.config = config
  }

  config: MongoDatabaseConfig
  client: MongoClient = null
  collection: Collection<DBChartPoint> = null

  connect = async (): Promise<any> => {
    try {
      const connectionString = (() => {
        if ('connectionString' in this.config) {
          return this.config.connectionString
        }

        const auth =
          this.config.user?.length && this.config.password?.length
            ? `${this.config.user}:${this.config.password}@`
            : ''

        const authQuery = Object.entries({
          replicaSet: this.config.replicaSet,
          authSource: this.config.authenticationDatabase,
          // Use a direct connection when there is no replicaSet
          // https://www.mongodb.com/docs/drivers/go/current/fundamentals/connection/#direct-connection
          directConnection: !this.config.replicaSet,
        })
          .filter(([, paramValue]) => !!paramValue)
          .map((queryParamEntry) => queryParamEntry.join('='))
          .join('&')

        return `mongodb://${auth}${this.config.host}:${this.config.port}/${this.config.databaseName}?${authQuery}`
      })()

      const mongo = new MongoClient(connectionString)

      this.client = await mongo.connect()

      // initial database scaffolding
      const db = this.client.db(this.config.databaseName)

      // create or find collection
      const hasCollection = db.listCollections(
        // TODO: improve this
        (this.config.collection as unknown) as Document
      )

      if (!hasCollection) {
        await db.createCollection(this.config.collection)
      }

      // save reference for future calls
      this.collection = db.collection(this.config.collection)

      return this.collection
    } catch (err) {
      console.log('Error while attempting to connect to database')
      console.log(err.message)
      process.exit(1)
    }
  }

  get = async ({ sprint }: GetParams): Promise<ChartPointCollection> => {
    await this.connect()

    try {
      const rawData = await this.collection.find({ sprint }).toArray()

      const formattedData: ChartPointCollection = Object.fromEntries(
        rawData.map(({ _id, ...chartPoint }) => [_id, chartPoint])
      )

      return formattedData
    } catch (err) {
      console.log(
        'Error while attempting to retrieve new record to database for sprint %s : %s ',
        sprint,
        err.message
      )
    }
  }

  set = async ({ sprint, newData }: SetParams): Promise<void> => {
    await this.connect()
    try {
      await this.collection.insertMany(
        newData.map((chartPoint) => ({
          _id: undefined,
          sprint,
          ...chartPoint,
        }))
      )
    } catch (err) {
      console.log(
        'Error while attempting to write new record to database for sprint %s : %s ',
        sprint,
        err.message
      )
    }
  }
}

export default MongoDBPlugin
