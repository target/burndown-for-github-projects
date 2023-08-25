import { Document } from 'mongodb'
import { ChartPoint } from './Chart'

export type MongoConnectionConfig =
  | {
      connectionString: string
    }
  | {
      user?: string
      password?: string
      host: string
      port: number | string
      databaseName: string
      authenticationDatabase?: string
      replicaSet?: string
    }

export type MongoDatabaseConfig = MongoConnectionConfig & {
  databaseName: string
  collection: string
}

export interface DBChartPoint extends Document, ChartPoint {
  _id: string | undefined
  sprint: string
}
