import { Request, Response, NextFunction } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'
import { ValidationError } from '../../middleware/errorHandler'

const dateRangeSchema = Joi.object({
  start: Joi.string()
    .required()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .message('开始日期格式应为 YYYY-MM-DD'),
  
  end: Joi.string()
    .required()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .message('结束日期格式应为 YYYY-MM-DD')
})

const filtersSchema = Joi.object({
  dateRange: dateRangeSchema.optional(),
  storeIds: Joi.string().optional(),
  mobile: Joi.string().optional(),
  statuses: Joi.array().optional().items(Joi.number())
})

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(1000).default(50)
})

const simpleQuerySchema = Joi.object({
  startTime: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endTime: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: Joi.string().optional(),
  stationCodes: Joi.string().optional(),
  orderNumber: Joi.string().optional(),
  mobile: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(1000).default(50)
})

export const validateQueryParams = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error } = simpleQuerySchema.validate(req.body)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    next()
  } catch (error: any) {
    next(error)
  }
}

export const validateExportParams = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schema = Joi.object({
      startTime: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endTime: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
      status: Joi.string().optional(),
      stationCodes: Joi.string().optional(),
      orderNumber: Joi.string().optional(),
      exportType: Joi.string().optional(),
      format: Joi.string().valid('xlsx', 'csv').default('xlsx'),
      filename: Joi.string().optional(),
      page: Joi.number().optional(),
      pageSize: Joi.number().optional()
    })
    
    const { error } = schema.validate(req.body)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    next()
  } catch (error: any) {
    next(error)
  }
}

export const validateOrderDetailParams = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = Joi.object({
    orderNumber: Joi.string().required()
  })
  
  const { error } = schema.validate(req.params)
  if (error) {
    return next(new ValidationError(error.details[0].message))
  }
  next()
}

async function validateBusinessLogic(body: any): Promise<void> {
  // No additional validation needed for now
}
