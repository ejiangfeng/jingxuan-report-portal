import React, { useState } from 'react'
import { 
  Card, 
  Space, 
  Button, 
  Dropdown, 
  Menu, 
  message, 
  Modal, 
  Typography, 
  Progress,
  Tooltip,
  Badge,
  Tag
} from 'antd'
import { 
  DownloadOutlined, 
  ReloadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  SettingOutlined,
  SyncOutlined,
  CloudDownloadOutlined,
  ShareAltOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons'
import { OrderRecord } from '../../../types'

const { Text, Paragraph } = Typography

interface OrderActionsProps {
  selectedOrders: OrderRecord[]
  onExport: (format: 'csv' | 'excel') => void
  onRefresh: () => void
  totalCount: number
}

interface ExportTask {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  format: 'csv' | 'excel'
  size: string
  createdAt: string
}

export function OrderActions({
  selectedOrders,
  onExport,
  onRefresh,
  totalCount
}: OrderActionsProps) {
  const [loading, setLoading] = useState(false)
  const [exportTasks, setExportTasks] = useState<ExportTask[]>([
    { 
      id: '1', 
      name: '今日订单报表', 
      status: 'completed', 
      progress: 100, 
      format: 'excel', 
      size: '2.5MB', 
      createdAt: '2026-02-15 10:30'
    },
    { 
      id: '2', 
      name: '月度汇总', 
      status: 'processing', 
      progress: 65, 
      format: 'csv', 
      size: '待生成', 
      createdAt: '2026-02-15 11:00'
    }
  ])
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  
  // 获取状态图标
  const getStatusIcon = (status: ExportTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'processing':
        return <SyncOutlined spin style={{ color: '#1890ff' }} />
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />
      case 'failed':
        return <ClockCircleOutlined style={{ color: '#ff4d4f' }} />
      default:
        return null
    }
  }
  
  // 处理Excel导出
  const handleExcelExport = () => {
    if (totalCount > 0) {
      onExport('excel')
      addExportTask('excel')
    } else {
      message.warning('暂无数据可导出')
    }
  }
  
  // 处理CSV导出
  const handleCSVExport = () => {
    if (totalCount > 0) {
      onExport('csv')
      addExportTask('csv')
    } else {
      message.warning('暂无数据可导出')
    }
  }
  
  // 添加导出任务
  const addExportTask = (format: 'csv' | 'excel') => {
    const newTask: ExportTask = {
      id: Date.now().toString(),
      name: `${format === 'excel' ? 'Excel报表' : 'CSV报表'}_${new Date().toLocaleTimeString()}`,
      status: 'processing',
      progress: 0,
      format,
      size: '计算中...',
      createdAt: new Date().toLocaleString()
    }
    
    setExportTasks(prev => [newTask, ...prev])
    
    // 模拟导出进度
    simulateExportProgress(newTask.id)
  }
  
  // 模拟导出进度
  const simulateExportProgress = (taskId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        
        // 更新任务为完成状态
        setExportTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: 'completed', 
                progress: 100, 
                size: `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 9) + 1}MB`
              } 
            : task
        ))
        
        message.success('导出任务已完成')
      } else {
        // 更新进度
        setExportTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, progress: Math.min(progress, 99) } 
            : task
        ))
      }
    }, 300)
  }
  
  // 批量处理选中的订单
  const handleBatchOperations = () => {
    if (selectedOrders.length === 0) {
      message.warning('请先选择要操作的订单')
      return
    }
    setBatchModalVisible(true)
  }
  
  // 处理批量操作确认
  const handleBatchConfirm = (operation: string) => {
    message.info(`将对 ${selectedOrders.length} 个订单执行 ${operation} 操作`)
    setBatchModalVisible(false)
  }
  
  // 导出菜单
  const exportMenu = (
    <Menu>
      <Menu.Item key="excel" onClick={handleExcelExport}>
        <Space>
          <FileExcelOutlined />
          <span>导出为Excel (.xlsx)</span>
        </Space>
      </Menu.Item>
      <Menu.Item key="csv" onClick={handleCSVExport}>
        <Space>
          <FileTextOutlined />
          <span>导出为CSV (.csv)</span>
        </Space>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="template">
        <Space>
          <DownloadOutlined />
          <span>下载报表模板</span>
        </Space>
      </Menu.Item>
    </Menu>
  )
  
  // 批量操作菜单
  const batchMenu = (
    <Menu>
      <Menu.Item key="print" onClick={() => handleBatchConfirm('打印')}>
        打印选中订单
      </Menu.Item>
      <Menu.Item key="tag" onClick={() => handleBatchConfirm('标记')}>
        批量标记
      </Menu.Item>
      <Menu.Item key="share" onClick={() => handleBatchConfirm('分享')}>
        批量分享
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="statistics" onClick={() => handleBatchConfirm('统计')}>
        生成统计报告
      </Menu.Item>
      <Menu.Item key="analysis" onClick={() => handleBatchConfirm('分析')}>
        批量分析
      </Menu.Item>
    </Menu>
  )
  
  return (
    <div className="order-actions">
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* 左侧：操作统计 */}
          <div>
            <Space size="middle">
              <Tag color="blue">
                总计: <Text strong>{totalCount.toLocaleString()}</Text> 条订单
              </Tag>
              {selectedOrders.length > 0 && (
                <Tag color="green">
                  已选: <Text strong>{selectedOrders.length}</Text> 条
                </Tag>
              )}
              <Tooltip title="当前查询条件下的总数">
                <InfoCircleOutlined style={{ color: '#999', cursor: 'help' }} />
              </Tooltip>
            </Space>
          </div>
          
          {/* 右侧：操作按钮 */}
          <Space>
            {/* 导出按钮 */}
            <Dropdown overlay={exportMenu} trigger={['click']}>
              <Button type="primary" icon={<DownloadOutlined />}>
                导出数据
              </Button>
            </Dropdown>
            
            {/* 批量操作按钮 */}
            {selectedOrders.length > 0 && (
              <Dropdown overlay={batchMenu} trigger={['click']}>
                <Button icon={<SettingOutlined />}>
                  批量操作
                </Button>
              </Dropdown>
            )}
            
            {/* 刷新按钮 */}
            <Button 
              icon={<ReloadOutlined />} 
              onClick={onRefresh}
            >
              刷新数据
            </Button>
            
            {/* 任务状态按钮 */}
            {exportTasks.some(task => task.status === 'processing') && (
              <Badge count={exportTasks.filter(t => t.status === 'processing').length}>
                <Button 
                  icon={<CloudDownloadOutlined />}
                  type="text"
                  onClick={() => {
                    // 可以跳转到任务监控页面
                    message.info('导出任务进行中...')
                  }}
                />
              </Badge>
            )}
          </Space>
        </div>
        
        {/* 导出任务进度 */}
        {exportTasks.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Paragraph type="secondary" style={{ marginBottom: 8 }}>
              导出任务进度
            </Paragraph>
            
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {exportTasks.slice(0, 3).map(task => (
                <div key={task.id} className="export-task-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Space>
                      {getStatusIcon(task.status)}
                      <Text>{task.name}</Text>
                      <Tag size="small">{task.format.toUpperCase()}</Tag>
                    </Space>
                    <Text type="secondary">{task.createdAt}</Text>
                  </div>
                  
                  {task.status === 'processing' && (
                    <Progress 
                      percent={Math.round(task.progress)} 
                      size="small" 
                      status="active"
                      style={{ margin: 0 }}
                    />
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {task.size}
                    </Text>
                    {task.status === 'completed' && (
                      <Button type="link" size="small" icon={<DownloadOutlined />}>
                        下载
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </Space>
          </div>
        )}
      </Card>
      
      {/* 样式 */}
      <style jsx>{`
        .order-actions {
          margin: 16px 0;
        }
        
        .export-task-item {
          padding: 12px;
          background: #fafafa;
          border-radius: 4px;
          border: 1px solid #f0f0f0;
        }
        
        .export-task-item:hover {
          background: #f5f5f5;
        }
      `}</style>
    </div>
  )
}