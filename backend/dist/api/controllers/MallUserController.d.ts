import { Request, Response } from 'express';
export interface MallUserQueryParams {
    date: string;
    mobile?: string;
    page?: number;
    pageSize?: number;
}
export declare class MallUserController {
    static queryMallUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static exportMallUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=MallUserController.d.ts.map