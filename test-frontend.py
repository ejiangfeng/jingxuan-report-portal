#!/usr/bin/env python3
"""
鲸选自助报表平台 - 前端功能测试
"""
from playwright.sync_api import sync_playwright, expect
import time

def test_frontend():
    with sync_playwright() as p:
        # 启动浏览器（无头模式）
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # 捕获控制台日志
        console_logs = []
        page.on('console', lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        
        print("=" * 60)
        print("🧪 鲸选自助报表平台 - 前端测试")
        print("=" * 60)
        
        # 1. 访问首页
        print("\n1️⃣ 访问首页...")
        page.goto('http://localhost:3000', wait_until='domcontentloaded', timeout=60000)
        page.wait_for_timeout(5000)  # 等待 React 渲染
        
        # 截图
        page.screenshot(path='/tmp/homepage.png', full_page=True)
        print(f"   ✅ 页面加载成功，已截图")
        
        # 检查页面标题
        title = page.title()
        print(f"   📄 页面标题：{title}")
        
        # 2. 检查侧边栏菜单
        print("\n2️⃣ 检查侧边栏菜单...")
        menu_items = page.locator('.ant-menu-item').all()
        print(f"   📋 找到 {len(menu_items)} 个菜单项")
        for i, item in enumerate(menu_items):
            text = item.inner_text()
            print(f"      - {text}")
        
        # 3. 检查订单查询页面
        print("\n3️⃣ 检查订单查询页面...")
        
        # 查找日期选择器
        date_pickers = page.locator('.ant-picker').all()
        print(f"   📅 找到 {len(date_pickers)} 个日期选择器")
        
        # 查找查询按钮
        query_btn = page.locator('button:has-text("查询"), button:has-text("Query"), [type="submit"]').first
        if query_btn.count() > 0:
            print(f"   ✅ 找到查询按钮")
        else:
            print(f"   ⚠️ 未找到查询按钮")
        
        # 4. 测试 API 调用
        print("\n4️⃣ 测试 API 调用...")
        
        # 尝试点击查询按钮（如果有）
        try:
            if query_btn.count() > 0:
                # 先选择日期
                date_input = page.locator('.ant-picker').first
                if date_input.count() > 0:
                    date_input.click()
                    page.wait_for_timeout(500)
                    # 选择今天
                    today = page.locator('.ant-picker-cell-today').first
                    if today.count() > 0:
                        today.click()
                        page.wait_for_timeout(500)
                
                query_btn.click()
                page.wait_for_timeout(5000)
                
                # 检查是否有表格数据
                table_rows = page.locator('table tbody tr').all()
                print(f"   📊 查询结果：{len(table_rows)} 条数据")
                
                if len(table_rows) > 0:
                    print(f"   ✅ 数据加载成功")
                else:
                    # 检查是否有错误提示
                    error_msgs = page.locator('.ant-message-error, .ant-alert-error').all()
                    if len(error_msgs) > 0:
                        print(f"   ❌ 发现错误提示")
                    else:
                        print(f"   ⚠️ 无数据（可能是日期范围无数据）")
        except Exception as e:
            print(f"   ⚠️ 查询执行失败：{e}")
        
        # 5. 检查控制台错误
        print("\n5️⃣ 检查控制台日志...")
        errors = [log for log in console_logs if 'error' in log.lower() or 'failed' in log.lower()]
        if errors:
            print(f"   ⚠️ 发现 {len(errors)} 条错误日志:")
            for err in errors[:5]:  # 只显示前 5 条
                print(f"      {err}")
        else:
            print(f"   ✅ 无错误日志")
        
        # 6. 检查网络请求
        print("\n6️⃣ 检查网络请求...")
        page.goto('http://localhost:3000')
        page.wait_for_timeout(2000)
        
        # 7. 测试报表中心页面
        print("\n7️⃣ 访问报表中心...")
        try:
            reports_menu = page.locator('.ant-menu-item:has-text("报表"), .ant-menu-item:has-text("Report")').first
            if reports_menu.count() > 0:
                reports_menu.click()
                page.wait_for_timeout(2000)
                page.screenshot(path='/tmp/reports.png', full_page=True)
                print(f"   ✅ 报表中心页面访问成功")
            else:
                print(f"   ⚠️ 未找到报表中心菜单")
        except Exception as e:
            print(f"   ⚠️ 访问报表中心失败：{e}")
        
        # 关闭浏览器
        browser.close()
        
        print("\n" + "=" * 60)
        print("📊 测试完成")
        print("=" * 60)
        print(f"截图已保存到：/tmp/homepage.png, /tmp/reports.png")

if __name__ == '__main__':
    test_frontend()
