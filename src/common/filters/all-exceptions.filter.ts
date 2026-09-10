import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: {
      status: (code: number) => {
        json: (body: {
          statusCode: number;
          message: string | string[];
          timestamp: string;
          path: string;
        }) => unknown;
      };
    } = ctx.getResponse();
    const request: { url: string } = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const errorResponse = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

        if (errorResponse.message) {
          message = errorResponse.message;
        } else if (errorResponse.error) {
          message = errorResponse.error;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Show complete error in terminal
    console.error('\n========================================');
    console.error('ERROR');
    console.error('========================================');
    console.error(exception);
    console.error('========================================\n');

    // Send actual error to Postman
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
