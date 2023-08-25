import express, { IRouter, RequestHandler } from 'express'
import supertest, { SuperTest, Test } from 'supertest'

type Route = {
  handle: (
    req: Partial<Parameters<RequestHandler>[0]>,
    res: Partial<Parameters<RequestHandler>[1]>
  ) => ReturnType<RequestHandler>
}

export const findRoute = (
  router: IRouter,
  method: string,
  path: string
): Route | undefined => {
  const r = router.stack.find(
    ({ route, regexp }) =>
      regexp.test(path) && !!route.methods[method.toLowerCase()]
  )
  return r
}

export const request = (route: IRouter): SuperTest<Test> => {
  const app = express()
  app.use('/', route)
  return supertest(app)
}
