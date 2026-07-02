export class UnprocessableContentException extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnprocessableContentException'
  }
}
