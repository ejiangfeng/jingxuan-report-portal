import { Request, Response } from 'express';
export interface PenetrationQueryParams {
    startTime: string;
    endTime: string;
    stationCodes?: string;
    barCode?: string;
    partyCode?: string;
    page?: number;
    pageSize?: number;
}
export declare class PenetrationController {
    static queryPenetration: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static exportPenetration: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=PenetrationController.d.ts.map