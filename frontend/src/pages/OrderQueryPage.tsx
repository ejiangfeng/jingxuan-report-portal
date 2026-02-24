import React, { useState, useEffect } from 'react'
import { Card, Space, Typography, notification } from 'antd'
import { useQueryClient } from 'react-query'
import dayjs from 'dayjs'

// 四层架构组件
import { OrderQueryNavigation } from '../components/order-query/navigation/OrderQueryNavigation'
import { OrderQueryControls } from '../components/order-query/controls/OrderQueryControls'
import { OrderDataView } from '../components/order-query/view/OrderDataView'
import { OrderActions } from '../components/order-query/actions/OrderActions'

// 服务层
import { orderQueryService } from '../services/order-query.service'
import { filterOptionService } from '../services/filter-option.service'

// 类型定义
import { OrderQueryParams, OrderRecord, FilterOptions } from '../types'

const { Title } = Typography

export function OrderQueryPage() {
  const queryClient = useQueryClient()
  
  // 状态管理
  const [queryParams, setQueryParams] = useState<OrderQueryParams>({
    startTime: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    endTime: dayjs().format('YYYY-MM-DD'),
    page: 1,
    pageSize: 20
  })
  
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  
  // 组件加载时的初始化
  useEffect(() => {
    loadFilterOptions()
  }, [])
  
  // 当查询参数变化时，重新加载数据
  useEffect(() => {
    loadOrders()
  }, [queryParams])
  
  // 加载筛选选项
  const loadFilterOptions = async () => {
    try {
      const options = await filterOptionService.getFilterOptions()
      setFilterOptions(options)
    } catch (error) {
      notification.error({
        message: '加载筛选选项失败',
        description: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
  
  // 加载订单数据
  const loadOrders = async () => {
    setLoading(true)
    try {
      const response = await orderQueryService.queryOrders(queryParams)
      
      if (response.success && response.data) {
        const { items, total } = response.data
        setOrders(items)
        setTotal(total)
      } else {
        throw new Error(response.error || '查询失败')
      }
    } catch (error) {
      notification.error({
        message: '订单查询失败',
        description: error instanceof Error ? error.message : '未知错误'
      })
    } finally {
      setLoading(false)
    }
  }
  
  // 处理筛选参数变化
  const handleFilterChange = (newFilters: Partial<OrderQueryParams>) => {
    setQueryParams(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // 重置页码
    }))
  }
  
  // 处理页码变化
  const handlePageChange = (page: number, pageSize: number) => {
    setQueryParams(prev => ({
      ...prev,
      page,
      pageSize
    }))
  }
  
  // 处理导出操作
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const response = await orderQueryService.exportOrders({
        ...queryParams,
        exportFormat: format,
        exportLimit: 50000 // 最大导出限制
      })
      
      if (response.success) {
        notification.success({
          message: '导出任务已创建',
          description: response.message || '请稍后在导出历史中查看'
        })
      } else {
        throw new Error(response.error || '导出失败')
      }
    } catch (error) {
      notification.error({
        message: '导出失败',
        description: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
  
  // 处理重新查询
  const handleRefresh = () => {
    queryClient.invalidateQueries(['orders', queryParams])
    loadOrders()
  }
  
  // 清空筛选条件
  const handleClearFilters = () => {
    setQueryParams({
      startTime: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
      endTime: dayjs().format('YYYY-MM-DD'),
      page: 1,
      pageSize: 20
    })
  }
  
  return (
    <div className="order-query-page">
      {/* 导航层 - 页眉、面包屑 */}
      <OrderQueryNavigation />
      
      <div className="page-content">
        <Card bordered={false} className="main-card">
          {/* 控制层 - 筛选器、查询按钮 */}
          <OrderQueryControls
            queryParams={queryParams}
            filterOptions={filterOptions}
            onFilterChange={handleFilterChange}
            onRefresh={handleRefresh}
            onClearFilters={handleClearFilters}
            loading={loading}
          />
          
          {/* 动作层 - 操作按钮、批量操作 */}
          <OrderActions
            selectedOrders={[]} // 可以添加选中状态管理
            onExport={handleExport}
            onRefresh={handleRefresh}
            totalCount={total}
          />
          
          {/* 视图层 - 数据表格 */}
          <OrderDataView
            orders={orders}
            loading={loading}
            total={total}
            page={queryParams.page || 1}
            pageSize={queryParams.pageSize || 20}
            onPageChange={handlePageChange}
          />
        </Card>
      </div>
    </div>
  )
}