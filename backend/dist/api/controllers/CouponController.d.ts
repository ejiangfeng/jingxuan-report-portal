import { Request, Response } from 'express';
export interface CouponQueryParams {
    receiveStartTime?: string;
    receiveEndTime?: string;
    useStartTime?: string;
    useEndTime?: string;
    couponIds?: string;
    page?: number;
    pageSize?: number;
}
export declare class CouponController {
    static queryCoupons: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static exportCoupons: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=CouponController.d.ts.map