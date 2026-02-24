import React, { useState } from 'react'
import { 
  Table, 
  Card, 
  Space, 
  Typography, 
  Statistic, 
  Row, 
  Col, 
  Tooltip,
  Tag,
  Empty,
  Progress,
  Button,
  Modal,
  message
} from 'antd'
import { 
  ShoppingOutlined, 
  MoneyCollectOutlined, 
  TeamOutlined,
  EyeOutlined,
  ExportOutlined,
  QuestionCircleOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { OrderRecord, OrderQueryResponse } from '../../../types'

const { Title, Text, Paragraph } = Typography

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
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null)
  
  // 状态标签颜色映射
  const statusColorMap: Record<string, string> = {
    '待付款': 'gold',
    '待发货': 'blue',
    '待收货': 'cyan',
    '待评价': 'purple',
    '交易成功': 'green',
    '交易失败': 'red',
    '待成团': 'orange',
    '待接单': 'magenta',
    '待拣货': 'volcano',
    '部分支付': 'lime',
    '整单的撤销中': 'default'
  }
  
  // 数据统计
  const stats = {
    totalAmount: orders.reduce((sum, order) => sum + (order.客户实付金额 || 0), 0),
    avgAmount: orders.length > 0 
      ? orders.reduce((sum, order) => sum + (order.客户实付金额 || 0), 0) / orders.length 
      : 0,
    successCount: orders.filter(order => order.订单状态 === '交易成功').length,
    topStore: orders.length > 0 
      ? Object.entries(
          orders.reduce((acc, order) => {
            const store = order.所属门店名称 || '未知门店'
            acc[store] = (acc[store] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        ).sort((a, b) => b[1] - a[1])[0]
      : null
  }
  
  // 表格列定义
  const columns = [
    {
      title: '订单信息',
      children: [
        {
          title: '订单号',
          dataIndex: '订单号',
          key: 'order_number',
          width: 180,
          fixed: 'left',
          render: (text: string, record: OrderRecord) => (
            <Space direction="vertical" size={2}>
              <Text strong>{text}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(record.下单时间).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
            </Space>
          )
        },
        {
          title: '下单人',
          dataIndex: '下单人手机号',
          key: 'mobile',
          width: 120,
          render: (text: string) => (
            <Tooltip title={text}>
              <Text copyable={{ text }} style={{ cursor: 'pointer' }}>
                {text ? `${text.substring(0, 3)}****${text.substring(7)}` : '-'}
              </Text>
            </Tooltip>
          )
        },
        {
          title: '订单状态',
          dataIndex: '订单状态',
          key: 'status',
          width: 100,
          render: (status: string) => (
            <Tag color={statusColorMap[status] || 'default'} style={{ margin: 0 }}>
              {status}
            </Tag>
          )
        }
      ]
    },
    {
      title: '商品信息',
      children: [
        {
          title: '商品数量',
          dataIndex: '商品总数量',
          key: 'total_quantity',
          width: 100,
          align: 'right' as const,
          render: (value: number) => <Text>{value.toLocaleString()}</Text>
        },
        {
          title: '商品金额',
          dataIndex: '商品总金额',
          key: 'total_amount',
          width: 120,
          align: 'right' as const,
          render: (value: number) => (
            <Text strong type="warning">
              ¥{value.toLocaleString()}
            </Text>
          )
        }
      ]
    },
    {
      title: '支付信息',
      children: [
        {
          title: '优惠金额',
          dataIndex: '优惠总金额',
          key: 'discount_amount',
          width: 100,
          align: 'right' as const,
          render: (value: number) => (
            <Text type="success">
              -¥{value.toLocaleString()}
            </Text>
          )
        },
        {
          title: '实付金额',
          dataIndex: '客户实付金额',
          key: 'actual_amount',
          width: 120,
          align: 'right' as const,
          render: (value: number) => (
            <Text strong type="danger">
              ¥{value.toLocaleString()}
            </Text>
          )
        }
      ]
    },
    {
      title: '门店/渠道',
      children: [
        {
          title: '门店',
          dataIndex: '所属门店名称',
          key: 'store_name',
          width: 150,
          ellipsis: true,
          render: (text: string, record: OrderRecord) => (
            <Space direction="vertical" size={2}>
              <Text>{text}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.所属门店代码}
              </Text>
            </Space>
          )
        },
        {
          title: '渠道',
          dataIndex: '来源渠道',
          key: 'source_channel',
          width: 120
        }
      ]
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: OrderRecord) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="导出该订单">
            <Button
              type="text"
              icon={<ExportOutlined />}
              onClick={() => handleExportSingle(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ]
  
  // 查看订单详情
  const handleViewDetail = (record: OrderRecord) => {
    setSelectedOrder(record)
    setModalVisible(true)
  }
  
  // 关闭详情模态框
  const handleModalClose = () => {
    setModalVisible(false)
    setSelectedOrder(null)
  }
  
  // 导出单个订单
  const handleExportSingle = (record: OrderRecord) => {
    // 这里应该调用导出API
    message.info(`准备导出订单: ${record.订单号}`)
  }
  
  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys as string[])
    }
  }
  
  // 分页配置
  const pagination = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) => 
      `第 ${range[0]}-${range[1]} 条，共 ${total} 条订单`,
    pageSizeOptions: ['10', '20', '50', '100']
  }
  
  return (
    <div className="order-data-view">
      {/* 数据统计卡片 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="订单总数"
              value={total}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="交易总额"
              value={stats.totalAmount}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
              precision={2}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均客单价"
              value={stats.avgAmount}
              prefix="¥"
              valueStyle={{ color: '#722ed1' }}
              precision={2}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="订单成功率"
              value={(stats.successCount / Math.max(orders.length, 1)) * 100}
              suffix="%"
              valueStyle={{ color: stats.successCount > orders.length * 0.8 ? '#52c41a' : '#fa8c16' }}
              prefix={<TeamOutlined />}
              precision={1}
            />
          </Col>
        </Row>
        {stats.topStore && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              最活跃门店: <Text strong>{stats.topStore[0]}</Text> (贡献 {stats.topStore[1]} 单, 
              {((stats.topStore[1] / orders.length) * 100).toFixed(1)}%)
            </Text>
          </div>
        )}
      </Card>
      
      {/* 数据表格 */}
      <Card
        title={
          <Space>
            <MoneyCollectOutlined />
            <span>订单列表</span>
            {selectedRowKeys.length > 0 && (
              <Tag color="blue">
                已选择 {selectedRowKeys.length} 个订单
              </Tag>
            )}
          </Space>
        }
        extra={
          <Tooltip title="点击表头可筛选和排序">
            <QuestionCircleOutlined />
          </Tooltip>
        }
        size="small"
      >
        {orders.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical">
                <Text>暂无订单数据</Text>
                <Text type="secondary">请调整筛选条件后重新查询</Text>
              </Space>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={orders.map(order => ({ ...order, key: order.订单号 }))}
            loading={loading}
            rowSelection={rowSelection}
            pagination={pagination}
            onChange={(pagination) => {
              onPageChange(pagination.current || 1, pagination.pageSize || 20)
            }}
            scroll={{ x: 1300 }}
            size="small"
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ margin: 0, padding: '8px 24px' }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Paragraph strong>收货信息</Paragraph>
                      <Text>
                        {record.收货人} ({record.收货人手机号})<br />
                        {record.收货地址}
                      </Text>
                    </Col>
                    <Col span={8}>
                      <Paragraph strong>支付详情</Paragraph>
                      <Space direction="vertical" size={0}>
                        <Text>支付宝: ¥{record.支付宝支付}</Text>
                        <Text>微信: ¥{record.微信支付}</Text>
                        <Text>储值卡: ¥{record.储值卡支付}</Text>
                      </Space>
                    </Col>
                    <Col span={8}>
                      <Paragraph strong>订单备注</Paragraph>
                      <Text type={record.客户备注 ? undefined : 'secondary'}>
                        {record.客户备注 || '无备注'}
                      </Text>
                    </Col>
                  </Row>
                </div>
              ),
              rowExpandable: () => true
            }}
          />
        )}
      </Card>
      
      {/* 订单详情模态框 */}
      <Modal
        title="订单详情"
        open={modalVisible}
        onCancel={handleModalClose}
        width={800}
        footer={null}
        destroyOnClose
      >
        {selectedOrder && (
          <div className="order-detail-modal">
            {/* 这里可以放详细的订单信息展示 */}
            <Paragraph>
              订单详细数据展示...
            </Paragraph>
          </div>
        )}
      </Modal>
      
      {/* 样式 */}
      <style jsx>{`
        .order-data-view {
          margin-top: 16px;
        }
        
        :global(.ant-card-body) {
          padding: 16px;
        }
        
        :global(.ant-table) {
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}