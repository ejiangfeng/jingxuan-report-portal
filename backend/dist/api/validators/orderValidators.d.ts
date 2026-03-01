import { Request, Response, NextFunction } from 'express';
export declare const validateQueryParams: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateExportParams: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateOrderDetailParams: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateExportStatusParams: (req: Request, res: Response, next: NextFunction) => void;
export declare const validationSchemas: {
    dateRange: any;
    filters: any;
    pagination: any;
    export: any;
};
export declare function validateWithSchema(schema: any, data: any): any;
export declare function isValidDateString(dateString: string): boolean;
export declare function isValidMobile(mobile: string): boolean;
export declare function isValidStoreIds(storeIds: string): boolean;
export declare function isValidOrderStatuses(statuses: number[]): boolean;
export declare function cleanStoreIds(storeIds: string): string;
export declare function cleanQueryParams(params: any): any;
declare const _default: {
    validateQueryParams: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validateExportParams: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validateOrderDetailParams: (req: Request, res: Response, next: NextFunction) => void;
    validateExportStatusParams: (req: Request, res: Response, next: NextFunction) => void;
    validateWithSchema: typeof validateWithSchema;
    validationSchemas: {
        dateRange: any;
        filters: any;
        pagination: any;
        export: any;
    };
    isValidDateString: typeof isValidDateString;
    isValidMobile: typeof isValidMobile;
    isValidStoreIds: typeof isValidStoreIds;
    isValidOrderStatuses: typeof isValidOrderStatuses;
    cleanStoreIds: typeof cleanStoreIds;
    cleanQueryParams: typeof cleanQueryParams;
};
export default _default;
//# sourceMappingURL=orderValidators.d.ts.map