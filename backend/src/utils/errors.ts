export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: Record<string, string>;

  constructor(
    code: string,
    message: string,
    statusCode: number,
    details: Record<string, string> = {}
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Task does not exist') {
    super('NOT_FOUND', message, 404, {});
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, string>) {
    super('VALIDATION_ERROR', 'Validation failed', 400, details);
  }
}

export class InvalidIdError extends AppError {
  constructor(message: string = 'Invalid task ID format') {
    super('INVALID_ID', message, 400, {});
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super('INTERNAL_ERROR', message, 500, {});
  }
}
