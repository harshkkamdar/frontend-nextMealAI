export class ApiException extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    public code?: string,
    public details?: string
  ) {
    super(details ?? error)
    this.name = 'ApiException'
  }
}
