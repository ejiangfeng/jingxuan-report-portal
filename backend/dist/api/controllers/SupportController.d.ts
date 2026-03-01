import { Request, Response } from 'express';
export interface SupportQueryParams {
    startTime: string;
    endTime: string;
    activityId?: string;
    page?: number;
    pageSize?: number;
}
export interface SupportRecord {
    '用户手机号': string;
    '助力时间': string;
    '活动 ID': string;
    '活动名称': string;
    '助力状态': string;
    '奖励金额': number;
    '奖励类型': string;
    '被助力用户': string;
}
export declare class SupportController {
    static querySupportActivities: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static exportSupportActivities: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=SupportController.d.ts.map