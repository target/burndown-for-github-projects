import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const routes = Router()
fs.readdirSync(__dirname).map((fileName) => {
  const routeFileMatch = /^(?<routeName>\w+?)_?route\.[tj]s$/i.exec(fileName)
  if (!routeFileMatch) {
    return
  }

  const routePath = `/${routeFileMatch.groups.routeName}`.toLowerCase()
  const filePath = path.join(__dirname, fileName)
  let routeModule = require(filePath)
  if (routeModule.default) {
    routeModule = routeModule.default
  }

  routes.use(routePath, routeModule)
  console.log('Applied route: %s', routePath)
})

export default routes
