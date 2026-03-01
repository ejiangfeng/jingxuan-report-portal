import { Request, Response } from 'express';
export interface InvitationQueryParams {
    startTime: string;
    endTime: string;
    page?: number;
    pageSize?: number;
}
export declare class InvitationController {
    static queryInvitations: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static exportInvitations: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=InvitationController.d.ts.map