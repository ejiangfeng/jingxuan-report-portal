import React, { useState } from 'react'
import { 
  Table, Card, Space, Typography, Tooltip, Tag, Button
} from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { OrderRecord } from '../../../types'

const { Text } = Typography

const statusMap: Record<string, string> = {
  '1': '待付款',
  '2': '待发货',
  '3': '待收货',
  '4': '待评价',
  '5': '交易成功',
  '6': '交易失败',
  '10': '待接单',
  '15': '待拣货',
  '50': '部分支付'
}

const statusColorMap: Record<string, string> = {
  '待付款': 'gold',
  '待发货': 'blue',
  '待收货': 'cyan',
  '待评价': 'purple',
  '交易成功': 'green',
  '交易失败': 'red',
  '待接单': 'magenta',
  '待拣货': 'volcano',
  '部分支付': 'orange'
}

interface OrderDataViewProps {
  orders: OrderRecord[]
  loading: boolean
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number, pageSize: number) => void
}

export function OrderDataView({
  orders,
  loading,
  total,
  page,
  pageSize,
  onPageChange
}: OrderDataViewProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  
  const fmt = (v: any): string => (v == null ? '0' : Number(v).toLocaleString())
  
  const getStatusText = (status: any): string => {
    if (!status) return '-'
    const statusStr = String(status)
    return statusMap[statusStr] || statusMap[status] || status
  }
  
  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_number',
      key: 'order_number',
      width: 180,
      fixed: 'left' as const,
      render: (text: string, record: OrderRecord) => (
        <Space direction="vertical" size={2}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.create_time ? dayjs(record.create_time).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Text>
        </Space>
      )
    },
    {
      title: '下单人',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 120,
      render: () => <Text>-</Text>
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: any) => {
        const statusText = getStatusText(status)
        return <Tag color={statusColorMap[statusText] || 'default'}>{statusText}</Tag>
      }
    },
    {
      title: '数量',
      dataIndex: 'product_nums',
      key: 'product_nums',
      width: 80,
      align: 'right' as const,
      render: (v: any) => fmt(v)
    },
    {
      title: '商品金额',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'right' as const,
      render: (v: any) => <Text type="warning">¥{fmt(v)}</Text>
    },
    {
      title: '优惠',
      dataIndex: 'reduce_amount',
      key: 'reduce_amount',
      width: 80,
      align: 'right' as const,
      render: (v: any) => <Text type="success">-¥{fmt(v)}</Text>
    },
    {
      title: '实付',
      dataIndex: 'actual_total',
      key: 'actual_total',
      width: 90,
      align: 'right' as const,
      render: (v: any) => <Text type="danger">¥{fmt(v)}</Text>
    },
    {
      title: '门店',
      dataIndex: 'station_id',
      key: 'station_id',
      width: 80,
      render: (v: any) => v || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      fixed: 'right' as const,
      render: (_: any, r: OrderRecord) => (
        <Tooltip title="查看">
          <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => alert(r.order_number)} />
        </Tooltip>
      )
    }
  ]
  
  return (
    <Card variant="borderless">
      <Table
        rowSelection={{ selectedRowKeys, onChange: (k: React.Key[]) => setSelectedRowKeys(k as string[]) }}
        columns={columns}
        dataSource={orders}
        rowKey="order_number"
        loading={loading}
        pagination={{ current: page, pageSize, total, onChange: onPageChange, showTotal: (t: number) => `共 ${t} 条` }}
        scroll={{ x: 1000 }}
        size="small"
      />
    </Card>
  )
}
