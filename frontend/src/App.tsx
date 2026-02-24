import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ConfigProvider, App as AntdApp, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

// 页面组件
import { OrderQueryPage } from './pages/OrderQueryPage'
import { ReportListPage } from './pages/ReportListPage'
import { ExportHistoryPage } from './pages/ExportHistoryPage'

// 布局组件
import { AppLayout } from './components/Layout/AppLayout'

// 设置dayjs本地化
dayjs.locale('zh-cn')

function App() {
  // 根据时间自动切换主题
  const hour = new Date().getHours()
  const isDark = hour >= 18 || hour < 6

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          wireframe: false,
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#fafafa',
          },
          Table: {
            headerBg: '#fafafa',
            headerColor: '#666',
            headerSplitColor: '#f0f0f0',
          },
          Card: {
            headerBg: 'transparent',
          },
        },
      }}
    >
      <AntdApp>
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<OrderQueryPage />} />
              <Route path="/reports" element={<ReportListPage />} />
              <Route path="/exports" element={<ExportHistoryPage />} />
              <Route path="/orders" element={<OrderQueryPage />} />
            </Routes>
          </AppLayout>
        </Router>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App