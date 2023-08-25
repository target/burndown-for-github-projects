import { Response } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

type PublicErrorConstructorArguments = Partial<{
  message: string
  internalMessage: string
  status: StatusCodes
}>

const defaultStatusCode: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR
const defaultMessage = 'An error occurred while processing your request'

class PublicError extends Error {
  constructor(err: Error | PublicErrorConstructorArguments = {}) {
    super(err instanceof Error || !err.message ? defaultMessage : err.message)
    Object.setPrototypeOf(this, PublicError.prototype)
    this.name = this.constructor.name

    let status: StatusCodes
    if (err instanceof Error) {
      this.internalMessage = err.message
      this.stack = err.stack
      status = defaultStatusCode
    } else {
      this.internalMessage = err.internalMessage
      status = err.status || defaultStatusCode
      Error.captureStackTrace(this, this.constructor)
    }

    this.statusCode = status
  }

  internalMessage?: string

  statusCode: StatusCodes

  handle = (res: Response): void => {
    if (this.internalMessage) {
      console.log(this.stack)
    }
    res.status(this.statusCode).send(this.message)
  }
}

export default PublicError
