import React from 'react'
import { Card, Typography, Empty } from 'antd'

const { Title, Paragraph } = Typography

export function ExportHistoryPage() {
  return (
    <div className="export-history-page">
      <Card>
        <Title level={2}>导出历史</Title>
        <Paragraph type="secondary">
          鲸选自助报表平台的导出历史页面正在开发中...
        </Paragraph>
        <Empty
          description={
            <span>
              导出历史功能将在下一版本中提供
            </span>
          }
        />
      </Card>
    </div>
  )
}