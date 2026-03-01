import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode: number);
}
export declare class ClientError extends AppError {
    constructor(message?: string, statusCode?: number);
}
export declare class AuthenticationError extends ClientError {
    constructor(message?: string);
}
export declare class AuthorizationError extends ClientError {
    constructor(message?: string);
}
export declare class NotFoundError extends ClientError {
    constructor(message?: string);
}
export declare class ValidationError extends ClientError {
    constructor(message?: string);
}
export declare class ServerError extends AppError {
    constructor(message?: string);
}
export declare class DatabaseError extends ServerError {
    constructor(message?: string);
}
export declare class ExternalApiError extends ServerError {
    constructor(message?: string);
}
export declare const errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validationErrorHandler: (error: any, req: Request, res: Response, next: NextFunction) => void;
export declare const databaseErrorHandler: (error: any, req: Request, res: Response, next: NextFunction) => void;
export declare const externalApiErrorHandler: (error: any, req: Request, res: Response, next: NextFunction) => void;
export declare const securityErrorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
export declare const errorHandlingChain: ((error: Error, req: Request, res: Response, next: NextFunction) => void)[];
//# sourceMappingURL=errorHandler.d.ts.map