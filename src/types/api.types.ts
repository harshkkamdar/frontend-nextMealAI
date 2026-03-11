export interface ApiError {
  error: string
  code?: string
  message?: string
  statusCode: number
}

export class ApiException extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly error: string,
    public readonly code?: string,
    message?: string
  ) {
    super(message ?? error)
    this.name = 'ApiException'
  }
}
