const env = require('dotenv')

env.config({
  override: true,
})

const {
  DB_AUTH_DB,
  DB_COLLECTION,
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  DB_REPLICASET,
} = process.env

module.exports = {
  dataPlugin: {
    type: 'MongoDB',
    config: {
      authenticationDatabase: DB_AUTH_DB,
      collection: DB_COLLECTION || 'sprints',
      host: DB_HOST,
      databaseName: DB_NAME || 'burndown',
      password: DB_PASSWORD,
      port: DB_PORT || 27017,
      user: DB_USER || 'burndown',
      replicaSet: DB_REPLICASET,
      // Alt - Pass connectionString directly:
      // connectionString: 'mongodb://.....',
    },
  },
}
