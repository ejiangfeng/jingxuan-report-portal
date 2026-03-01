
// 分类展开/收起
window.toggleCategory = function(categoryId) {
    const category = document.getElementById(categoryId);
    const arrow = category.previousElementSibling.querySelector('.category-arrow');
    
    if (category.classList.contains('collapsed')) {
        category.classList.remove('collapsed');
        arrow.classList.remove('collapsed');
    } else {
        category.classList.add('collapsed');
        arrow.classList.add('collapsed');
    }
}

// 初始化日期函数
function initPenetrationDates() {
    const today = new Date();
    const t1 = new Date(today);
    t1.setDate(t1.getDate() - 1);
    const t7 = new Date(today);
    t7.setDate(t7.getDate() - 7);
    
    const penStartDate = document.getElementById('penStartDate');
    const penEndDate = document.getElementById('penEndDate');
    
    if (!penStartDate.value) {
        penStartDate.value = t7.toISOString().split('T')[0];
    }
    if (!penEndDate.value) {
        penEndDate.value = t1.toISOString().split('T')[0];
    }
}

function initSearchDates() {
    const today = new Date();
    const t1 = new Date(today);
    t1.setDate(t1.getDate() - 1);
    const t7 = new Date(today);
    t7.setDate(t7.getDate() - 7);
    
    const searchStartDate = document.getElementById('searchStartDate');
    const searchEndDate = document.getElementById('searchEndDate');
    
    if (!searchStartDate.value) {
        searchStartDate.value = t7.toISOString().split('T')[0];
    }
    if (!searchEndDate.value) {
        searchEndDate.value = t1.toISOString().split('T')[0];
    }
}

// 订单查询功能
document.addEventListener('DOMContentLoaded', function() {
    // 订单搜索按钮
    const orderSearchBtn = document.getElementById('orderSearchBtn');
    if (orderSearchBtn) {
        orderSearchBtn.addEventListener('click', function() {
            const startDate = document.getElementById('orderStartDate').value;
            const endDate = document.getElementById('orderEndDate').value;
            const status = document.getElementById('orderStatus').value;
            const storeCode = document.getElementById('orderStoreCode').value;
            const orderNumber = document.getElementById('orderNumber').value;
            const productCode = document.getElementById('productCode').value;
            
            if (!startDate || !endDate) {
                alert('请选择日期范围');
                return;
            }
            
            console.log('订单查询参数:', {
                startDate,
                endDate,
                status,
                storeCode,
                orderNumber,
                productCode
            });
            
            // 调用后端 API 查询数据
            const API_BASE = 'http://localhost:4001/api/v1';
            fetch(API_BASE + '/orders/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    startTime: startDate, 
                    endTime: endDate, 
                    status: status, 
                    stationCodes: storeCode,
                    page: 1,
                    pageSize: 20
                })
            })
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    renderOrderTable(result.data.items || []);
                } else {
                    alert('查询失败：' + result.error);
                }
            })
            .catch(err => {
                console.error('查询错误:', err);
                alert('查询失败：' + err.message);
            });
        });
    }
    
    // 重置按钮
    const orderResetBtn = document.getElementById('orderResetBtn');
    if (orderResetBtn) {
        orderResetBtn.addEventListener('click', function() {
            const today = new Date();
            const t7 = new Date(today);
            t7.setDate(t7.getDate() - 7);
            
            document.getElementById('orderStartDate').value = t7.toISOString().split('T')[0];
            document.getElementById('orderEndDate').value = today.toISOString().split('T')[0];
            document.getElementById('orderStatus').value = '';
            document.getElementById('orderStoreCode').value = '';
            document.getElementById('orderNumber').value = '';
            document.getElementById('productCode').value = '';
        });
    }
    
    // 清除按钮
    const orderClearBtn = document.getElementById('orderClearBtn');
    if (orderClearBtn) {
        orderClearBtn.addEventListener('click', function() {
            document.getElementById('orderStartDate').value = '';
            document.getElementById('orderEndDate').value = '';
            document.getElementById('orderStatus').value = '';
            document.getElementById('orderStoreCode').value = '';
            document.getElementById('orderNumber').value = '';
            document.getElementById('productCode').value = '';
        });
    }
    
    // 高级查询按钮
    const orderAdvancedBtn = document.getElementById('orderAdvancedBtn');
    if (orderAdvancedBtn) {
        orderAdvancedBtn.addEventListener('click', function() {
            alert('高级查询功能开发中...');
        });
    }
    
    // 导出按钮
    const orderExportCurrent = document.getElementById('orderExportCurrent');
    const orderExportAll = document.getElementById('orderExportAll');
    
    if (orderExportCurrent) {
        orderExportCurrent.addEventListener('click', function() {
            alert('导出当前页功能待实现');
        });
    }
    
    if (orderExportAll) {
        orderExportAll.addEventListener('click', function() {
            alert('导出功能待实现');
        });
    }
    
    // 打印按钮
    const orderPrint = document.getElementById('orderPrint');
    if (orderPrint) {
        orderPrint.addEventListener('click', function() {
            window.print();
        });
    }
    
    // 功能按钮
    const orderFunc = document.getElementById('orderFunc');
    if (orderFunc) {
        orderFunc.addEventListener('click', function() {
            alert('功能菜单开发中...');
        });
    }
    
    // 初始化默认报表
    switchReport('order');
});

// 测试数据（演示用）
const mockOrderData = [
    {
        '行号': 1,
        '订单号': 'ORD202602270001',
        '下单时间': '2026-02-27 10:30:25',
        '订单状态': '交易成功',
        '门店代码': '2625',
        '商品总金额': 299.00,
        '优惠金额': 30.00,
        '实付金额': 269.00,
        '支付方式': '微信支付'
    },
    {
        '行号': 2,
        '订单号': 'ORD202602270002',
        '下单时间': '2026-02-27 11:15:42',
        '订单状态': '待发货',
        '门店代码': '1405',
        '商品总金额': 599.00,
        '优惠金额': 50.00,
        '实付金额': 549.00,
        '支付方式': '支付宝'
    }
];

// 渲染订单表格（演示用）
function renderOrderTable(data) {
    const tbody = document.getElementById('orderTableBody');
    if (!tbody || data.length === 0) return;
    
    tbody.innerHTML = data.map(row => `
        <tr>
            <td>${row['行号']}</td>
            <td>${row['订单号']}</td>
            <td>${row['下单时间']}</td>
            <td><span class="status-tag status-${row['订单状态']}">${row['订单状态']}</span></td>
            <td>${row['门店代码']}</td>
            <td>¥${row['商品总金额'].toFixed(2)}</td>
            <td>¥${row['优惠金额'].toFixed(2)}</td>
            <td>¥${row['实付金额'].toFixed(2)}</td>
            <td>${row['支付方式']}</td>
        </tr>
    `).join('');
    
    document.getElementById('orderTotal').textContent = data.length;
    document.getElementById('orderCurrentPage').textContent = 1;
    document.getElementById('orderTotalPages').textContent = 1;
}

// ========== 助力活动查询 ==========
let supportCurrentPage = 1;
const supportPageSize = 20;
let supportTotalRecords = 0;


// 助力活动查询
async function loadSupportData() {
    const startTime = document.getElementById('supportStartDate').value;
    const endTime = document.getElementById('supportEndDate').value;
    const activityId = document.getElementById('supportActivityId').value;
    
    if (!startTime || !endTime) {
        alert('请选择日期范围');
        return;
    }
    
    document.getElementById('supportLoading') && (document.getElementById('supportLoading').style.display = 'block');
    document.getElementById('supportTableBody').innerHTML = '';
    
    try {
        const API_BASE = 'http://localhost:4001/api/v1';
        const response = await fetch(API_BASE + '/reports/support/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                startTime,
                endTime,
                activityId,
                page: supportCurrentPage,
                pageSize: supportPageSize
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderSupportTable(result.data.items || []);
            updateSupportPagination(result.data.total || 0);
        } else {
            alert('查询失败：' + result.error);
        }
    } catch (error) {
        console.error('查询失败:', error);
        alert('查询失败：' + error.message);
    } finally {
        document.getElementById('supportLoading') && (document.getElementById('supportLoading').style.display = 'none');
    }
}

// 渲染助力活动表格
function renderSupportTable(items) {
    const tbody = document.getElementById('supportTableBody');
    tbody.innerHTML = '';
    
    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-data">暂无数据，请点击查询</td></tr>';
        return;
    }
    
    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item['用户手机号'] || '-'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${formatDate(item['助力时间']) || '-'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item['活动 ID'] || '-'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item['活动名称'] || '-'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;"><span class="status-tag">${item['助力状态'] || '-'}</span></td>
            <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">¥${item['奖励金额'] || '0.00'}</td>
        `;
        tbody.appendChild(row);
    });
}

// 更新助力活动分页
function updateSupportPagination(total) {
    const start = (supportCurrentPage - 1) * supportPageSize + 1;
    const end = Math.min(supportCurrentPage * supportPageSize, total);
    
    document.getElementById('supportCurrentPage').textContent = supportCurrentPage;
    document.getElementById('supportTotalPages').textContent = Math.ceil(total / supportPageSize) || 1;
    document.getElementById('supportTotal').textContent = total;
}

// 改变助力活动页码
function changeSupportPage(direction) {
    supportCurrentPage += direction;
    loadSupportData();
}

// 初始化助力活动报表
document.addEventListener('DOMContentLoaded', function() {
    }
    
    if (supportResetBtn) {
        supportResetBtn.addEventListener('click', function() {
            
            document.getElementById('supportActivityId').value = '';
        });
    }
    
    }
    
    if (supportExportBtn) {
        supportExportBtn.addEventListener('click', async function() {
            const startTime = document.getElementById('supportStartDate').value;
            const endTime = document.getElementById('supportEndDate').value;
            const activityId = document.getElementById('supportActivityId').value;
            
            if (!startTime || !endTime) {
                alert('请选择日期范围');
                return;
            }
            
            try {
                const API_BASE = 'http://localhost:4001/api/v1';
                const response = await fetch(API_BASE + '/reports/support/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startTime, endTime, activityId })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ 导出任务已创建！任务 ID: ' + result.data.id);
                } else {
                    alert('导出失败：' + result.error);
                }
            } catch (error) {
                console.error('导出失败:', error);
                alert('导出失败：' + error.message);
            }
        });
    }
    
    }
    
    // 初始化日期
    
});
