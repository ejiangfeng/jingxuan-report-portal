import React, { useState } from 'react'
import { 
  Card, 
  Form, 
  Row, 
  Col, 
  Button, 
  Space, 
  DatePicker, 
  Input, 
  Select, 
  Tag,
  Divider,
  Tooltip
} from 'antd'
import { 
  SearchOutlined, 
  ReloadOutlined, 
  FilterOutlined,
  DownOutlined,
  UpOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { OrderQueryParams, FilterOptions } from '../../../types'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

interface OrderQueryControlsProps {
  queryParams: OrderQueryParams;
  filterOptions: FilterOptions | null;
  onFilterChange: (filters: Partial<OrderQueryParams>) => void;
  onRefresh: () => void;
  onClearFilters: () => void;
  loading: boolean;
}

export function OrderQueryControls({
  queryParams,
  filterOptions,
  onFilterChange,
  onRefresh,
  onClearFilters,
  loading
}: OrderQueryControlsProps) {
  const [form] = Form.useForm()
  const [expanded, setExpanded] = useState(false)
  
  // 快捷日期范围选项
  const quickDateRanges = [
    {
      key: 'today',
      label: '今天',
      getRange: () => [dayjs(), dayjs()]
    },
    {
      key: 'yesterday',
      label: '昨天',
      getRange: () => [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')]
    },
    {
      key: 'last7days',
      label: '近7天',
      getRange: () => [dayjs().subtract(7, 'day'), dayjs()]
    },
    {
      key: 'last30days',
      label: '近30天',
      getRange: () => [dayjs().subtract(30, 'day'), dayjs()]
    },
    {
      key: 'thismonth',
      label: '本月',
      getRange: () => [
        dayjs().startOf('month'),
        dayjs()
      ]
    },
    {
      key: 'lastmonth',
      label: '上月',
      getRange: () => [
        dayjs().subtract(1, 'month').startOf('month'),
        dayjs().subtract(1, 'month').endOf('month')
      ]
    }
  ]
  
  // 处理表单提交
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const filters: Partial<OrderQueryParams> = {
        startTime: values.dateRange?.[0]?.format('YYYY-MM-DD') || queryParams.startTime,
        endTime: values.dateRange?.[1]?.format('YYYY-MM-DD') || queryParams.endTime,
        stationCodes: values.stationCodes,
        mobile: values.mobile,
        status: values.status
      }
      
      onFilterChange(filters)
    })
  }
  
  // 处理快捷日期范围选择
  const handleQuickDateRange = (rangeKey: string) => {
    const range = quickDateRanges.find(r => r.key === rangeKey)
    if (range) {
      const [start, end] = range.getRange()
      form.setFieldsValue({
        dateRange: [start, end]
      })
      handleSubmit()
    }
  }
  
  // 清空筛选条件
  const handleClear = () => {
    form.resetFields()
    onClearFilters()
  }
  
  // 初始化表单值
  const initialValues = {
    dateRange: [
      dayjs(queryParams.startTime),
      dayjs(queryParams.endTime)
    ],
    stationCodes: queryParams.stationCodes,
    mobile: queryParams.mobile,
    status: queryParams.status
  }
  
  return (
    <div className="order-query-controls">
      <Card 
        title={
          <Space>
            <FilterOutlined />
            <span>查询筛选</span>
            {expanded ? null : (
              <Tag color="blue">
                {[
                  queryParams.startTime && `从 ${queryParams.startTime}`,
                  queryParams.endTime && `到 ${queryParams.endTime}`,
                  queryParams.status && `状态: ${queryParams.status}`,
                  queryParams.mobile && `手机: ${queryParams.mobile.substring(0, 3)}****${queryParams.mobile.substring(7)}`
                ].filter(Boolean).join('; ')}
              </Tag>
            )}
          </Space>
        }
        extra={
          <Button
            type="text"
            icon={expanded ? <UpOutlined /> : <DownOutlined />}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '收起' : '展开'}
          </Button>
        }
        size="small"
        className="filter-card"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
        >
          {/* 基础筛选条件 */}
          <Row gutter={16}>
            <Col span={expanded ? 8 : 12}>
              <Form.Item
                label="下单时间范围"
                name="dateRange"
              >
                <RangePicker 
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  allowClear={false}
                  disabledDate={current => current && current > dayjs().endOf('day')}
                />
              </Form.Item>
            </Col>
            
            <Col span={expanded ? 8 : 12}>
              <Form.Item
                label="门店代码"
                name="stationCodes"
                extra="多个门店用逗号分隔"
              >
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder="请输入门店代码"
                  tokenSeparators={[',', '，', ' ']}
                  allowClear
                  options={filterOptions?.stores?.map(store => ({
                    label: `${store.name} (${store.outCode})`,
                    value: store.outCode
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          
          {/* 展开的详细筛选条件 */}
          {expanded && (
            <>
              <Divider orientation="left" plain>
                详细筛选
              </Divider>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="订单状态"
                    name="status"
                  >
                    <Select
                      style={{ width: '100%' }}
                      placeholder="选择订单状态"
                      allowClear
                      options={filterOptions?.statuses?.map(status => ({
                        label: status.label,
                        value: String(status.value)
                      }))}
                    />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item
                    label="手机号码"
                    name="mobile"
                    rules={[
                      { pattern: /^[0-9]{0,11}$/, message: '手机号码必须为11位数字' }
                    ]}
                  >
                    <Input
                      placeholder="请输入手机号码"
                      maxLength={11}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item
                    label="订单类型"
                    name="orderType"
                  >
                    <Select
                      style={{ width: '100%' }}
                      placeholder="选择订单类型"
                      allowClear
                      options={filterOptions?.types?.map(type => ({
                        label: type.label,
                        value: String(type.value)
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="来源渠道"
                    name="sourceChannel"
                  >
                    <Select
                      style={{ width: '100%' }}
                      placeholder="选择来源渠道"
                      allowClear
                      options={filterOptions?.channels?.map(channel => ({
                        label: channel.label,
                        value: String(channel.value)
                      }))}
                    />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item
                    label="配送方式"
                    name="deliveryType"
                  >
                    <Select
                      style={{ width: '100%' }}
                      placeholder="选择配送方式"
                      allowClear
                      options={filterOptions?.deliveryMethods?.map(method => ({
                        label: method.label,
                        value: String(method.value)
                      }))}
                    />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item
                    label="付款方式"
                    name="paymentType"
                  >
                    <Select
                      style={{ width: '100%' }}
                      placeholder="选择付款方式"
                      allowClear
                      options={[
                        { label: '微信支付', value: 'wx' },
                        { label: '支付宝支付', value: 'alipay' },
                        { label: '银行卡支付', value: 'bank' },
                        { label: '积分支付', value: 'points' }
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
          
          {/* 操作按钮 */}
          <Row justify="space-between">
            <Col>
              <Space>
                {expanded ? null : (
                  <Space>
                    <span>快捷日期:</span>
                    {quickDateRanges.map(range => (
                      <Button
                        key={range.key}
                        size="small"
                        type="link"
                        onClick={() => handleQuickDateRange(range.key)}
                      >
                        {range.label}
                      </Button>
                    ))}
                  </Space>
                )}
              </Space>
            </Col>
            
            <Col>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={onRefresh}
                  loading={loading}
                >
                  刷新
                </Button>
                
                <Button
                  onClick={handleClear}
                >
                  清空筛选
                </Button>
                
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSubmit}
                  loading={loading}
                >
                  查询订单
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
      
      {/* 样式 */}
      <style jsx>{`
        .order-query-controls {
          margin-bottom: 16px;
        }
        
        .filter-card {
          margin-bottom: 0;
        }
        
        :global(.ant-card-head) {
          border-bottom: none;
        }
      `}</style>
    </div>
  )
}