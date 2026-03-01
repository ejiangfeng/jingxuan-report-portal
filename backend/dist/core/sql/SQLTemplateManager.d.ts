import { SQLProcessor, SQLTemplateConfig } from './SQLProcessor';
export declare class SQLTemplateManager {
    private templatesPath;
    private templates;
    private processor;
    constructor(templatesPath: string);
    initialize(): Promise<void>;
    getTemplate(templateName: string): Promise<SQLTemplateConfig>;
    getAllTemplates(): SQLTemplateConfig[];
    getTemplateNames(): string[];
    hasTemplate(templateName: string): boolean;
    reloadTemplate(templateName: string): Promise<SQLTemplateConfig>;
    reloadAllTemplates(): Promise<void>;
    processQuery(templateName: string, queryParams: any): Promise<{
        sql: string;
        params: any[];
        template: SQLTemplateConfig;
    }>;
    getProcessor(): SQLProcessor;
    private sanitizeQueryParams;
    private validateQueryParams;
    private ensureTemplateDirectory;
    private loadAllTemplates;
    getStats(): {
        totalTemplates: number;
        templateNames: string[];
        memoryUsage: number;
        lastReloaded?: Date;
    };
    exportTemplateConfig(templateName: string): any;
    healthCheck(): Promise<{
        healthy: boolean;
        templateCount: number;
        error?: string;
    }>;
}
export declare const sqlTemplateManager: SQLTemplateManager;
//# sourceMappingURL=SQLTemplateManager.d.ts.map