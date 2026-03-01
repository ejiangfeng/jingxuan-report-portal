import React from 'react'
import { Breadcrumb, Space, Typography, Button } from 'antd'
import { 
  HomeOutlined, 
  ShoppingCartOutlined, 
  SettingOutlined,
  QuestionCircleOutlined 
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

interface OrderQueryNavigationProps {
  title?: string;
}

export function OrderQueryNavigation({ title = '订单对账查询' }: OrderQueryNavigationProps) {
  const location = useLocation()
  const navigate = useNavigate()
  
  // 面包屑导航项
  const breadcrumbItems = [
    {
      title: (
        <>
          <HomeOutlined />
          <span>首页</span>
        </>
      ),
      onClick: () => navigate('/')
    },
    {
      title: '报表中心'
    },
    {
      title: title
    }
  ]
  
  // 辅助工具按钮
  const helperButtons = [
    {
      key: 'guide',
      icon: <QuestionCircleOutlined />,
      text: '使用指南',
      onClick: () => window.open('/guide', '_blank')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      text: '查询设置',
      onClick: () => navigate('/settings')
    }
  ]
  
  return (
    <div className="order-query-navigation">
      {/* 顶部标题和面包屑 */}
      <div className="navigation-header">
        <div className="header-left">
          <Space direction="vertical" size="small">
            <Space align="center">
              <ShoppingCartOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <Title level={2} style={{ margin: 0 }}>{title}</Title>
              <Text type="secondary" style={{ fontSize: 14 }}>
                鲸选自助报表平台 - 订单对账与数据分析
              </Text>
            </Space>
            
            <Breadcrumb items={breadcrumbItems} />
          </Space>
        </div>
        
        <div className="header-right">
          <Space>
            {helperButtons.map(button => (
              <Button
                key={button.key}
                icon={button.icon}
                type="text"
                onClick={button.onClick}
              >
                {button.text}
              </Button>
            ))}
          </Space>
        </div>
      </div>
      
      <style>{`
        .order-query-navigation {
          margin-bottom: 16px;
        }
        
        .navigation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
          border-radius: 8px;
          margin-bottom: 16px;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        
        .header-left {
          flex: 1;
        }
        
        .header-right {
          margin-left: 16px;
        }
        
        .ant-breadcrumb {
          margin-top: 8px;
        }
        
        .ant-breadcrumb-link:hover {
          color: #1890ff;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}