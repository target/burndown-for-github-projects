const mockExpressMethods = {
  use: jest.fn(),
  listen: jest.fn(),
  Router: jest.fn(),
}
const mockExpress = jest.fn(() => mockExpressMethods)

describe('express app', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    jest.mock('../routes')
    jest.mock('express', () => ({
      __esModule: true,
      default: mockExpress,
      Router: jest.fn(() => ({
        get: jest.fn(),
        use: jest.fn(),
      })),
    }))
    jest.mock('node-cron')
  })

  afterEach(() => {
    process.env = {
      ...processEnv,
    }
  })

  it('applies the imported routes to an express app', () => {
    jest.mock('../routes', () => 'some routes')
    require('../app')

    expect(mockExpress).toHaveBeenCalled()
    expect(mockExpressMethods.use).toHaveBeenCalledWith('some routes')
  })

  it('listens on a provided port', () => {
    process.env.PORT = '5050'
    require('../app')

    const [port] = mockExpressMethods.listen.mock.calls[0]
    expect(port).toBe('5050')
  })

  it('defaults to port 8080', () => {
    require('../app')

    const [port] = mockExpressMethods.listen.mock.calls[0]
    expect(port).toBe('8080')
  })
})

const processEnv = {
  ...process.env,
}
