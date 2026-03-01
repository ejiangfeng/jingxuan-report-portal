import { QueryParams, OrderQueryParams } from '../../types';
export interface SQLTemplateConfig {
    name: string;
    description: string;
    sql: string;
    parameters: string[];
    hasPagination: boolean;
}
export interface ProcessedSQL {
    sql: string;
    params: any[];
    paramCount: number;
    hasPagination: boolean;
}
export interface OrderProcessedSQL extends ProcessedSQL {
    queryParams: OrderQueryParams;
    page?: number;
    pageSize?: number;
}
export declare class SQLProcessor {
    private readonly templatesPath;
    private templates;
    constructor(templatesPath: string);
    loadTemplate(templateName: string): Promise<SQLTemplateConfig>;
    processQuery(templateName: string, queryParams: QueryParams): ProcessedSQL;
    processOrderQuery(queryParams: OrderQueryParams): OrderProcessedSQL;
    private buildOrderQueryParams;
    private buildFilters;
    private buildParams;
    private cleanStoreIds;
    private injectFilters;
    parameterizeTemplate(sql: string, filters: any): {
        sql: string;
        params: any[];
    };
    private buildParameterValues;
    private extractDescription;
    private extractParameters;
    private hasPaginationPlaceholder;
    private hasPagination;
    private findNextKeyword;
    validateSQLSafety(sql: string): {
        valid: boolean;
        errors: string[];
    };
    getLoadedTemplates(): SQLTemplateConfig[];
    clearTemplates(): void;
    processQueryResults(rawData: any[], queryParams?: OrderQueryParams): {
        records: any[];
        total?: number;
        executionTime?: number;
    };
    processCountingSQL(queryParams: OrderQueryParams): ProcessedSQL;
    private convertToCountSQL;
}
//# sourceMappingURL=SQLProcessor.d.ts.map