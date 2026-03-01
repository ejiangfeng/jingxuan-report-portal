#!/usr/bin/env python3
"""
鲸选报表平台 - 完整测试脚本
"""
import os
import json
import urllib.request
import urllib.error

def test_api(name, url, method='GET', data=None, expect_success=True):
    """测试单个 API"""
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode() if data else None,
            headers={'Content-Type': 'application/json'} if data else {},
            method=method
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            result = json.loads(r.read().decode())
            if not expect_success or result.get('success') or result.get('status') == 'ok':
                items = result.get('data', {}).get('items', result.get('data', []))
                print(f"✅ {name}: 成功 ({len(items) if isinstance(items, list) else 'N/A'} 条)")
                return True
            else:
                print(f"❌ {name}: {result.get('error', '未知错误')}")
                return False
    except urllib.error.HTTPError as e:
        print(f"❌ {name}: HTTP {e.code}")
        return False
    except Exception as e:
        print(f"❌ {name}: {str(e)[:60]}")
        return False

def main():
    print("=" * 60)
    print("🧪 鲸选报表平台 - API 测试")
    print("=" * 60)
    
    base_url = "http://localhost:4000/api/v1"
    passed = 0
    failed = 0
    
    # 1. 健康检查
    print("\n1️⃣ 健康检查...")
    if test_api("健康检查", f"{base_url}/health"):
        passed += 1
    else:
        failed += 1
        print("⚠️ 后端未运行，退出测试")
        return
    
    # 2. 订单查询
    print("\n2️⃣ 订单查询测试...")
    tests = [
        ("基础查询", {"startTime": "2026-02-26", "endTime": "2026-02-26", "page": 1, "pageSize": 20}),
        ("按状态筛选", {"startTime": "2026-02-26", "endTime": "2026-02-26", "status": "交易成功"}),
        ("按门店筛选", {"startTime": "2026-02-26", "endTime": "2026-02-26", "stationCodes": "2625"}),
        ("按订单号筛选", {"startTime": "2026-02-26", "endTime": "2026-02-26", "orderNumber": "ORD"}),
    ]
    for name, data in tests:
        if test_api(f"订单-{name}", f"{base_url}/orders/query", 'POST', data):
            passed += 1
        else:
            failed += 1
    
    # 3. 其他报表
    print("\n3️⃣ 其他报表测试...")
    other_tests = [
        ("商品渗透率", "/reports/penetration/query", {"startTime": "2026-02-26", "endTime": "2026-02-26"}),
        ("搜索关键词", "/reports/search-keyword/query", {"startTime": "2026-02-26", "endTime": "2026-02-26"}),
        ("优惠券", "/reports/coupon/query", {"receiveStartTime": "2026-02-26", "receiveEndTime": "2026-02-26"}),
        ("免运活动", "/reports/freight-activity/query", {"startTime": "2026-02-26", "endTime": "2026-02-26"}),
        ("社群拉新", "/reports/invitation/query", {"startTime": "2026-02-26", "endTime": "2026-02-26"}),
        ("商城用户", "/reports/mall-user/query", {"date": "2026-02-26"}),
        ("助力活动", "/reports/support/query", {"startTime": "2026-02-26", "endTime": "2026-02-26"}),
    ]
    for name, path, data in other_tests:
        if test_api(name, f"{base_url}{path}", 'POST', data):
            passed += 1
        else:
            failed += 1
    
    # 4. 导出功能
    print("\n4️⃣ 导出功能测试...")
    export_tests = [
        ("订单导出", "/orders/export", {"startTime": "2026-02-26", "endTime": "2026-02-26", "exportType": "order"}),
        ("社群拉新导出", "/reports/invitation/export", {"startTime": "2026-02-26", "endTime": "2026-02-26"}),
        ("导出任务列表", "/exports", None),
    ]
    for name, path, data in export_tests:
        if test_api(name, f"{base_url}{path}", 'POST' if data else 'GET', data):
            passed += 1
        else:
            failed += 1
    
    # 总结
    print("\n" + "=" * 60)
    print("📊 测试结果汇总")
    print("=" * 60)
    print(f"✅ 通过：{passed}")
    print(f"❌ 失败：{failed}")
    print(f"总计：{passed + failed}")
    print("=" * 60)
    
    if failed == 0:
        print("\n🎉 所有测试通过！")
    else:
        print(f"\n⚠️ 有 {failed} 个测试失败")

if __name__ == '__main__':
    main()
