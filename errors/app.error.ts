// Lỗi nghiệp vụ mang sẵn HTTP status code.
// Service chỉ việc `throw`, middleware errorHandler sẽ đọc statusCode để trả response,
// nên controller không cần try/catch (Express 5 tự chuyển lỗi của hàm async sang errorHandler).
export class AppError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Missing or invalid API key (header x-api-key).') {
    super(401, message);
  }
}

export class LinkNotFoundError extends AppError {
  constructor(code: string) {
    super(404, `Link "${code}" not found.`);
  }
}

export class LinkExistsError extends AppError {
  constructor(code: string) {
    super(409, `Code "${code}" is already in use.`);
  }
}

export class LinkInactiveError extends AppError {
  constructor(code: string) {
    super(410, `Link "${code}" has been disabled.`);
  }
}

export class LinkExpiredError extends AppError {
  constructor(code: string) {
    super(410, `Link "${code}" has expired.`);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(retryAfterSeconds: number) {
    super(429, `Too many requests. Try again in ${retryAfterSeconds}s.`);
  }
}

export class CodeGenerationError extends AppError {
  constructor() {
    super(500, 'Cannot generate a unique code after multiple attempts.');
  }
}
