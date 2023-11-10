import fs from 'fs-extra'
import path from 'path'
import { Router } from 'express'

const baseConsoleLog = console.log

describe('routes/index.ts', () => {
  beforeAll(() => {
    clearTmpFiles()
    console.log = jest.fn()
  })

  beforeEach(() => {
    jest.resetModules()
  })

  afterAll(() => {
    console.log = baseConsoleLog
  })

  it('runs without crashing', () => {
    makeRoutes([])
  })

  it('runs for TS files without crashing', () => {
    makeRoutes(['testroute.ts'])
  })

  it('runs for JS files without crashing', () => {
    makeRoutes(['testroute.js'])
  })

  describe('multiple route parsing', () => {
    const routeEntries = {
      // File name: expected route,
      'typescriptPascalRoute.ts': '/typescriptpascal',
      'typescript_snake_route.ts': '/typescript_snake',
      'TYPESCRIPT_SCREAMING_SNAKE_ROUTE.ts': '/typescript_screaming_snake',
      'javascriptPascalRoute.js': '/javascriptpascal',
      'javascript_snake_route.js': '/javascript_snake',
      'JAVASCRIPT_SCREAMING_SNAKE_ROUTE.js': '/javascript_screaming_snake',
    }
    let routes: Router['stack']

    beforeAll(() => {
      jest.resetModules()
      routes = makeRoutes(Object.keys(routeEntries)).stack
    })

    test('creates the right number of routes', () => {
      expect(routes).toHaveLength(Object.values(routeEntries).length)
    })

    test.each(Object.entries(routeEntries))(
      'uses %s to create a %s route',
      (routeFile, routePath) => {
        const matchedRoute = routes.find((route) =>
          route.regexp.test(routePath),
        )
        expect(matchedRoute).toBeDefined()

        // Remove the matched route from the list
        const matchedRouteIndex = routes.indexOf(matchedRoute)
        routes.splice(matchedRouteIndex, 1)
      },
    )

    test('consumed all routes', () => {
      expect(routes).toHaveLength(0)
    })
  })

  it('does not create a route for non-matched files', () => {
    const routes = makeRoutes([
      'route_it_does_not_end_with.js', // Thanks, Yoda
      'not_a_js-ts_file_route.md',
      'uses-forbidden-symbolsroute.ts',
      'test_file.test.ts',
    ]).stack

    expect(routes).toHaveLength(0)
  })
})

const makeTmpFiles = (tmpFileNames: string[]) => {
  const routeBody = `
const TestRoute = Router()

TestRoute.get('/', (req, res) => {
  res.sendStatus(200)
})
`

  const tsFileContents = `
import { Router } from 'express'

${routeBody}

export default TestRoute
`

  const jsFileContents = `
const { Router } = require('express')

${routeBody}

module.exports = TestRoute
`
  tmpFileNames.forEach((fileName) => {
    fs.writeFileSync(
      path.join(tmpDir, fileName),
      path.extname(fileName) === '.js' ? jsFileContents : tsFileContents,
      {
        encoding: 'utf-8',
      },
    )
  })
}

const tmpDir = path.join(__dirname, 'tmp')
const clearTmpFiles = () => {
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, {
      force: true,
      recursive: true,
    })
  }
}

const makeRoutes = (tmpFiles: string[]) => {
  fs.mkdirSync(tmpDir)
  makeTmpFiles(tmpFiles)
  const routesSrc = require.resolve('../')
  const routesTmpDest = path.join(tmpDir, path.basename(routesSrc))
  fs.copyFileSync(routesSrc, routesTmpDest)
  const routes: Router = require(routesTmpDest).default

  clearTmpFiles()
  return routes
}
