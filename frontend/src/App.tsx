import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// React Router v7 兼容性配置
import { QueryClient, QueryClientProvider } from 'react-query'
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

// 设置 dayjs 本地化
dayjs.locale('zh-cn')

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
})

function App() {
  // 根据时间自动切换主题
  const hour = new Date().getHours()
  const isDark = hour >= 18 || hour < 6

  return (
    <QueryClientProvider client={queryClient}>
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
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
    </QueryClientProvider>
  )
}

export default App
