import { Request, Response, NextFunction } from 'express';
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const rateLimitLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const sqlLoggerMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare function logSqlQueryToRequest(req: Request, sql: string, params: any[], duration: number, success: boolean): void;
export declare const performanceMonitor: (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    requestLogger: (req: Request, res: Response, next: NextFunction) => void;
    rateLimitLogger: (req: Request, res: Response, next: NextFunction) => void;
    sqlLoggerMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    performanceMonitor: (req: Request, res: Response, next: NextFunction) => void;
    logSqlQueryToRequest: typeof logSqlQueryToRequest;
};
export default _default;
//# sourceMappingURL=requestLogger.d.ts.map