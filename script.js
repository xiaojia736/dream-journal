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
    const privacySlider = document.getElementById('privacy-level');
    const privacyLabel = document.getElementById('privacy-label');
    const moodTags = document.querySelectorAll('.mood-tag');
    let selectedMood = '';

    // Modal Elements
    const modalNewEntry = document.getElementById('modal-new-entry');
    const closeModalBtn = document.getElementById('close-modal-btn');

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
        privacySlider.value = 1;
        updatePrivacyLabel(1);
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

    // 私密等级滑块逻辑
    privacySlider.addEventListener('input', (e) => {
        updatePrivacyLabel(e.target.value);
    });

    function updatePrivacyLabel(value) {
        const labels = { '1': '公开', '2': '仅好友', '3': '私密' };
        privacyLabel.textContent = labels[value];
    }

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
        const privacy = privacySlider.value; // 1, 2, or 3
        
        if (text) {
            const entry = {
                id: Date.now(),
                text: text,
                type: type,
                mood: selectedMood,
                privacy: privacy,
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
        let entries = JSON.parse(localStorage.getItem('dream-entries') || '[]');
        entries.unshift(entry);
        localStorage.setItem('dream-entries', JSON.stringify(entries));
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

    function getPrivacyIcon(level) {
        const icons = {
            '1': '🌍', // 公开
            '2': '👥', // 好友
            '3': '🔒'  // 私密
        };
        return icons[level] || '🌍';
    }

    function loadEntries() {
        try {
            const entries = JSON.parse(localStorage.getItem('dream-entries') || '[]');
            if (entries.length === 0) {
                entriesList.innerHTML = '<div class="empty-state">还没有记录，点击右下角“+”号开始记录你的第一个梦境吧！</div>';
                return;
            }
            
            entriesList.innerHTML = entries.map(entry => {
                const moodEmoji = getMoodEmoji(entry.mood);
                const typeLabel = getTypeLabel(entry.type);
                const privacyIcon = getPrivacyIcon(entry.privacy);
                
                // 兼容旧数据
                const text = entry.text || '';
                const date = entry.date || '';
                
                // 处理长文本预览 (例如只显示前 80 个字符)
                const previewText = text.length > 80 ? text.substring(0, 80) + '...' : text;
                
                return `
                <div class="dream-entry">
                    <div class="dream-entry-header">
                        <div class="header-left">
                            <span class="date">${date}</span>
                            <span class="privacy-icon" title="私密等级">${privacyIcon}</span>
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
        } catch (e) {
            console.error('Failed to load entries:', e);
            entriesList.innerHTML = '<div class="empty-state">加载记录失败，请清除缓存重试。</div>';
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

        // 排序并取前 5
        const sortedMoods = Object.entries(moodCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        container.innerHTML = sortedMoods.map(([mood, count]) => {
            const percent = Math.round((count / totalMoods) * 100);
            return `
            <div class="mood-bar-item">
                <div class="mood-bar-header">
                    <span>${getMoodEmoji(mood)} ${getMoodLabel(mood)}</span>
                    <span>${count}次</span>
                </div>
                <div class="mood-bar-track">
                    <div class="mood-bar-fill" style="width: ${percent}%; background-color: var(--primary-color);"></div>
                </div>
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

        entries.forEach(e => {
            if (typeCounts[e.type] !== undefined) {
                typeCounts[e.type]++;
            }
        });

        if (entries.length === 0) {
            container.innerHTML = '<div class="empty-chart">暂无数据</div>';
            return;
        }

        container.innerHTML = Object.entries(typeCounts).map(([type, count]) => {
            return `
            <div class="type-stat-item">
                <div class="type-circle">
                    ${count}
                </div>
                <span class="type-label">${getTypeLabel(type).split(' ')[1]}</span>
            </div>
            `;
        }).join('');
    }

    // 初始化：默认加载列表
    loadEntries();

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
