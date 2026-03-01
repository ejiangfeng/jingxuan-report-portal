import React, { useState, useEffect } from 'react'
import { Card, Typography, notification, Space } from 'antd'
import dayjs from 'dayjs'
import { OrderQueryNavigation } from '../components/order-query/navigation/OrderQueryNavigation'
import { OrderQueryControls } from '../components/order-query/controls/OrderQueryControls'
import { OrderDataView } from '../components/order-query/view/OrderDataView'
import { OrderActions } from '../components/order-query/actions/OrderActions'
import { orderQueryService } from '../services/order-query.service'
import { OrderQueryParams, OrderRecord } from '../types'

export function OrderQueryPage() {
  const [queryParams, setQueryParams] = useState<OrderQueryParams>({
    startTime: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    endTime: dayjs().format('YYYY-MM-DD'),
    page: 1,
    pageSize: 20
  })
  
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  
  const loadOrders = async () => {
    setLoading(true)
    try {
      console.log('查询参数:', queryParams)
      const response = await orderQueryService.queryOrders(queryParams)
      console.log('查询响应:', response)
      if (response.success && response.data) {
        setOrders(response.data.items || [])
        setTotal(response.data.total || 0)
        if (response.data.items?.length === 0) {
          notification.info({
            message: '暂无数据',
            description: '当前筛选条件下没有订单数据'
          })
        }
      } else {
        notification.error({
          message: '查询失败',
          description: response.error || '未知错误'
        })
      }
    } catch (error) {
      console.error('查询错误:', error)
      notification.error({
        message: '订单查询失败',
        description: error instanceof Error ? error.message : '未知错误'
      })
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadOrders()
  }, [queryParams])
  
  const handleFilterChange = (newFilters: Partial<OrderQueryParams>) => {
    console.log('筛选条件变化:', newFilters)
    setQueryParams(prev => ({ ...prev, ...newFilters, page: 1 }))
  }
  
  const handlePageChange = (page: number, pageSize: number) => {
    setQueryParams(prev => ({ ...prev, page, pageSize }))
  }
  
  const handleExport = (format: 'csv' | 'excel') => {
    console.log('导出格式:', format)
  }
  
  const handleRefresh = () => {
    loadOrders()
  }
  
  return (
    <div>
      <OrderQueryNavigation />
      <OrderQueryControls
        queryParams={queryParams}
        onFilterChange={handleFilterChange}
        loading={loading}
      />
      <OrderActions
        queryParams={queryParams}
        onExport={handleExport}
        onRefresh={handleRefresh}
        totalCount={total}
      />
      <OrderDataView
        orders={orders}
        loading={loading}
        total={total}
        page={queryParams.page || 1}
        pageSize={queryParams.pageSize || 20}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
