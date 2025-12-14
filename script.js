document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dreamInput = document.getElementById('dream-input');
    const saveBtn = document.getElementById('save-btn');
    const entriesList = document.getElementById('entries-list');
    const fabAdd = document.getElementById('fab-add');
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');
    
    // New Form Elements
    const moodSelector = document.getElementById('mood-selector');
    const moodTags = document.querySelectorAll('.mood-tag');
    let selectedMood = '';

    // Modal Elements
    const modalNewEntry = document.getElementById('modal-new-entry');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // Detail Modal Elements
    const modalDetail = document.getElementById('modal-entry-detail');
    const closeDetailBtn = document.getElementById('close-detail-btn');
    const detailDate = document.getElementById('detail-date');
    const detailMood = document.getElementById('detail-mood');
    const detailType = document.getElementById('detail-type');
    const detailText = document.getElementById('detail-text');

    // Settings & Privacy Elements
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const btnPrivacyLock = document.getElementById('btn-privacy-lock');
    const privacyStatusLabel = document.getElementById('privacy-status');
    const btnExport = document.getElementById('btn-export-data');
    const btnImport = document.getElementById('btn-import-data');
    const importInput = document.getElementById('import-file-input');
    const btnClear = document.getElementById('btn-clear-data');
    
    // Privacy Modal Elements
    const modalPrivacy = document.getElementById('modal-privacy');
    const closePrivacyBtn = document.getElementById('close-privacy-btn');
    const privacyTitle = document.getElementById('privacy-modal-title');
    const privacyTip = document.getElementById('privacy-tip');
    const pinDots = document.querySelectorAll('.pin-dot');
    const numBtns = document.querySelectorAll('.num-btn');
    const btnDeletePin = document.getElementById('btn-delete-pin');

    // State
    let pinState = {
        mode: 'idle', // idle, verify_start, verify_setting, set_new_1, set_new_2, disable_verify
        tempPin: '',
        currentInput: ''
    };
    
    // Filter State
    let currentFilter = {
        type: null // null (all) or 'dream', 'diary', 'os'
    };

    // Filter Bar Elements
    const filterBar = document.getElementById('filter-bar');
    const filterInfo = document.getElementById('filter-info');
    const clearFilterBtn = document.getElementById('clear-filter-btn');
    
    // 初始化应用
    function initApp() {
        // 1. 加载夜间模式
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            darkModeToggle.checked = true;
        }

        // 2. 检查隐私锁
        const savedPin = localStorage.getItem('app-pin');
        if (savedPin) {
            privacyStatusLabel.textContent = '已开启';
            // 启动时验证
            startPinVerify('start');
        } else {
            privacyStatusLabel.textContent = '未开启';
            loadEntries(); // 没锁直接加载
        }
    }

    // Detail Modal Logic
    function openEntryDetail(entry) {
        detailDate.textContent = entry.date;
        detailText.textContent = entry.text;
        
        // 设置情绪标签
        if (entry.mood) {
            detailMood.textContent = getMoodEmoji(entry.mood) + ' ' + getMoodLabel(entry.mood);
            detailMood.style.display = 'inline-flex';
        } else {
            detailMood.style.display = 'none';
        }
        
        // 设置类型标签
        detailType.textContent = getTypeLabel(entry.type);
        
        modalDetail.classList.add('active');
    }

    function closeDetailModal() {
        modalDetail.classList.remove('active');
    }

    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeDetailModal);
    }

    // 点击遮罩层关闭详情
    modalDetail.addEventListener('click', (e) => {
        if (e.target === modalDetail) {
            closeDetailModal();
        }
    });

    // 路由/视图切换逻辑
    function switchView(targetId) {
        // 更新视图显示
        views.forEach(view => {
            if (view.id === targetId) {
                view.style.display = 'block';
                // 触发淡入动画
                view.style.animation = 'none';
                view.offsetHeight; /* trigger reflow */
                view.style.animation = 'fadeIn 0.4s ease-out';
                
                // 如果是统计页面，重新计算并渲染
                if (targetId === 'view-stats') {
                    renderStats();
                }

            } else {
                view.style.display = 'none';
            }
        });

        // 更新导航状态
        navItems.forEach(item => {
            if (item.dataset.target === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 仅在首页显示 FAB
        if (targetId === 'view-home') {
            fabAdd.style.display = 'flex';
            loadEntries(); // 切换回首页时刷新列表
        } else {
            fabAdd.style.display = 'none';
        }
    }

    // 模态框控制逻辑
    function openModal() {
        modalNewEntry.classList.add('active');
        // 重置表单
        resetForm();
    }

    function closeModal() {
        modalNewEntry.classList.remove('active');
        dreamInput.blur();
    }

    function resetForm() {
        dreamInput.value = '';
        selectedMood = '';
        moodTags.forEach(tag => tag.classList.remove('selected'));
        document.querySelector('input[name="entry-type"][value="dream"]').checked = true;
    }

    // 情绪选择逻辑
    moodTags.forEach(tag => {
        tag.addEventListener('click', () => {
            // 单选逻辑
            moodTags.forEach(t => t.classList.remove('selected'));
            tag.classList.add('selected');
            selectedMood = tag.dataset.mood;
        });
    });

    // 导航点击事件
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.dataset.target;
            if (targetId) { // 确保有 target
                switchView(targetId);
            }
        });
    });

    // FAB 点击事件 -> 打开模态框
    fabAdd.addEventListener('click', () => {
        openModal();
    });

    // 关闭模态框事件
    closeModalBtn.addEventListener('click', closeModal);
    
    // 点击遮罩层关闭
    modalNewEntry.addEventListener('click', (e) => {
        if (e.target === modalNewEntry) {
            closeModal();
        }
    });

    // 保存梦境逻辑
    saveBtn.addEventListener('click', () => {
        const text = dreamInput.value.trim();
        const type = document.querySelector('input[name="entry-type"]:checked').value;
        
        if (text) {
            const entry = {
                id: Date.now(),
                text: text,
                type: type,
                mood: selectedMood,
                date: new Date().toLocaleString('zh-CN', { hour12: false })
            };
            saveEntry(entry);
            closeModal(); // 关闭弹窗
            loadEntries(); // 刷新列表
            
            // 可选：添加震动反馈 (如果设备支持)
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } else {
            // 轻微摇晃输入框提示
            dreamInput.style.transform = 'translateX(5px)';
            setTimeout(() => dreamInput.style.transform = 'translateX(0)', 100);
            setTimeout(() => dreamInput.style.transform = 'translateX(-5px)', 200);
            setTimeout(() => dreamInput.style.transform = 'translateX(0)', 300);
        }
    });

    function saveEntry(entry) {
        try {
            let entries = JSON.parse(localStorage.getItem('dream-entries') || '[]');
            if (!Array.isArray(entries)) {
                entries = [];
            }
            entries.unshift(entry);
            localStorage.setItem('dream-entries', JSON.stringify(entries));
        } catch (e) {
            console.error('Failed to save entry:', e);
            alert('保存失败，请检查存储空间或重试。');
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getMoodEmoji(mood) {
        const moodMap = {
            'happy': '😊', 'calm': '😌', 'sad': '😢', 
            'anxious': '😰', 'excited': '🤩', 'confused': '😵', 'scared': '😱'
        };
        return moodMap[mood] || '';
    }

    function getMoodLabel(mood) {
        const moodMap = {
            'happy': '开心', 'calm': '平静', 'sad': '难过', 
            'anxious': '焦虑', 'excited': '兴奋', 'confused': '困惑', 'scared': '恐惧'
        };
        return moodMap[mood] || '未知';
    }

    function getTypeLabel(type) {
        const typeMap = {
            'dream': '🌙 梦境',
            'diary': '📖 日记',
            'os': '💭 内心OS'
        };
        return typeMap[type] || '📝 记录';
    }

    function loadEntries() {
        try {
            let entries = JSON.parse(localStorage.getItem('dream-entries') || '[]');
            
            // 应用筛选
            if (currentFilter.type) {
                entries = entries.filter(e => e.type === currentFilter.type);
                
                // 更新筛选条 UI
                filterBar.classList.remove('hidden');
                const typeName = getTypeLabel(currentFilter.type).split(' ')[1];
                filterInfo.textContent = `正在查看: ${typeName}`;
            } else {
                filterBar.classList.add('hidden');
            }

            if (entries.length === 0) {
                if (currentFilter.type) {
                     entriesList.innerHTML = '<div class="empty-state">该分类下暂无记录</div>';
                } else {
                     entriesList.innerHTML = '<div class="empty-state">还没有记录，点击右下角“+”号开始记录你的第一个梦境吧！</div>';
                }
                return;
            }
            
            entriesList.innerHTML = entries.map(entry => {
                const moodEmoji = getMoodEmoji(entry.mood);
                const typeLabel = getTypeLabel(entry.type);
                
                // 兼容旧数据
                const text = entry.text || '';
                const date = entry.date || '';
                
                // 处理长文本预览 (例如只显示前 80 个字符)
                // 先转义，再截断可能会截断转义字符，所以先截断再转义 (但这不安全，因为截断可能正好在 tag 中间)
                // 正确做法：先转义，然后作为纯文本显示。这里我们把 text 视为纯文本。
                const safeText = escapeHtml(text);
                const previewText = safeText.length > 80 ? safeText.substring(0, 80) + '...' : safeText;
                
                return `
                <div class="dream-entry" data-mood="${entry.mood || ''}">
                    <button class="delete-entry-btn" data-id="${entry.id}" aria-label="删除">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                    <div class="dream-entry-header">
                        <div class="header-left">
                            <span class="date">${date}</span>
                        </div>
                        <div class="meta-tags">
                            <span class="meta-tag">${typeLabel}</span>
                            ${moodEmoji ? `<span class="meta-tag">${moodEmoji}</span>` : ''}
                        </div>
                    </div>
                    <p class="entry-preview">${previewText}</p>
                </div>
                `;
            }).join('');
            
            // 绑定删除事件
            document.querySelectorAll('.delete-entry-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 防止触发卡片点击（如果有）
                    const id = btn.dataset.id;
                    deleteEntry(id);
                });
            });

            // 绑定详情点击事件
            document.querySelectorAll('.dream-entry').forEach((card, index) => {
                card.addEventListener('click', () => {
                    openEntryDetail(entries[index]);
                });
            });

        } catch (e) {
            console.error('Failed to load entries:', e);
            entriesList.innerHTML = '<div class="empty-state">加载记录失败，请清除缓存重试。</div>';
        }
    }

    // 删除逻辑
    function deleteEntry(id) {
        if (confirm('确定要遗忘这段梦境吗？\n删除后将无法找回。')) {
            try {
                let entries = JSON.parse(localStorage.getItem('dream-entries') || '[]');
                // 过滤掉该 id
                entries = entries.filter(e => e.id.toString() !== id.toString());
                localStorage.setItem('dream-entries', JSON.stringify(entries));
                
                // 重新加载 (或者可以做更精细的 DOM 删除动画)
                loadEntries();
                renderStats(); // 更新统计
                
                if (navigator.vibrate) navigator.vibrate(50);
            } catch (e) {
                console.error('Delete failed:', e);
                alert('删除失败，请重试');
            }
        }
    }

    // 统计功能逻辑
    function renderStats() {
        const entries = JSON.parse(localStorage.getItem('dream-entries') || '[]');
        
        // 1. 核心指标
        document.getElementById('stat-total').textContent = entries.length;
        document.getElementById('stat-dreams').textContent = entries.filter(e => e.type === 'dream').length;
        document.getElementById('stat-streak').textContent = calculateStreak(entries);

        // 2. 情绪分布
        renderMoodChart(entries);

        // 3. 类型分布
        renderTypeChart(entries);
    }

    function calculateStreak(entries) {
        if (!entries || entries.length === 0) return 0;
        
        // 获取所有日期的去重集合 (YYYY-MM-DD)
        const dates = new Set(entries.map(e => {
            // 尝试解析日期，兼容 '2023/5/20 12:00:00' 或 timestamp
            try {
                // 如果 id 是时间戳，优先使用 id (更准确)
                const dateObj = new Date(parseInt(e.id)); 
                return dateObj.toDateString(); 
            } catch(err) {
                return new Date().toDateString();
            }
        }));

        let streak = 0;
        const today = new Date();
        
        // 简单计算：从今天开始往前倒推
        // 注意：真实场景需要更严谨的日期处理库
        for (let i = 0; i < 365; i++) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            if (dates.has(d.toDateString())) {
                streak++;
            } else if (i === 0 && !dates.has(d.toDateString())) {
                // 如果今天没记，看昨天
                continue;
            } else {
                break;
            }
        }
        return streak;
    }

    function renderMoodChart(entries) {
        const container = document.getElementById('mood-chart');
        const moodCounts = {};
        let totalMoods = 0;

        entries.forEach(e => {
            if (e.mood) {
                moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
                totalMoods++;
            }
        });

        if (totalMoods === 0) {
            container.innerHTML = '<div class="empty-chart">暂无情绪数据</div>';
            return;
        }

        // 排序并取前 8 (泡泡图可以多放一点)
        const sortedMoods = Object.entries(moodCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
        
        // 计算最大值，用于归一化气泡大小
        const maxCount = sortedMoods[0][1];
        
        container.innerHTML = sortedMoods.map(([mood, count], index) => {
            // 基础大小 60px，根据频率增加，最大增加到 100px
            const size = 60 + (count / maxCount) * 40; 
            // 延迟动画
            const delay = index * 0.1;
            
            return `
            <div class="mood-bubble bubble-${mood}" 
                 style="width: ${size}px; height: ${size}px; animation-delay: ${delay}s"
                 title="${getMoodLabel(mood)}: ${count}次">
                <span class="emoji">${getMoodEmoji(mood)}</span>
                <span class="count">${count}</span>
            </div>
            `;
        }).join('');
    }

    function renderTypeChart(entries) {
        const container = document.getElementById('type-chart');
        const typeCounts = {
            'dream': 0,
            'diary': 0,
            'os': 0
        };
        let total = 0;

        entries.forEach(e => {
            if (typeCounts[e.type] !== undefined) {
                typeCounts[e.type]++;
                total++;
            }
        });

        if (total === 0) {
            container.innerHTML = '<div class="empty-chart">暂无数据</div>';
            return;
        }

        const colors = {
            'dream': '#9b9ece', // primary
            'diary': '#ffb7b2', // accent
            'os': '#a18cd1'     // calm
        };

        container.innerHTML = Object.entries(typeCounts).map(([type, count]) => {
            const percent = Math.round((count / total) * 100);
            const color = colors[type];
            // Conic gradient: color 0% -> percent%, transparent percent% -> 100%
            // In CSS conic-gradient, we usually do: color 0deg, color Xdeg, transparent Xdeg
            
            return `
            <div class="type-ring-item" onclick="applyFilter('${type}')">
                <div class="ring-chart" style="background: conic-gradient(${color} 0% ${percent}%, #f0f2f7 ${percent}% 100%);">
                    <div class="ring-inner">
                        <span class="ring-count">${count}</span>
                        <span class="ring-percent">${percent}%</span>
                    </div>
                </div>
                <span class="ring-label">${getTypeLabel(type).split(' ')[1]}</span>
            </div>
            `;
        }).join('');
    }

    // Expose applyFilter to global scope so onclick works
    window.applyFilter = function(type) {
        currentFilter.type = type;
        
        // Switch to home view
        switchView('view-home');
        
        // Ideally switchView handles tab active state, but we need to ensure data is reloaded
        // switchView calls loadEntries() if target is view-home
    };

    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', () => {
            currentFilter.type = null;
            loadEntries();
        });
    }

    // 初始化：默认加载列表
    // loadEntries(); // Moved to initApp
    initApp();

    // Settings Event Listeners
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    if (btnExport) {
        btnExport.addEventListener('click', exportData);
    }

    if (btnImport) {
        btnImport.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', importData);
    }

    if (btnClear) {
        btnClear.addEventListener('click', clearAllData);
    }

    if (btnPrivacyLock) {
        btnPrivacyLock.addEventListener('click', () => {
            const hasPin = localStorage.getItem('app-pin');
            if (hasPin) {
                // 如果已有 PIN，进入验证流程以关闭
                startPinVerify('disable');
            } else {
                // 如果没有 PIN，进入设置流程
                startPinVerify('set');
            }
        });
    }

    // Privacy Modal Logic
    if (closePrivacyBtn) {
        closePrivacyBtn.addEventListener('click', () => {
            // 如果是启动验证，不允许关闭 (或者关闭就是退出? web 无法退出)
            // 这里简单处理：如果是 start 模式，不让关，或者关了显示空白
            if (pinState.mode === 'verify_start') return;
            closePrivacyModal();
        });
    }

    numBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const num = btn.dataset.num;
            if (num !== undefined) {
                handlePinInput(num);
            }
        });
    });
    
    if (btnDeletePin) {
        btnDeletePin.addEventListener('click', () => {
            if (pinState.currentInput.length > 0) {
                pinState.currentInput = pinState.currentInput.slice(0, -1);
                updatePinDisplay();
            }
        });
    }

    // Functions for Settings
    function exportData() {
        const data = localStorage.getItem('dream-entries');
        if (!data) {
            alert('没有数据可导出');
            return;
        }
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dream-journal-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (Array.isArray(data)) {
                    if (confirm(`准备导入 ${data.length} 条记录，這将覆盖现有记录吗？\n点击“确定”覆盖，点击“取消”追加。`)) {
                         // 覆盖
                         localStorage.setItem('dream-entries', JSON.stringify(data));
                    } else {
                        // 追加 (去重 id)
                        const current = JSON.parse(localStorage.getItem('dream-entries') || '[]');
                        const currentIds = new Set(current.map(c => c.id));
                        const newEntries = data.filter(d => !currentIds.has(d.id));
                        const merged = [...newEntries, ...current].sort((a,b) => b.id - a.id);
                        localStorage.setItem('dream-entries', JSON.stringify(merged));
                        alert(`已追加 ${newEntries.length} 条新记录`);
                    }
                    loadEntries();
                    renderStats(); // 刷新统计
                    alert('导入成功！');
                } else {
                    alert('文件格式错误：必须是 JSON 数组');
                }
            } catch (err) {
                console.error(err);
                alert('导入失败：文件损坏或格式错误');
            }
            // Reset input
            importInput.value = '';
        };
        reader.readAsText(file);
    }

    function clearAllData() {
        if (confirm('确定要删除所有日记记录吗？此操作无法撤销！')) {
            // 二次确认
            if (confirm('再次确认：真的要清空所有数据吗？')) {
                localStorage.removeItem('dream-entries');
                loadEntries();
                renderStats();
                alert('数据已清空');
            }
        }
    }

    // Privacy Functions
    function startPinVerify(mode) {
        pinState.currentInput = '';
        pinState.tempPin = '';
        updatePinDisplay();
        modalPrivacy.classList.add('active');

        if (mode === 'start') {
            pinState.mode = 'verify_start';
            privacyTitle.textContent = '欢迎回来';
            privacyTip.textContent = '请输入隐私密码解锁';
            closePrivacyBtn.style.display = 'none'; // 强制输入
        } else if (mode === 'set') {
            pinState.mode = 'set_new_1';
            privacyTitle.textContent = '设置密码';
            privacyTip.textContent = '请输入4位新密码';
            closePrivacyBtn.style.display = 'flex';
        } else if (mode === 'disable') {
            pinState.mode = 'disable_verify';
            privacyTitle.textContent = '关闭隐私锁';
            privacyTip.textContent = '请输入当前密码以验证';
            closePrivacyBtn.style.display = 'flex';
        }
    }

    function closePrivacyModal() {
        modalPrivacy.classList.remove('active');
        pinState.mode = 'idle';
        pinState.currentInput = '';
    }

    function handlePinInput(num) {
        if (pinState.currentInput.length < 4) {
            pinState.currentInput += num;
            updatePinDisplay();
            
            if (pinState.currentInput.length === 4) {
                // Delay slightly to show the last dot
                setTimeout(() => processPinLogic(), 100);
            }
        }
    }

    function updatePinDisplay() {
        const len = pinState.currentInput.length;
        pinDots.forEach((dot, index) => {
            if (index < len) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
            dot.classList.remove('error');
        });
    }

    function showPinError() {
        pinDots.forEach(dot => dot.classList.add('error'));
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        setTimeout(() => {
            pinState.currentInput = '';
            updatePinDisplay();
        }, 400);
    }

    function processPinLogic() {
        const input = pinState.currentInput;
        const savedPin = localStorage.getItem('app-pin');

        if (pinState.mode === 'verify_start') {
            if (input === savedPin) {
                closePrivacyModal();
                loadEntries(); // 解锁成功，加载数据
            } else {
                showPinError();
            }
        } else if (pinState.mode === 'disable_verify') {
            if (input === savedPin) {
                localStorage.removeItem('app-pin');
                privacyStatusLabel.textContent = '未开启';
                closePrivacyModal();
                alert('隐私锁已关闭');
            } else {
                showPinError();
            }
        } else if (pinState.mode === 'set_new_1') {
            pinState.tempPin = input;
            pinState.currentInput = '';
            updatePinDisplay();
            pinState.mode = 'set_new_2';
            privacyTip.textContent = '请再次输入确认';
        } else if (pinState.mode === 'set_new_2') {
            if (input === pinState.tempPin) {
                localStorage.setItem('app-pin', input);
                privacyStatusLabel.textContent = '已开启';
                closePrivacyModal();
                alert('隐私锁设置成功！');
            } else {
                privacyTip.textContent = '两次输入不一致，请重试';
                showPinError();
                pinState.mode = 'set_new_1'; // Reset to first step
                pinState.tempPin = '';
            }
        }
    }

    // 注册 Service Worker (保持不变)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }
});
