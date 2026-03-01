import React from 'react'
import { Space, Button, Tooltip, message } from 'antd'
import { ExportOutlined, ReloadOutlined } from '@ant-design/icons'
import { orderQueryService } from '../../../services/order-query.service'

interface OrderActionsProps {
  queryParams: any;
  onExport: (format: 'csv' | 'excel') => void;
  onRefresh: () => void;
  totalCount: number;
}

export function OrderActions({
  queryParams,
  onExport,
  onRefresh,
  totalCount
}: OrderActionsProps) {
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const response = await orderQueryService.exportOrders({
        ...queryParams,
        exportFormat: format
      })
      if (response.success) {
        message.success('导出任务已创建，请稍后在导出历史中查看')
        onExport(format)
      } else {
        message.error(response.error || '导出失败')
      }
    } catch (error) {
      message.error('导出失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }
  
  return (
    <div style={{ marginBottom: 16 }}>
      <Space>
        <Tooltip title="刷新数据">
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>
            刷新
          </Button>
        </Tooltip>
        
        <Tooltip title="导出为 Excel">
          <Button icon={<ExportOutlined />} onClick={() => handleExport('excel')}>
            导出 Excel
          </Button>
        </Tooltip>
        
        <Tooltip title="导出为 CSV">
          <Button icon={<ExportOutlined />} onClick={() => handleExport('csv')}>
            导出 CSV
          </Button>
        </Tooltip>
        
        {totalCount > 0 && (
          <span style={{ color: '#666' }}>
            共 {totalCount} 条记录
          </span>
        )}
      </Space>
    </div>
  )
}
