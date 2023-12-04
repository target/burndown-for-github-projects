import { Response } from 'express'
import PublicError from '../PublicError'
import { StatusCodes } from 'http-status-codes'

describe('new PublicError(...)', () => {
  it('is an instance of an Error', () => {
    const err = new PublicError()
    expect(err).toBeInstanceOf(Error)
  })

  it('accepts nothing without crashing', () => {
    new PublicError()
  })
  it('accepts an object without crashing', () => {
    new PublicError({})
  })
  it('accepts an error without crashing', () => {
    new PublicError(new Error('Foo'))
  })

  it.each([
    new PublicError(),
    new PublicError({}),
    new PublicError(new Error('foo')),
  ])('sets a default status code', (err) => {
    expect(err.statusCode).toBe(500)
  })

  it.each([
    new PublicError(),
    new PublicError({}),
    new PublicError(new Error()),
    new PublicError(new Error('foo')),
  ])('sets a default error message', (err) => {
    expect(err.message).toBe('An error occurred while processing your request')
  })

  it('applies a supplied error message', () => {
    const err = new PublicError({ message: 'Hello World' })
    expect(err.message).toBe('Hello World')
  })

  it('applies a supplied status code', () => {
    const err = new PublicError({ status: StatusCodes.UNPROCESSABLE_ENTITY })
    // Yes, we expect an integer out despite putting a string in
    expect(err.statusCode).toBe(422)
  })

  it('applies the error message to the internal message', () => {
    const baseError = new Error('<some leaked credentials here>')
    const err = new PublicError(baseError)
    expect(err.internalMessage).toBe('<some leaked credentials here>')
  })

  it('captures the stack trace', () => {
    const arctic = () =>
      new PublicError({ message: 'Leonardo Dicaprio was here' })
    const hotel = () => arctic()
    const city = () => hotel()
    const err = city()
    const [, ...stackLines] = err.stack.split('\n')
    expect(stackLines[0]).toMatch(/at arctic/)
    expect(stackLines[1]).toMatch(/at hotel/)
    expect(stackLines[2]).toMatch(/at city/)
  })

  it('inherits the stacktrace from an error', () => {
    const the_library = () => {
      throw new Error('Meet me')
    }
    const four_oclock = () => {
      try {
        the_library()
      } catch (err) {
        return new PublicError(err)
      }
    }
    const err = four_oclock()
    const stackLines = err.stack.split('\n')
    expect(stackLines[0]).toMatch(/Meet me/)
    expect(stackLines[1]).toMatch(/at the_library/)
    expect(stackLines[2]).toMatch(/at four_oclock/)
  })

  it('has the correct error name', () => {
    const err = new PublicError()
    expect(err.toString()).toMatch(/^PublicError:/)
  })

  it('applies a status and message during handle() (as a number)', () => {
    const res = {
      status: jest.fn(function status() {
        return this
      }),
      send: jest.fn(),
    } as unknown as Response
    const err = new PublicError({
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      message: 'Nope',
    })
    err.handle(res)
    expect(res.status).toHaveBeenCalledWith(422)
    expect(res.send).toHaveBeenCalledWith('Nope')
  })
})
