import React from 'react'
import { Card, Form, Row, Col, Button, DatePicker, Select, Input, Alert } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { OrderQueryParams } from '../../../types'

const { RangePicker } = DatePicker
const { Option } = Select

// 实际存在的门店代码（从数据库获取）
const commonStations = [
  { code: '2', name: '杭州门店' },
  { code: '30', name: '上海门店' },
  { code: '62', name: '北京门店' },
  { code: '84', name: '深圳门店' },
  { code: '100', name: '广州门店' },
  { code: '101', name: '成都门店' },
  { code: '102', name: '武汉门店' },
  { code: '113', name: '南京门店' },
  { code: '127', name: '西安门店' },
  { code: '7', name: '苏州门店' }
]

interface OrderQueryControlsProps {
  queryParams: OrderQueryParams;
  onFilterChange: (filters: Partial<OrderQueryParams>) => void;
  loading: boolean;
}

export function OrderQueryControls({
  queryParams,
  onFilterChange,
  loading
}: OrderQueryControlsProps) {
  const [form] = Form.useForm()
  
  const handleSubmit = () => {
    const values = form.getFieldsValue()
    const filters: Partial<OrderQueryParams> = {
      startTime: values.dateRange?.[0]?.format('YYYY-MM-DD') || queryParams.startTime,
      endTime: values.dateRange?.[1]?.format('YYYY-MM-DD') || queryParams.endTime,
      stationCodes: values.stationCodes?.length > 0 ? values.stationCodes.join(',') : undefined,
      status: values.status
    }
    console.log('提交筛选条件:', filters)
    onFilterChange(filters)
  }
  
  return (
    <Card title="查询筛选" size="small">
      <Alert 
        message="提示"
        description="数据库中实际存在的门店代码包括：2, 7, 30, 62, 84, 100, 101, 102, 113, 127 等共 102 个门店。请输入正确的门店代码查询。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        closable
      />
      
      <Form form={form} layout="inline" initialValues={{
        dateRange: [dayjs(queryParams.startTime), dayjs(queryParams.endTime)],
        stationCodes: queryParams.stationCodes ? queryParams.stationCodes.split(',') : [],
        status: queryParams.status
      }}>
        <Form.Item name="dateRange" label="下单时间">
          <RangePicker format="YYYY-MM-DD" />
        </Form.Item>
        
        <Form.Item name="stationCodes" label="门店代码">
          <Select 
            mode="tags" 
            style={{ width: 250 }} 
            placeholder="输入或选择门店代码" 
            tokenSeparators={[',']} 
            allowClear
            dropdownRender={(menu) => (
              <>
                <div style={{ padding: '8px', fontSize: '12px', color: '#666', borderBottom: '1px solid #f0f0f0' }}>
                  常用门店:
                </div>
                {menu}
              </>
            )}
          >
            {commonStations.map(station => (
              <Option key={station.code} value={station.code}>
                {station.name} ({station.code})
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item name="status" label="订单状态">
          <Select style={{ width: 120 }} allowClear placeholder="全部">
            <Option value="1">待付款</Option>
            <Option value="5">交易成功</Option>
            <Option value="6">交易失败</Option>
            <Option value="10">待接单</Option>
            <Option value="15">待拣货</Option>
            <Option value="50">部分支付</Option>
          </Select>
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSubmit} loading={loading}>
            查询订单
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
