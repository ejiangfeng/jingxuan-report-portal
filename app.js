        // API基础配置 - 自动检测运行环境
        // Docker环境（nginx代理）：使用相对路径 /api/v1
        // 本地开发环境：使用 hostname:4000/api/v1
        const API_BASE_URL = (window.location.port === '4000') 
            ? `${window.location.protocol}//${window.location.hostname}:4000/api/v1`
            : '/api/v1';
        
        // 状态管理
        let currentPage = 1;
        const pageSize = 10;
        let totalOrders = 0;
        
        // 报表切换函数 - 提前定义以便事件绑定使用
        window.showReport = function(reportType) {
            // 更新导航状态
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            document.getElementById('nav-' + reportType).classList.add('active');
            
            // 切换报表显示
            document.getElementById('order-report').style.display = reportType === 'order' ? 'block' : 'none';
            document.getElementById('penetration-report').style.display = reportType === 'penetration' ? 'block' : 'none';
            document.getElementById('coupon-report').style.display = reportType === 'coupon' ? 'block' : 'none';
            document.getElementById('freight-report').style.display = reportType === 'freight' ? 'block' : 'none';
            document.getElementById('invitation-report').style.display = reportType === 'invitation' ? 'block' : 'none';
            
            // 初始化商品渗透率报表日期 T-2 到 T-1
            if (reportType === 'penetration' && typeof initPenetrationDates === 'function') {
                initPenetrationDates();
            }
            
            // 初始化优惠券报表日期
            if (reportType === 'coupon' && typeof initCouponDates === 'function') {
                initCouponDates();
            }
            
            // 初始化社群拉新报表日期
            if (reportType === 'invitation' && typeof initInvitationDates === 'function') {
                initInvitationDates();
            }
            
            // 初始化商城用户下单报表日期
            if (reportType === 'mall-user' && typeof initMallUserDate === 'function') {
                initMallUserDate();
            }
            
            // 切换商城用户下单报表显示
            document.getElementById('mall-user-report').style.display = reportType === 'mall-user' ? 'block' : 'none';
            
            // 初始化免运活动报表日期
            if (reportType === 'freight' && typeof initFreightDates === 'function') {
                initFreightDates();
            }
            
            // 初始化社群拉新报表日期
            if (reportType === 'invitation' && typeof initInvitationDates === 'function') {
                initInvitationDates();
            }
        }
        
        // DOM元素
        const ordersBody = document.getElementById('ordersBody');
        const loading = document.getElementById('loading');
        const pageInfo = document.getElementById('pageInfo');
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        const searchBtn = document.getElementById('searchBtn');
        const exportBtn = document.getElementById('exportBtn');
        const clearBtn = document.getElementById('clearBtn');
        
        // 更新清空icon显示状态 - 挂载到window以便内联事件可访问
        window.updateClearIcon = function(input) {
            const wrapper = input.parentElement;
            if (input.value && input.value.trim() !== '') {
                wrapper.classList.add('has-value');
            } else {
                wrapper.classList.remove('has-value');
            }
        }
        
        // 点击清空icon清空输入框
        window.clearInputField = function(icon) {
            const wrapper = icon.parentElement;
            const input = wrapper.querySelector('input, select');
            if (input) {
                input.value = '';
                wrapper.classList.remove('has-value');
                if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0;
                }
            }
        }
        
        // 初始化所有输入框的清空icon状态
        function initClearIcons() {
            document.querySelectorAll('.input-wrapper input, .input-wrapper select').forEach(input => {
                window.updateClearIcon(input);
            });
        }
        
        // 兼容旧函数
        window.clearInput = function(id) {
            const input = document.getElementById(id);
            if (input) {
                input.value = '';
                window.updateClearIcon(input);
            }
        }
        
        window.clearSelect = function(id) {
            const select = document.getElementById(id);
            if (select) {
                select.value = '';
                window.updateClearIcon(select);
            }
        }
        
        // 初始化函数
        function initOrderReport() {
            const today = new Date();
            const t1 = new Date(today);
            t1.setDate(t1.getDate() - 1);
            const t2 = new Date(today);
            t2.setDate(t2.getDate() - 2);
            
            document.getElementById('startDate').value = t2.toISOString().split('T')[0];
            document.getElementById('endDate').value = t1.toISOString().split('T')[0];
            
            // 绑定事件
            searchBtn.addEventListener('click', function() {
                currentPage = 1;
                loadData();
            });
            exportBtn.addEventListener('click', exportData);
            document.getElementById('viewExportsBtn').addEventListener('click', function() { window.openExportModal(); });
            clearBtn.addEventListener('click', clearFilters);
            prevPage.addEventListener('click', () => changePage(-1));
            nextPage.addEventListener('click', () => changePage(1));
            
            // 绑定导航链接点击事件
            document.querySelectorAll('a[data-report-type]').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const reportType = this.getAttribute('data-report-type');
                    window.showReport(reportType);
                });
            });
            
            // 绑定所有清除图标点击事件
            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('clear-icon') || e.target.hasAttribute('data-clear-input')) {
                    const wrapper = e.target.parentElement;
                    const input = wrapper.querySelector('input, select');
                    if (input) {
                        input.value = '';
                        wrapper.classList.remove('has-value');
                        if (input.tagName === 'SELECT') {
                            input.selectedIndex = 0;
                        }
                        // 触发change事件
                        input.dispatchEvent(new Event('change'));
                    }
                }
            });
            
            // 绑定所有选择框change事件来更新清除图标
            document.addEventListener('change', function(e) {
                if (e.target.tagName === 'SELECT') {
                    const wrapper = e.target.parentElement;
                    if (e.target.value && e.target.value.trim() !== '') {
                        wrapper.classList.add('has-value');
                    } else {
                        wrapper.classList.remove('has-value');
                    }
                }
            });
            
            // 绑定所有输入框input事件来更新清除图标
            document.addEventListener('input', function(e) {
                if (e.target.tagName === 'INPUT') {
                    const wrapper = e.target.parentElement;
                    if (e.target.value && e.target.value.trim() !== '') {
                        wrapper.classList.add('has-value');
                    } else {
                        wrapper.classList.remove('has-value');
                    }
                }
            });
            
            // 初始化所有输入框的清除图标状态
            setTimeout(() => {
                document.querySelectorAll('.input-wrapper input, .input-wrapper select').forEach(input => {
                    const wrapper = input.parentElement;
                    if (input.value && input.value.trim() !== '') {
                        wrapper.classList.add('has-value');
                    } else {
                        wrapper.classList.remove('has-value');
                    }
                });
            }, 100);
            
            // 绑定模态框按钮点击事件
            document.addEventListener('click', function(e) {
                const target = e.target.closest('[data-action]');
                if (!target) return;
                
                const action = target.getAttribute('data-action');
                
                switch(action) {
                    case 'close-export-type':
                        if (typeof window.closeExportTypeModal === 'function') {
                            window.closeExportTypeModal();
                        }
                        break;
                    case 'export':
                        const exportType = target.getAttribute('data-export-type');
                        if (typeof window.doExport === 'function' && exportType) {
                            window.doExport(exportType);
                        }
                        break;
                    case 'close-export':
                        if (typeof window.closeExportModal === 'function') {
                            window.closeExportModal();
                        }
                        break;
                    case 'refresh-export-tasks':
                        if (typeof window.refreshExportTasks === 'function') {
                            window.refreshExportTasks();
                        }
                        break;
                    case 'close-detail':
                        if (typeof window.closeDetailModal === 'function') {
                            window.closeDetailModal();
                        }
                        break;
                    case 'download-export':
                        const taskId = target.getAttribute('data-task-id');
                        if (typeof window.downloadExport === 'function' && taskId) {
                            window.downloadExport(taskId);
                        }
                        break;
                    case 'view-detail':
                        const orderId = target.getAttribute('data-order-id');
                        if (typeof window.viewDetail === 'function' && orderId) {
                            window.viewDetail(orderId);
                        }
                        break;
                }
            });
        }
        
        // 初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initOrderReport();
            });
        } else {
            initOrderReport();
        }
        
        // 加载订单数据
        async function loadData() {
            showLoading(true);
            
            try {
                const params = getQueryParams();
                params.page = currentPage;
                params.pageSize = pageSize;
                
                const response = await fetch(`${API_BASE_URL}/orders/query`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(params)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    totalOrders = data.data.total;
                    renderOrders(data.data.items);
                    updatePagination();
                } else {
                    showError('数据加载失败');
                }
            } catch (error) {
                console.error('加载数据失败:', error);
                showError('数据加载失败：' + error.message);
            } finally {
                showLoading(false);
            }
        }
        
        // 导出查询结果 - 打开选择弹窗
        function exportData() {
            document.getElementById('exportTypeModal').style.display = 'block';
        }
        
        // 关闭导出类型选择弹窗
        window.closeExportTypeModal = function() {
            document.getElementById('exportTypeModal').style.display = 'none';
        }
        
        // 执行导出
        window.doExport = async function(exportType) {
            closeExportTypeModal();
            
            const params = getQueryParams();
            params.exportType = exportType;
            
            try {
                const response = await fetch(`${API_BASE_URL}/orders/export`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(params)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    const typeName = exportType === 'order-detail' ? '订单明细' : '订单';
                    alert(`✅ ${typeName}导出任务已创建！\n\n任务ID: ${data.data.id}\n\n请点击"📋 导出任务"按钮查看进度和下载文件。`);
                } else {
                    if (data.error && data.error.includes('超出')) {
                        alert(`⚠️ ${data.error}\n\n当前查询结果共 ${data.total || '--'} 条记录。`);
                    } else {
                        alert('导出失败: ' + data.error);
                    }
                }
            } catch (error) {
                console.error('导出失败:', error);
                alert('创建导出任务失败，请检查后端服务是否正常运行。');
            }
        }
        
        // 打开导出任务弹窗
        window.openExportModal = function() {
            document.getElementById('exportModal').style.display = 'block';
            refreshExportTasks();
        }
        
        // 关闭导出任务弹窗
        window.closeExportModal = function() {
            document.getElementById('exportModal').style.display = 'none';
        }
        
        // 刷新导出任务列表
        window.refreshExportTasks = async function() {
            const listEl = document.getElementById('exportTasksList');
            listEl.innerHTML = '加载中...';
            
            try {
                const response = await fetch(`${API_BASE_URL}/exports`);
                const data = await response.json();
                
                if (data.success && data.data.length > 0) {
                    listEl.innerHTML = data.data.map(task => {
                        const statusText = {
                            'processing': '<span style="color: #fa8c16;">⏳ 处理中</span>',
                            'completed': '<span style="color: #52c41a;">✅ 已完成</span>',
                            'failed': '<span style="color: #f5222d;">❌ 失败</span>'
                        }[task.status] || task.status;
                        
                        const downloadBtn = task.status === 'completed' 
                            ? `<button class="btn-primary" style="padding: 4px 12px; font-size: 12px;" data-action="download-export" data-task-id="${task.id}">⬇️ 下载</button>`
                            : '';
                        
                        const fileSize = task.file_size 
                            ? `${(task.file_size / 1024).toFixed(1)} KB`
                            : '--';
                        
                        // 任务类型显示
                        const typeLabels = {
                            'order': '📋 订单导出',
                            'order-detail': '📦 订单明细导出',
                            'product-penetration': '📊 商品渗透率',
                            'coupon-query': '🎫 优惠券领用核销',
                            'freight-activity': '🚚 免运活动查询',
                            'invitation': '👥 社群拉新'
                        };
                        const typeLabel = typeLabels[task.type] || '📋 导出';
                        
                        return `
                            <div style="border: 1px solid #e8e8e8; border-radius: 4px; padding: 12px; margin-bottom: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-weight: bold; margin-bottom: 4px;">${typeLabel}</div>
                                        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">${task.id}</div>
                                        <div style="font-size: 12px; color: #666;">
                                            创建时间: ${formatDate(task.created_at)} | 
                                            记录数: ${task.total || '--'} | 
                                            文件大小: ${fileSize}
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="margin-bottom: 4px;">${statusText}</div>
                                        ${downloadBtn}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    listEl.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">暂无导出任务</div>';
                }
            } catch (error) {
                console.error('获取任务列表失败:', error);
                listEl.innerHTML = '<div style="text-align: center; color: #f5222d; padding: 20px;">获取任务列表失败，请检查后端服务</div>';
            }
        }
        
        // 下载导出文件
        window.downloadExport = function(taskId) {
            window.open(`${API_BASE_URL}/exports/download/${taskId}`, '_blank');
        }
        
        // 获取查询参数
        function getQueryParams() {
            return {
                startTime: document.getElementById('startDate').value,
                endTime: document.getElementById('endDate').value,
                status: document.getElementById('status').value === '' ? undefined : document.getElementById('status').value,
                stationCodes: document.getElementById('storeCode').value === '' ? undefined : document.getElementById('storeCode').value
            };
        }
        
        // 清空筛选条件
        function clearFilters() {
            const today = new Date();
            const t1 = new Date(today);
            t1.setDate(t1.getDate() - 1);
            const t2 = new Date(today);
            t2.setDate(t2.getDate() - 2);
            
            document.getElementById('startDate').value = t2.toISOString().split('T')[0];
            document.getElementById('endDate').value = t1.toISOString().split('T')[0];
            document.getElementById('status').value = '';
            document.getElementById('storeCode').value = '';
            
            currentPage = 1;
            // 清空后不自动加载
        }
        
        // 渲染订单数据
        function renderOrders(orders) {
            ordersBody.innerHTML = '';
            
            if (!orders || orders.length === 0) {
                ordersBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 40px; color: #999;">
                            暂无订单数据
                        </td>
                    </tr>
                `;
                return;
            }
            
            orders.forEach(order => {
                const row = document.createElement('tr');
                
                const statusClass = order.订单状态 === '交易成功' ? 'status-success' : 
                                   order.订单状态.includes('待') ? 'status-pending' : '';
                
                // 优惠券信息格式化
                let couponHtml = '<span style="color: #999;">-</span>';
                if (order.优惠券名称) {
                    const couponAmount = order.优惠券减免金额 ? `¥${parseFloat(order.优惠券减免金额).toFixed(2)}` : '';
                    couponHtml = `
                        <div style="font-size: 12px;">
                            <div style="color: #722ed1; font-weight: 500;">${order.优惠券名称}</div>
                            ${couponAmount ? `<div style="color: #52c41a;">-${couponAmount}</div>` : ''}
                        </div>
                    `;
                }
                
                row.innerHTML = `
                    <td style="font-weight: bold;">${order.订单号}</td>
                    <td>${formatDate(order.下单时间)}</td>
                    <td><span class="status ${statusClass}">${order.订单状态}</span></td>
                    <td>${order.所属门店名称 || ''}<br><small style="color: #999;">${order.所属门店代码 || ''}</small></td>
                    <td style="text-align: right; font-weight: bold; color: #fa8c16;">¥${(order.商品总金额 || 0).toLocaleString()}</td>
                    <td>${couponHtml}</td>
                    <td style="text-align: right; font-weight: bold; color: #52c41a;">¥${(order.客户实付金额 || 0).toLocaleString()}</td>
                    <td>
                        <button data-action="view-detail" data-order-id="${order.订单号}" style="background: none; border: none; color: #1890ff; cursor: pointer; font-size: 12px;">
                            查看详情
                        </button>
                    </td>
                `;
                
                ordersBody.appendChild(row);
            });
        }
        
                                    <tr><td style="color: #666; padding: 4px 0;">订单状态:</td><td><span class="status ${order.订单状态 === '交易成功' ? 'status-success' : ''}">${order.订单状态 || '-'}</span></td></tr>
                                    <tr><td style="color: #666; padding: 4px 0;">下单人手机:</td><td>${order.下单人手机号 || '-'}</td></tr>
                                </table>
                            </div>
                            
                            <div>
                                <h4 style="margin: 0 0 8px 0; color: #1890ff;">🏪 门店信息</h4>
                                <table style="width: 100%; font-size: 13px;">
                                    <tr><td style="color: #666; padding: 4px 0;">门店名称:</td><td>${order.所属门店名称 || '-'}</td></tr>
                                    <tr><td style="color: #666; padding: 4px 0;">门店代码:</td><td>${order.所属门店代码 || '-'}</td></tr>
                                    <tr><td style="color: #666; padding: 4px 0;">配送方式:</td><td>${order.配送方式 || '-'}</td></tr>
                                    <tr><td style="color: #666; padding: 4px 0;">收货人:</td><td>${order.收货人 || '-'} ${order.收货人手机号 || ''}</td></tr>
                                </table>
                            </div>
                            
                            <div>
                                <h4 style="margin: 0 0 8px 0; color: #52c41a;">💰 金额明细</h4>
                                <table style="width: 100%; font-size: 13px;">
                                    <tr><td style="color: #666; padding: 4px 0;">商品种类数:</td><td>${order.商品种类数 || 0}</td></tr>
                                    <tr><td style="color: #666; padding: 4px 0;">商品总数量:</td><td>${order.商品总数量 || 0}</td></tr>
                                    <tr><td style="color: #666; padding: 4px 0;">商品总金额:</td><td style="font-weight: bold;">¥${(order.商品总金额 || 0).toLocaleString()}</td></tr>
                                    <tr><td style="color: #666; padding: 4px 0;">优惠总金额:</td><td style="color: #f5222d;">-¥${(order.优惠总金额 || 0).toLocaleString()}</td></tr>
                                    <tr><td style="color: #666; padding: 4px 0;">原应付运费:</td><td>¥${(order.原应付运费金额 || 0).toLocaleString()}</td></tr>
                                    <tr><td style="color: #666; padding: 4px 0;">运费优惠:</td><td style="color: #f5222d;">-¥${(order.运费活动优惠金额 || 0).toLocaleString()}</td></tr>
                                    <tr><td style="color: #666; padding: 4px 0;">包装费:</td><td>¥${(order.包装费 || 0).toLocaleString()}</td></tr>
                                    <tr style="background: #f6ffed;"><td style="color: #666; padding: 4px 0; font-weight: bold;">客户实付:</td><td style="font-weight: bold; color: #52c41a; font-size: 15px;">¥${(order.客户实付金额 || 0).toLocaleString()}</td></tr>
                                </table>
                            </div>
                            
                            <div>
                                <h4 style="margin: 0 0 8px 0; color: #722ed1;">🎫 优惠券信息</h4>
                                ${order.优惠券名称 ? `
                                    <table style="width: 100%; font-size: 13px; background: #f9f0ff; padding: 8px; border-radius: 4px;">
                                        <tr><td style="color: #666; padding: 4px 0;">优惠券名称:</td><td style="color: #722ed1; font-weight: 500;">${order.优惠券名称}</td></tr>
                                        <tr><td style="color: #666; padding: 4px 0;">优惠券ID:</td><td>${order.优惠券ID || '-'}</td></tr>
                                        <tr><td style="color: #666; padding: 4px 0;">使用条件:</td><td>${order.优惠券使用条件 || '-'}</td></tr>
                                        <tr><td style="color: #666; padding: 4px 0;">减免金额:</td><td style="color: #f5222d; font-weight: bold;">-¥${(order.优惠券减免金额 || 0).toLocaleString()}</td></tr>
                                    </table>
                                ` : '<div style="color: #999; padding: 12px; background: #fafafa; border-radius: 4px;">未使用优惠券</div>'}
                            </div>
                            
                            <div style="grid-column: 1 / -1;">
                                <h4 style="margin: 0 0 8px 0; color: #fa8c16;">💳 支付分摊</h4>
                                <table style="width: 100%; font-size: 13px;">
                                    <tr>
                                        <td style="padding: 4px 8px; color: #666;">支付宝:</td><td style="width: 80px;">¥${(order.支付宝支付 || 0).toLocaleString()}</td>
                                        <td style="padding: 4px 8px; color: #666;">微信支付:</td><td style="width: 80px;">¥${(order.微信支付 || 0).toLocaleString()}</td>
                                        <td style="padding: 4px 8px; color: #666;">储值卡:</td><td style="width: 80px;">¥${(order.储值卡支付 || 0).toLocaleString()}</td>
                                        <td style="padding: 4px 8px; color: #666;">卡包:</td><td style="width: 80px;">¥${(order.卡包支付 || 0).toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 4px 8px; color: #666;">微支付:</td><td>¥${(order.微支付 || 0).toLocaleString()}</td>
                                        <td style="padding: 4px 8px; color: #666;">硕洋饭卡:</td><td>¥${(order.硕洋饭卡支付 || 0).toLocaleString()}</td>
                                        <td style="padding: 4px 8px; color: #666;">津贴:</td><td>¥${(order.津贴支付 || 0).toLocaleString()}</td>
                                        <td></td><td></td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="grid-column: 1 / -1;">
                                <h4 style="margin: 0 0 8px 0; color: #666;">📍 收货地址</h4>
                                <div style="background: #fafafa; padding: 8px; border-radius: 4px; font-size: 13px;">
                                    ${order.收货地址 || '-'}
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    contentEl.innerHTML = '<div style="text-align: center; color: #f5222d; padding: 40px;">订单不存在或加载失败</div>';
                }
            } catch (error) {
                console.error('获取订单详情失败:', error);
                contentEl.innerHTML = '<div style="text-align: center; color: #f5222d; padding: 40px;">获取订单详情失败</div>';
            }
        }
        
        // 关闭详情弹窗
        window.closeDetailModal = function() {
            document.getElementById('detailModal').style.display = 'none';
        }
        
        // 工具函数
        function formatDate(isoString) {
            if (!isoString) return '';
            // 如果是 ISO 格式字符串
            if (typeof isoString === 'string' && isoString.includes('T')) {
                // OceanBase 存储的是北京时间，但返回格式是 UTC（带 Z）
                // 所以需要从解析的时间中减去 8 小时
                const date = new Date(isoString);
                date.setHours(date.getHours() - 8);
                
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${year}/${month}/${day} ${hours}:${minutes}`;
            }
            // 其他格式直接返回
            return isoString;
        }
        
        function formatExportTime(isoString) {
            if (!isoString) return '';
            // 导出任务的时间是后端生成的真实 UTC 时间，需要加 8 小时
            if (typeof isoString === 'string' && isoString.includes('T')) {
                const date = new Date(isoString);
                date.setHours(date.getHours() + 8);
                
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${year}/${month}/${day} ${hours}:${minutes}`;
            }
            return isoString;
        }
        
        function showLoading(show) {
            loading.style.display = show ? 'block' : 'none';
        }
        
        function showError(message) {
            alert('错误: ' + message);
        }
        
        // ========== 商品渗透率报表 ==========
        let penData = [];
        let penCurrentPage = 1;
        const penPageSize = 20;
        let penTotalCount = 0;
        
        function initPenetrationDates() {
            const today = new Date();
            const t1 = new Date(today);
            t1.setDate(t1.getDate() - 1);
            const t2 = new Date(today);
            t2.setDate(t2.getDate() - 2);
            
            const penStartDate = document.getElementById('penStartDate');
            const penEndDate = document.getElementById('penEndDate');
            
            if (!penStartDate.value) {
                penStartDate.value = t2.toISOString().split('T')[0];
            }
            if (!penEndDate.value) {
                penEndDate.value = t1.toISOString().split('T')[0];
            }
        }
        
        // 商品渗透率查询
        async function loadPenetrationData() {
            const startTime = document.getElementById('penStartDate').value;
            const endTime = document.getElementById('penEndDate').value;
            const stationCodes = document.getElementById('penStoreCode').value;
            const barCodes = document.getElementById('penBarCode').value;
            const partyCodes = document.getElementById('penPartyCode').value;
            
            if (!startTime || !endTime) {
                alert('请选择日期范围');
                return;
            }
            
            if (!stationCodes) {
                alert('请输入门店代码');
                return;
            }
            
            document.getElementById('penLoading').style.display = 'block';
            document.getElementById('penetrationBody').innerHTML = '';
            
            try {
                const response = await fetch(`${API_BASE_URL}/reports/product-penetration`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        startTime, 
                        endTime, 
                        stationCodes, 
                        barCodes, 
                        partyCodes,
                        page: penCurrentPage,
                        pageSize: penPageSize
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    penData = result.data.items || [];
                    penTotalCount = result.data.total || 0;
                    penCurrentPage = 1;
                    document.getElementById('penTotalCount').textContent = penTotalCount;
                    document.getElementById('penExecTime').textContent = result.executionTime || '--';
                    renderPenetrationTablePage();
                    updatePenPagination();
                } else {
                    alert('查询失败：' + result.error);
                }
            } catch (error) {
                console.error('查询失败:', error);
                alert('查询失败: ' + error.message);
            } finally {
                document.getElementById('penLoading').style.display = 'none';
            }
        }
        
        // 渲染商品渗透率表格（分页）
        function renderPenetrationTablePage() {
            const tbody = document.getElementById('penetrationBody');
            tbody.innerHTML = '';
            
            if (!penData || penData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="13" style="text-align: center; padding: 40px; color: #999;">暂无数据</td></tr>';
                return;
            }
            
            const startIndex = (penCurrentPage - 1) * penPageSize;
            const endIndex = Math.min(startIndex + penPageSize, penTotalCount);
            const pageItems = penData.slice(startIndex, endIndex);
            
            pageItems.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.大类编码 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.大类名称 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.商品编码 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.商品条码 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="${item.商品名称 || ''}">${item.商品名称 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.规格 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right;">${item.购买数量 || 0}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right;">${item.商品订单量 || 0}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right;">${item.商品去重用户数 || 0}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #1890ff;">${item.商品大类订单渗透率 || 0}%</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #52c41a;">${item.商品大类用户渗透率 || 0}%</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #722ed1;">${item.商品全局订单渗透率 || 0}%</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #fa8c16;">${item.商品全局用户渗透率 || 0}%</td>
                `;
                tbody.appendChild(row);
            });
        }
        
        // 更新商品渗透率分页信息
        function updatePenPagination() {
            const start = (penCurrentPage - 1) * penPageSize + 1;
            const end = Math.min(penCurrentPage * penPageSize, penTotalCount);
            
            document.getElementById('penPageInfo').textContent = `${start}-${end} / ${penTotalCount}`;
            document.getElementById('penPrevPage').disabled = penCurrentPage <= 1;
            document.getElementById('penNextPage').disabled = penCurrentPage * penPageSize >= penTotalCount;
        }
        
        // 商品渗透率分页
        function changePenPage(direction) {
            penCurrentPage += direction;
            renderPenetrationTablePage();
            updatePenPagination();
        }
        
        // 导出商品渗透率报表
        async function exportPenetrationData() {
            const startTime = document.getElementById('penStartDate').value;
            const endTime = document.getElementById('penEndDate').value;
            const stationCodes = document.getElementById('penStoreCode').value;
            const barCodes = document.getElementById('penBarCode').value;
            const partyCodes = document.getElementById('penPartyCode').value;
            
            if (!startTime || !endTime || !stationCodes) {
                alert('请先设置筛选条件');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/reports/product-penetration/export`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startTime, endTime, stationCodes, barCodes, partyCodes })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(`✅ 导出任务已创建！\n\n任务ID: ${result.data.id}\n\n请点击"📋 导出任务"按钮查看进度和下载文件。`);
                } else {
                    if (result.error && result.error.includes('超出')) {
                        alert(`⚠️ ${result.error}`);
                    } else {
                        alert('导出失败: ' + result.error);
                    }
                }
            } catch (error) {
                console.error('导出失败:', error);
                alert('导出失败: ' + error.message);
            }
        }
        
        // 清空商品渗透率筛选
        function clearPenetrationFilters() {
            const today = new Date();
            const t1 = new Date(today);
            t1.setDate(t1.getDate() - 1);
            const t2 = new Date(today);
            t2.setDate(t2.getDate() - 2);
            
            document.getElementById('penStartDate').value = t2.toISOString().split('T')[0];
            document.getElementById('penEndDate').value = t1.toISOString().split('T')[0];
            document.getElementById('penStoreCode').value = '2625,1405,9976,3355,6591,4846,3362,9151,9394,1510,1374,3012,6688,4727,1737,7867,9933,3040,8422,7420,3365,3481,3910,1399,3971,5875,7928,9687,3367,8765,1571,7754,5876,3019,7378,3452,7689,3483,8075,1438,4647,9424,9765,1340,8066,6016,4718,3091,1313,1463,1722,8142,1433,5893,3089,8172,1576,7868,3456,3379,1321,9681,3496,1435,3074,9676,1521,6710,3043,9677,9920,1420,3385,1508,1444,3368,2246,3369,3455,1392,1308,1483,3449,3505,1481,1458,3383,3654,8328,3359,1501,1741,1373,1522,1332,1415,1325,3376,7732,1487,1739,7853,3900,2947,1490,3406,3011,1556,1557,1566,1512,1565,1615,1617,1616,1832,1882,1932';
            document.getElementById('penBarCode').value = '';
            document.getElementById('penPartyCode').value = '';
            
            // 清空数据
            penData = [];
            penCurrentPage = 1;
            penTotalCount = 0;
            document.getElementById('penetrationBody').innerHTML = '<tr><td colspan="13" style="text-align: center; padding: 40px; color: #999;">请设置筛选条件后点击查询</td></tr>';
            document.getElementById('penPageInfo').textContent = '--';
            document.getElementById('penTotalCount').textContent = '--';
            document.getElementById('penPrevPage').disabled = true;
            document.getElementById('penNextPage').disabled = true;
        }
        
        // ========== 优惠券领用核销报表 ==========
        let couponData = [];
        let couponCurrentPage = 1;
        const couponPageSize = 20;
        let couponTotalRecords = 0;
        
        function initCouponDates() {
            const today = new Date();
            const t1 = new Date(today);
            t1.setDate(t1.getDate() - 1);
            const t7 = new Date(today);
            t7.setDate(t7.getDate() - 7);
            
            if (!document.getElementById('couponReceiveStart').value) {
                document.getElementById('couponReceiveStart').value = t7.toISOString().split('T')[0];
            }
            if (!document.getElementById('couponReceiveEnd').value) {
                document.getElementById('couponReceiveEnd').value = t1.toISOString().split('T')[0];
            }
        }
        
        // 优惠券查询
        async function loadCouponData() {
            const receiveStartTime = document.getElementById('couponReceiveStart').value;
            const receiveEndTime = document.getElementById('couponReceiveEnd').value;
            const useStartTime = document.getElementById('couponUseStart').value;
            const useEndTime = document.getElementById('couponUseEnd').value;
            const couponIds = document.getElementById('couponIds').value;
            
            // 校验：至少填写一项日期
            if (!receiveStartTime && !receiveEndTime && !useStartTime && !useEndTime) {
                alert('请至少填写领用日期或核销日期其中一项');
                return;
            }
            
            document.getElementById('couponLoading').style.display = 'block';
            document.getElementById('couponBody').innerHTML = '';
            
            try {
                const response = await fetch(`${API_BASE_URL}/reports/coupon-query`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        receiveStartTime, receiveEndTime,
                        useStartTime, useEndTime,
                        couponIds,
                        page: couponCurrentPage,
                        pageSize: couponPageSize
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    couponData = result.data.items || [];
                    couponTotalRecords = result.data.total || 0;
                    document.getElementById('couponTotalCount').textContent = couponTotalRecords;
                    document.getElementById('couponExecTime').textContent = result.executionTime || '--';
                    renderCouponTable(couponData);
                    updateCouponPagination();
                } else {
                    alert('查询失败：' + result.error);
                }
            } catch (error) {
                console.error('查询失败:', error);
                alert('查询失败: ' + error.message);
            } finally {
                document.getElementById('couponLoading').style.display = 'none';
            }
        }
        
        // 渲染优惠券表格
        function renderCouponTable(items) {
            const tbody = document.getElementById('couponBody');
            tbody.innerHTML = '';
            
            if (!items || items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="14" style="text-align: center; padding: 40px; color: #999;">暂无数据</td></tr>';
                return;
            }
            
            items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.用户手机号 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.优惠券ID || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; max-width: 150px; overflow: hidden; text-overflow: ellipsis;" title="${item.优惠券名称 || ''}">${item.优惠券名称 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.领券时间 ? formatDate(item.领券时间) : '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.生效时间 ? formatDate(item.生效时间) : '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.失效时间 ? formatDate(item.失效时间) : '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.订单编号 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.配送方式 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.下单时间 ? formatDate(item.下单时间) : '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right;">¥${(item.商品总金额 || 0).toLocaleString()}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #f5222d;">¥${(item.优惠总金额 || 0).toLocaleString()}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #52c41a;">¥${(item.实付商品总金额 || 0).toLocaleString()}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.门店编码 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.门店名称 || '-'}</td>
                `;
                tbody.appendChild(row);
            });
        }
        
        // 更新分页
        function updateCouponPagination() {
            const start = (couponCurrentPage - 1) * couponPageSize + 1;
            const end = Math.min(couponCurrentPage * couponPageSize, couponTotalRecords);
            
            document.getElementById('couponPageInfo').textContent = couponTotalRecords > 0 ? `${start}-${end} / ${couponTotalRecords}` : '--';
            document.getElementById('couponPrevPage').disabled = couponCurrentPage <= 1;
            document.getElementById('couponNextPage').disabled = couponCurrentPage * couponPageSize >= couponTotalRecords;
        }
        
        // 分页
        function changeCouponPage(direction) {
            couponCurrentPage += direction;
            loadCouponData();
        }
        
        // 导出优惠券数据
        async function exportCouponData() {
            const receiveStartTime = document.getElementById('couponReceiveStart').value;
            const receiveEndTime = document.getElementById('couponReceiveEnd').value;
            const useStartTime = document.getElementById('couponUseStart').value;
            const useEndTime = document.getElementById('couponUseEnd').value;
            const couponIds = document.getElementById('couponIds').value;
            
            if (!receiveStartTime && !receiveEndTime && !useStartTime && !useEndTime) {
                alert('请至少填写领用日期或核销日期其中一项');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/reports/coupon-query/export`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        receiveStartTime, receiveEndTime,
                        useStartTime, useEndTime,
                        couponIds
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(`✅ 导出任务已创建！\n\n任务ID: ${result.data.id}\n\n请点击"📋 导出任务"按钮查看进度和下载文件。`);
                } else {
                    if (result.error && result.error.includes('超出')) {
                        alert(`⚠️ ${result.error}`);
                    } else {
                        alert('导出失败: ' + result.error);
                    }
                }
            } catch (error) {
                console.error('导出失败:', error);
                alert('导出失败: ' + error.message);
            }
        }
        
        // 清空优惠券筛选
        function clearCouponFilters() {
            const today = new Date();
            const t1 = new Date(today);
            t1.setDate(t1.getDate() - 1);
            const t7 = new Date(today);
            t7.setDate(t7.getDate() - 7);
            
            document.getElementById('couponReceiveStart').value = t7.toISOString().split('T')[0];
            document.getElementById('couponReceiveEnd').value = t1.toISOString().split('T')[0];
            document.getElementById('couponUseStart').value = '';
            document.getElementById('couponUseEnd').value = '';
            document.getElementById('couponIds').value = '';
            
            couponData = [];
            couponCurrentPage = 1;
            couponTotalRecords = 0;
            document.getElementById('couponBody').innerHTML = '<tr><td colspan="14" style="text-align: center; padding: 40px; color: #999;">请设置筛选条件后点击查询</td></tr>';
            document.getElementById('couponPageInfo').textContent = '--';
            document.getElementById('couponTotalCount').textContent = '--';
            document.getElementById('couponPrevPage').disabled = true;
            document.getElementById('couponNextPage').disabled = true;
        }
        
        // ========== 免运活动查询报表 ==========
        let freightData = [];
        let freightCurrentPage = 1;
        const freightPageSize = 20;
        let freightTotalRecords = 0;
        
        function initFreightDates() {
            const today = new Date();
            const t1 = new Date(today);
            t1.setDate(t1.getDate() - 1);
            const t7 = new Date(today);
            t7.setDate(t7.getDate() - 7);
            
            if (!document.getElementById('freightStartDate').value) {
                document.getElementById('freightStartDate').value = t7.toISOString().split('T')[0];
            }
            if (!document.getElementById('freightEndDate').value) {
                document.getElementById('freightEndDate').value = t1.toISOString().split('T')[0];
            }
        }
        
        // 免运活动查询
        async function loadFreightData() {
            const startTime = document.getElementById('freightStartDate').value;
            const endTime = document.getElementById('freightEndDate').value;
            
            if (!startTime || !endTime) {
                alert('请填写查询时间范围');
                return;
            }
            
            document.getElementById('freightLoading').style.display = 'block';
            document.getElementById('freightBody').innerHTML = '';
            
            try {
                const response = await fetch(`${API_BASE_URL}/reports/freight-activity`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        startTime,
                        endTime,
                        page: freightCurrentPage,
                        pageSize: freightPageSize
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    freightData = result.data.items || [];
                    freightTotalRecords = result.data.total || 0;
                    document.getElementById('freightTotalCount').textContent = freightTotalRecords;
                    document.getElementById('freightExecTime').textContent = result.executionTime || '--';
                    renderFreightTable(freightData);
                    updateFreightPagination();
                } else {
                    alert('查询失败：' + result.error);
                }
            } catch (error) {
                console.error('查询失败:', error);
                alert('查询失败: ' + error.message);
            } finally {
                document.getElementById('freightLoading').style.display = 'none';
            }
        }
        
        // 渲染免运活动表格
        function renderFreightTable(items) {
            const tbody = document.getElementById('freightBody');
            tbody.innerHTML = '';
            
            if (!items || items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">暂无数据</td></tr>';
                return;
            }
            
            items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.活动ID || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.活动名称 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.订单编号 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.下单时间 ? formatDate(item.下单时间) : '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.门店编码 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.门店名称 || '-'}</td>
                `;
                tbody.appendChild(row);
            });
        }
        
        // 更新分页
        function updateFreightPagination() {
            const start = (freightCurrentPage - 1) * freightPageSize + 1;
            const end = Math.min(freightCurrentPage * freightPageSize, freightTotalRecords);
            
            document.getElementById('freightPageInfo').textContent = freightTotalRecords > 0 ? `${start}-${end} / ${freightTotalRecords}` : '--';
            document.getElementById('freightPrevPage').disabled = freightCurrentPage <= 1;
            document.getElementById('freightNextPage').disabled = freightCurrentPage * freightPageSize >= freightTotalRecords;
        }
        
        // 分页
        function changeFreightPage(direction) {
            freightCurrentPage += direction;
            loadFreightData();
        }
        
        // 导出免运活动数据
        async function exportFreightData() {
            const startTime = document.getElementById('freightStartDate').value;
            const endTime = document.getElementById('freightEndDate').value;
            
            if (!startTime || !endTime) {
                alert('请填写查询时间范围');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/reports/freight-activity/export`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startTime, endTime })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(`✅ 导出任务已创建！\n\n任务ID: ${result.data.id}\n\n请点击"📋 导出任务"按钮查看进度和下载文件。`);
                } else {
                    if (result.error && result.error.includes('超出')) {
                        alert(`⚠️ ${result.error}`);
                    } else {
                        alert('导出失败: ' + result.error);
                    }
                }
            } catch (error) {
                console.error('导出失败:', error);
                alert('导出失败: ' + error.message);
            }
        }
        
        // 清空免运活动筛选
        function clearFreightFilters() {
            const today = new Date();
            const t1 = new Date(today);
            t1.setDate(t1.getDate() - 1);
            const t7 = new Date(today);
            t7.setDate(t7.getDate() - 7);
            
            document.getElementById('freightStartDate').value = t7.toISOString().split('T')[0];
            document.getElementById('freightEndDate').value = t1.toISOString().split('T')[0];
            
            freightData = [];
            freightCurrentPage = 1;
            freightTotalRecords = 0;
            document.getElementById('freightBody').innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">请设置筛选条件后点击查询</td></tr>';
            document.getElementById('freightPageInfo').textContent = '--';
            document.getElementById('freightTotalCount').textContent = '--';
            document.getElementById('freightPrevPage').disabled = true;
            document.getElementById('freightNextPage').disabled = true;
        }
        
        // ========== 社群拉新报表 ==========
        let invitationData = [];
        let invitationCurrentPage = 1;
        const invitationPageSize = 20;
        let invitationTotalRecords = 0;
        
        function initInvitationDates() {
            const today = new Date();
            const t1 = new Date(today);
            t1.setDate(t1.getDate() - 1);
            const t7 = new Date(today);
            t7.setDate(t7.getDate() - 7);
            
            if (!document.getElementById('invitationStartDate').value) {
                document.getElementById('invitationStartDate').value = t7.toISOString().split('T')[0];
            }
            if (!document.getElementById('invitationEndDate').value) {
                document.getElementById('invitationEndDate').value = t1.toISOString().split('T')[0];
            }
        }
        
        async function loadInvitationData() {
            const startTime = document.getElementById('invitationStartDate').value;
            const endTime = document.getElementById('invitationEndDate').value;
            const activityIds = document.getElementById('invitationActivityIds').value;
            
            if (!startTime || !endTime) {
                alert('请填写查询时间范围');
                return;
            }
            
            document.getElementById('invitationLoading').style.display = 'block';
            document.getElementById('invitationBody').innerHTML = '';
            
            try {
                const response = await fetch(`${API_BASE_URL}/reports/invitation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        startTime,
                        endTime,
                        activityIds,
                        page: invitationCurrentPage,
                        pageSize: invitationPageSize
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    invitationData = result.data.items || [];
                    invitationTotalRecords = result.data.total || 0;
                    document.getElementById('invitationTotalCount').textContent = invitationTotalRecords;
                    document.getElementById('invitationExecTime').textContent = result.executionTime || '--';
                    renderInvitationTable(invitationData);
                    updateInvitationPagination();
                } else {
                    alert('查询失败：' + result.error);
                }
            } catch (error) {
                console.error('查询失败:', error);
                alert('查询失败: ' + error.message);
            } finally {
                document.getElementById('invitationLoading').style.display = 'none';
            }
        }
        
        function renderInvitationTable(items) {
            const tbody = document.getElementById('invitationBody');
            tbody.innerHTML = '';
            
            if (!items || items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px; color: #999;">暂无数据</td></tr>';
                return;
            }
            
            items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.活动ID || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.活动名称 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.发起ID || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.发起用户ID || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.用户手机 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.助力用户ID || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.助力用户手机 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.助力时间 ? formatDate(item.助力时间) : '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.更新时间 ? formatDate(item.更新时间) : '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.状态 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.失败原因 || '-'}</td>
                `;
                tbody.appendChild(row);
            });
        }
        
        function updateInvitationPagination() {
            const start = (invitationCurrentPage - 1) * invitationPageSize + 1;
            const end = Math.min(invitationCurrentPage * invitationPageSize, invitationTotalRecords);
            
            document.getElementById('invitationPageInfo').textContent = invitationTotalRecords > 0 ? `${start}-${end} / ${invitationTotalRecords}` : '--';
            document.getElementById('invitationPrevPage').disabled = invitationCurrentPage <= 1;
            document.getElementById('invitationNextPage').disabled = invitationCurrentPage * invitationPageSize >= invitationTotalRecords;
        }
        
        function changeInvitationPage(direction) {
            invitationCurrentPage += direction;
            loadInvitationData();
        }
        
        async function exportInvitationData() {
            const startTime = document.getElementById('invitationStartDate').value;
            const endTime = document.getElementById('invitationEndDate').value;
            const activityIds = document.getElementById('invitationActivityIds').value;
            
            if (!startTime || !endTime) {
                alert('请填写查询时间范围');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/reports/invitation/export`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startTime, endTime, activityIds })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(`✅ 导出任务已创建！\n\n任务ID: ${result.data.id}\n\n请点击"📋 导出任务"按钮查看进度和下载文件。`);
                } else {
                    if (result.error && result.error.includes('超出')) {
                        alert(`⚠️ ${result.error}`);
                    } else {
                        alert('导出失败: ' + result.error);
                    }
                }
            } catch (error) {
                console.error('导出失败:', error);
                alert('导出失败: ' + error.message);
            }
        }
        
        function clearInvitationFilters() {
            const today = new Date();
            const t1 = new Date(today);
            t1.setDate(t1.getDate() - 1);
            const t7 = new Date(today);
            t7.setDate(t7.getDate() - 7);
            
            document.getElementById('invitationStartDate').value = t7.toISOString().split('T')[0];
            document.getElementById('invitationEndDate').value = t1.toISOString().split('T')[0];
            document.getElementById('invitationActivityIds').value = '';
            
            invitationData = [];
            invitationCurrentPage = 1;
            invitationTotalRecords = 0;
            document.getElementById('invitationBody').innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px; color: #999;">请设置筛选条件后点击查询</td></tr>';
            document.getElementById('invitationPageInfo').textContent = '--';
            document.getElementById('invitationTotalCount').textContent = '--';
            document.getElementById('invitationExecTime').textContent = '--';
            document.getElementById('invitationPrevPage').disabled = true;
            document.getElementById('invitationNextPage').disabled = true;
        }
        
        // 初始化商品渗透率、优惠券和免运活动报表事件
        function initOtherReports() {
            // 初始化所有输入框的清空icon状态
            initClearIcons();
            
            document.getElementById('penSearchBtn').addEventListener('click', loadPenetrationData);
            document.getElementById('penExportBtn').addEventListener('click', exportPenetrationData);
            document.getElementById('penViewExportsBtn').addEventListener('click', openExportModal);
            document.getElementById('penClearBtn').addEventListener('click', clearPenetrationFilters);
            document.getElementById('penPrevPage').addEventListener('click', () => changePenPage(-1));
            document.getElementById('penNextPage').addEventListener('click', () => changePenPage(1));
            
            // 优惠券报表事件
            document.getElementById('couponSearchBtn').addEventListener('click', function() {
                couponCurrentPage = 1;
                loadCouponData();
            });
            document.getElementById('couponExportBtn').addEventListener('click', exportCouponData);
            document.getElementById('couponViewExportsBtn').addEventListener('click', openExportModal);
            document.getElementById('couponClearBtn').addEventListener('click', clearCouponFilters);
            document.getElementById('couponPrevPage').addEventListener('click', () => changeCouponPage(-1));
            document.getElementById('couponNextPage').addEventListener('click', () => changeCouponPage(1));
            
            // 免运活动报表事件
            document.getElementById('freightSearchBtn').addEventListener('click', function() {
                freightCurrentPage = 1;
                loadFreightData();
            });
            document.getElementById('freightExportBtn').addEventListener('click', exportFreightData);
            document.getElementById('freightViewExportsBtn').addEventListener('click', openExportModal);
            document.getElementById('freightClearBtn').addEventListener('click', clearFreightFilters);
            document.getElementById('freightPrevPage').addEventListener('click', () => changeFreightPage(-1));
            document.getElementById('freightNextPage').addEventListener('click', () => changeFreightPage(1));
            
            // 社群拉新报表事件
            document.getElementById('invitationSearchBtn').addEventListener('click', function() {
                invitationCurrentPage = 1;
                loadInvitationData();
            });
            document.getElementById('invitationExportBtn').addEventListener('click', exportInvitationData);
            document.getElementById('invitationViewExportsBtn').addEventListener('click', openExportModal);
            document.getElementById('invitationClearBtn').addEventListener('click', clearInvitationFilters);
            document.getElementById('invitationPrevPage').addEventListener('click', () => changeInvitationPage(-1));
            document.getElementById('invitationNextPage').addEventListener('click', () => changeInvitationPage(1));
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initOtherReports();
            });
        } else {
            initOtherReports();
        }

        // ========== 商城用户下单查询 ===========
        const mallUserSearchBtn = document.getElementById('mallUserSearchBtn');
        const mallUserExportBtn = document.getElementById('mallUserExportBtn');
        const mallUserViewExportsBtn = document.getElementById('mallUserViewExportsBtn');
        const mallUserClearBtn = document.getElementById('mallUserClearBtn');
        const mallUserPrevPage = document.getElementById('mallUserPrevPage');
        const mallUserNextPage = document.getElementById('mallUserNextPage');
        const mallUserBody = document.getElementById('mallUserBody');
        const mallUserLoading = document.getElementById('mallUserLoading');
        const mallUserTotalCount = document.getElementById('mallUserTotalCount');
        const mallUserPageInfo = document.getElementById('mallUserPageInfo');
        const mallUserDate = document.getElementById('mallUserDate');
        const mallUserMobile = document.getElementById('mallUserMobile');
        
        let mallUserData = [];
        let mallUserTotalRecords = 0;
        let mallUserCurrentPage = 1;
        const mallUserPageSize = 20;
        
        // 初始化日期为昨天
        function initMallUserDate() {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            mallUserDate.value = yesterday.toISOString().split('T')[0];
        }
        initMallUserDate();
        
        // 查询商城用户下单
        mallUserSearchBtn.addEventListener('click', async function() {
            mallUserLoading.style.display = 'block';
            
            try {
                const response = await fetch(`${API_BASE_URL}/reports/mall-user`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        queryDate: mallUserDate.value,
                        mobile: mallUserMobile.value,
                        page: mallUserCurrentPage,
                        pageSize: mallUserPageSize
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    mallUserData = result.data.list || [];
                    mallUserTotalRecords = result.data.total || 0;
                    mallUserCurrentPage = 1;
                    mallUserTotalCount.textContent = mallUserTotalRecords;
                    renderMallUserTable();
                    updateMallUserPagination();
                } else {
                    alert('查询失败：' + result.error);
                }
            } catch (error) {
                console.error('查询失败:', error);
                alert('查询失败：' + error.message);
            } finally {
                mallUserLoading.style.display = 'none';
            }
        });
        
        // 渲染表格
        function renderMallUserTable() {
            if (!mallUserData || mallUserData.length === 0) {
                mallUserBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 40px; color: #999;">暂无数据</td></tr>';
                return;
            }
            
            mallUserBody.innerHTML = mallUserData.map(item => `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${item.手机号 || '-'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${formatDate(item.最近下单时间)}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${formatDate(item.鲸选商城最近下单时间)}</td>
                </tr>
            `).join('');
        }
        
        // 更新分页
        function updateMallUserPagination() {
            const start = (mallUserCurrentPage - 1) * mallUserPageSize + 1;
            const end = Math.min(mallUserCurrentPage * mallUserPageSize, mallUserTotalRecords);
            mallUserPageInfo.textContent = `${start}-${end} / ${mallUserTotalRecords}`;
            mallUserPrevPage.disabled = mallUserCurrentPage <= 1;
            mallUserNextPage.disabled = mallUserCurrentPage * mallUserPageSize >= mallUserTotalRecords;
        }
        
        // 上一页
        mallUserPrevPage.addEventListener('click', function() {
            if (mallUserCurrentPage > 1) {
                mallUserCurrentPage--;
                updateMallUserPagination();
                renderMallUserTable();
            }
        });
        
        // 下一页
        mallUserNextPage.addEventListener('click', function() {
            if (mallUserCurrentPage * mallUserPageSize < mallUserTotalRecords) {
                mallUserCurrentPage++;
                updateMallUserPagination();
                renderMallUserTable();
            }
        });
        
        // 清空筛选
        mallUserClearBtn.addEventListener('click', function() {
            mallUserDate.value = '';
            mallUserMobile.value = '';
            initMallUserDate();
            mallUserData = [];
            mallUserTotalRecords = 0;
            mallUserTotalCount.textContent = '--';
            mallUserBody.innerHTML = '';
            mallUserPageInfo.textContent = '--';
        });
        
        // 导出查询结果
        mallUserExportBtn.addEventListener('click', async function() {
            mallUserLoading.style.display = 'block';
            
            try {
                const response = await fetch(`${API_BASE_URL}/reports/mall-user/export`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        queryDate: mallUserDate.value,
                        mobile: mallUserMobile.value
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(`✅ 导出任务已创建！\n\n任务 ID: ${result.data.id}\n\n请点击"📋 导出任务"按钮查看进度和下载文件。`);
                } else {
                    alert('导出失败：' + result.error);
                }
            } catch (error) {
                console.error('导出失败:', error);
                alert('导出失败：' + error.message);
            } finally {
                mallUserLoading.style.display = 'none';
            }
        });
        
        // 查看导出任务
        mallUserViewExportsBtn.addEventListener('click', function() {
            document.getElementById('exportTasksModal').style.display = 'block';
            loadExportTasks();
        });
        

