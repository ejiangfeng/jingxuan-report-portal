import React from 'react'
import { Card, Typography, Empty } from 'antd'

const { Title, Paragraph } = Typography

export function ReportListPage() {
  return (
    <div className="report-list-page">
      <Card>
        <Title level={2}>报表列表</Title>
        <Paragraph type="secondary">
          鲸选自助报表平台的报表中心页面正在开发中...
        </Paragraph>
        <Empty
          description={
            <span>
              报表列表功能将在下一版本中提供
            </span>
          }
        />
      </Card>
    </div>
  )
}