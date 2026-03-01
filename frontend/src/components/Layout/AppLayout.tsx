import React, { useState } from 'react'
import { Layout, Menu, Button, Avatar, Dropdown, Badge, Space, Typography } from 'antd'
import { 
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  HistoryOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Header, Sider, Content, Footer } = Layout
const { Title } = Typography

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  // 菜单项配置
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/')
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: '订单查询',
      onClick: () => navigate('/orders')
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '报表中心',
      onClick: () => navigate('/reports')
    },
    {
      key: '/exports',
      icon: <HistoryOutlined />,
      label: '导出历史',
      onClick: () => navigate('/exports')
    },
    {
      type: 'divider' as const
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => navigate('/settings')
    }
  ]

  // 用户菜单
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        个人中心
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        账户设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />}>
        退出登录
      </Menu.Item>
    </Menu>
  )

  // 辅助菜单
  const helpMenu = (
    <Menu>
      <Menu.Item key="guide" icon={<QuestionCircleOutlined />}>
        使用指南
      </Menu.Item>
      <Menu.Item key="faq" icon={<QuestionCircleOutlined />}>
        常见问题
      </Menu.Item>
      <Menu.Item key="contact" icon={<QuestionCircleOutlined />}>
        联系我们
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="feedback" icon={<QuestionCircleOutlined />}>
        意见反馈
      </Menu.Item>
    </Menu>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000
        }}
      >
        {/* Logo区域 */}
        <div className="logo" style={{ padding: '16px 24px' }}>
          <Space align="center">
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #1890ff 0%, #52c41a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Title level={4} style={{ color: 'white', margin: 0 }}>J</Title>
            </div>
            {!collapsed && (
              <div>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                  鲸选报表
                </div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                  自助查询平台
                </div>
              </div>
            )}
          </Space>
        </div>

        {/* 导航菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
        
        {/* 版本信息 */}
        {!collapsed && (
          <div style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            padding: '16px 24px',
            color: 'rgba(255,255,255,0.45)',
            fontSize: 12,
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div>版本: v1.0.0</div>
            <div>@ 2026 鲸选科技</div>
          </div>
        )}
      </Sider>

      {/* 右侧内容区域 */}
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s' }}>
        {/* 顶部头部 */}
        <Header 
          style={{ 
            padding: '0 24px', 
            background: 'white', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 999
          }}
        >
          {/* 左侧：折叠按钮和页面标题 */}
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            <Title level={4} style={{ margin: 0, marginLeft: 8 }}>
              {(() => {
                switch (location.pathname) {
                  case '/':
                  case '/orders':
                    return '订单查询'
                  case '/reports':
                    return '报表中心'
                  case '/exports':
                    return '导出历史'
                  case '/settings':
                    return '系统设置'
                  default:
                    return '鲸选报表平台'
                }
              })()}
            </Title>
          </Space>

          {/* 右侧：用户操作 */}
          <Space size="large">
            {/* 帮助按钮 */}
            <Dropdown menu={{ items: helpMenu.props.children.map((item, i) => ({ key: i, icon: item.props.icon, label: item.props.children })) }} trigger={['click']}>
              <Button type="text" icon={<QuestionCircleOutlined />} />
            </Dropdown>

            {/* 通知按钮 */}
            <Badge count={5} size="small">
              <Button type="text" icon={<BellOutlined />} />
            </Badge>

            {/* 用户信息 */}
            <Dropdown menu={{ items: userMenu.props.children.map((item, i) => ({ key: i, icon: item.props.icon, label: item.props.children })) }} trigger={['click']}>
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
                <Avatar
                  style={{ backgroundColor: '#1890ff' }}
                  icon={<UserOutlined />}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>运营管理员</div>
                  <div style={{ fontSize: 12, color: '#666' }}>admin@jingxuan.com</div>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 主要内容区域 */}
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          minHeight: 280,
          background: 'white',
          borderRadius: 6,
          overflow: 'auto'
        }}>
          {children}
        </Content>

        {/* 页脚 */}
        <Footer style={{ 
          textAlign: 'center', 
          padding: '16px 50px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <Space direction="vertical" size={4}>
            <div style={{ fontSize: 12, color: '#666' }}>
              鲸选自助报表平台 © 2026 鲸选科技有限公司
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              <Space split={<span style={{ margin: '0 8px' }}>|</span>}>
                <a href="#">隐私政策</a>
                <a href="#">用户协议</a>
                <a href="#">帮助中心</a>
                <a href="#">意见反馈</a>
              </Space>
            </div>
          </Space>
        </Footer>
      </Layout>
    </Layout>
  )
}