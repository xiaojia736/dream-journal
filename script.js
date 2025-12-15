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
    
    // Tag System Elements
    const tagInput = document.getElementById('tag-input');
    const addTagBtn = document.getElementById('add-tag-btn');
    const tagsContainer = document.getElementById('tags-container');
    let currentTags = [];

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
        type: null, // null (all) or 'dream', 'diary', 'os'
        tag: null   // NEW: tag filter
    };

    // Filter Bar Elements
    const filterBar = document.getElementById('filter-bar');
    const filterInfo = document.getElementById('filter-info');
    const clearFilterBtn = document.getElementById('clear-filter-btn');
    
    // Search Element
    const searchInput = document.getElementById('search-input');

    // Flashback Element
    const flashbackCard = document.getElementById('flashback-card');

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
            renderFlashback(); // 加载时光胶囊
        }
    }

    // Detail Modal Logic
    function openEntryDetail(entry) {
        detailDate.textContent = entry.date;
        detailText.textContent = entry.text;
        
        // 设置情绪标签
        if (entry.mood) {
            detailMood.innerHTML = getMoodEmoji(entry.mood) + ' <span style="margin-left: 4px;">' + getMoodLabel(entry.mood) + '</span>';
            detailMood.style.display = 'inline-flex';
        } else {
            detailMood.style.display = 'none';
        }
        
        // 设置类型标签
        detailType.textContent = getTypeLabel(entry.type);
        
        // 渲染详情页标签
        const tags = entry.tags || [];
        let tagsContainer = document.getElementById('detail-tags-container');
        if (!tagsContainer) {
            tagsContainer = document.createElement('div');
            tagsContainer.id = 'detail-tags-container';
            tagsContainer.className = 'entry-tags';
            tagsContainer.style.marginTop = '1rem';
            // 插入到 modal-body 的开头或结尾? 放在 meta 下面比较好
            document.querySelector('.detail-meta').after(tagsContainer);
        }
        
        tagsContainer.innerHTML = tags.map(tag => `
            <span class="entry-tag-item" style="cursor: pointer;" onclick="filterByTag('${tag}')">${tag}</span>
        `).join('');
        
        modalDetail.classList.add('active');
    }

    // 通过标签过滤
    window.filterByTag = function(tag) {
        closeDetailModal(); // 关闭弹窗
        currentFilter.tag = tag; // 设置标签筛选
        currentFilter.type = null; // 清除类型筛选，避免冲突
        
        // 切换到首页
        switchView('view-home');
        
        // 加载列表 (会自动读取 currentFilter.tag)
        loadEntries();
        
        // 确保筛选条显示
        filterBar.classList.remove('hidden');
        filterInfo.textContent = `正在查看标签: ${tag}`;
    };

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
        currentTags = [];
        renderTags();
        tagInput.value = '';
        moodTags.forEach(tag => tag.classList.remove('selected'));
        document.querySelector('input[name="entry-type"][value="dream"]').checked = true;
    }

    // Tag System Logic
    if (tagInput) {
        // Keydown: 处理回车键和PC端的空格键
        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag(e.target.value);
            }
            // PC端保留空格键生成习惯，但移动端软键盘可能不触发此事件或无法preventDefault
            if (e.key === ' ') {
                e.preventDefault();
                addTag(e.target.value);
            }
        });

        // Input: 移动端兼容性核心逻辑 - 实时监测输入内容
        tagInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if (!val) return;

            const lastChar = val.slice(-1);
            // 检测分隔符：空格、中文逗号、英文逗号
            if ([' ', '，', ','].includes(lastChar)) {
                // 截取分隔符前面的内容作为标签
                addTag(val.slice(0, -1));
            }
        });
        
        // 兼容中文输入法结束
        tagInput.addEventListener('compositionend', (e) => {
             // 暂不处理，依靠用户按空格或回车确认
        });

        // 移动端/鼠标用户辅助按钮：点击(+)添加标签
        if (addTagBtn) {
            addTagBtn.addEventListener('click', (e) => {
                e.preventDefault();
                addTag(tagInput.value);
                tagInput.focus();
            });
        }
    }

    function addTag(text) {
        const tag = text.trim();
        if (tag && !currentTags.includes(tag)) {
            currentTags.push(tag);
            renderTags();
            tagInput.value = '';
        } else if (tag && currentTags.includes(tag)) {
            tagInput.value = ''; // 重复则清空但不添加
        }
    }

    function removeTag(tag) {
        currentTags = currentTags.filter(t => t !== tag);
        renderTags();
    }

    function renderTags() {
        tagsContainer.innerHTML = currentTags.map(tag => `
            <span class="tag-pill">
                ${tag}
                <span class="tag-remove" onclick="removeTag('${tag}')">×</span>
            </span>
        `).join('');
        
        // 绑定删除事件 (因为 innerHTML 重绘了)
        document.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // removeTag via onclick attribute for simplicity here, 
                // but better to bind via JS if complex. 
                // Since we use onclick string in innerHTML, window scope is needed or...
                // Actually, let's use the event listener approach below instead of onclick in HTML
            });
        });
    }
    
    // Expose removeTag to window for inline onclick to work
    window.removeTag = removeTag;

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

    // 动画：记忆收集效果
    function playMemoryCollectionAnimation(callback) {
        // 1. 获取起点 (弹窗中心)
        const modalRect = modalNewEntry.querySelector('.modal-content').getBoundingClientRect();
        const startX = modalRect.left + modalRect.width / 2;
        const startY = modalRect.top + modalRect.height / 2;

        // 2. 获取终点 (统计图标)
        // 假设统计图标是第二个 nav-item (data-target="view-stats")
        const targetNav = document.querySelector('.nav-item[data-target="view-stats"] .icon');
        if (!targetNav) {
            callback();
            return;
        }
        const targetRect = targetNav.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        // 3. 创建光点
        const particle = document.createElement('div');
        particle.className = 'flying-particle';
        document.body.appendChild(particle);

        // 设置初始位置
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;

        // 4. 执行飞行动画
        const animation = particle.animate([
            {
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 1,
                offset: 0
            },
            {
                transform: 'translate(-50%, -50%) scale(1.5)', // 先稍微变大
                opacity: 1,
                offset: 0.2
            },
            {
                left: `${targetX}px`,
                top: `${targetY}px`,
                transform: 'translate(-50%, -50%) scale(0.2)', // 飞向目标并缩小
                opacity: 0.5,
                offset: 1
            }
        ], {
            duration: 800,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)', // 类似于 ease-out
            fill: 'forwards'
        });

        animation.onfinish = () => {
            // 5. 动画结束：移除光点
            particle.remove();
            
            // 6. 目标反馈
            targetNav.classList.add('icon-bounce');
            setTimeout(() => targetNav.classList.remove('icon-bounce'), 600);
            
            // 执行回调 (关闭弹窗等)
            if (callback) callback();
        };
    }

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
                tags: currentTags, // 保存标签
                date: new Date().toLocaleString('zh-CN', { hour12: false })
            };
            
            saveEntry(entry);
            
            // 播放记忆收集动画，然后再刷新 UI
            playMemoryCollectionAnimation(() => {
                closeModal(); // 关闭弹窗
                loadEntries(); // 刷新列表
                renderStats(); // 确保统计数据也更新
            });
            
            // 可选：添加震动反馈 (如果设备支持)
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } else {
            // ... (错误提示)
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
            'happy': '😊', 
            'calm': '😌', 
            'sad': '😢', 
            'anxious': '😰', 
            'excited': '🤩', 
            'confused': '😵',
            'scared': '😱'
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

    function loadEntries(searchKeyword = '') {
        try {
            let entries = JSON.parse(localStorage.getItem('dream-entries') || '[]');
            
            // 应用筛选 (Type & Tag)
            if (currentFilter.type) {
                entries = entries.filter(e => e.type === currentFilter.type);
                
                // 更新筛选条 UI
                filterBar.classList.remove('hidden');
                const typeName = getTypeLabel(currentFilter.type).split(' ')[1];
                filterInfo.textContent = `正在查看: ${typeName}`;
            } else if (currentFilter.tag) {
                entries = entries.filter(e => (e.tags || []).includes(currentFilter.tag));
                
                // 更新筛选条 UI
                filterBar.classList.remove('hidden');
                filterInfo.textContent = `正在查看标签: ${currentFilter.tag}`;
            } else {
                filterBar.classList.add('hidden');
            }

            // 应用搜索
            if (searchKeyword) {
                entries = entries.filter(e => 
                    (e.text || '').toLowerCase().includes(searchKeyword) || 
                    (e.date || '').toLowerCase().includes(searchKeyword)
                );
            }

            if (entries.length === 0) {
                if (searchKeyword) {
                    entriesList.innerHTML = '<div class="empty-state">在这个时空里没有找到相关记忆...</div>';
                } else if (currentFilter.type) {
                     entriesList.innerHTML = '<div class="empty-state">该分类下暂无记录</div>';
                } else if (currentFilter.tag) {
                     entriesList.innerHTML = '<div class="empty-state">该标签下暂无记录</div>';
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
                // const tags = entry.tags || []; // 首页不再获取和显示标签
                
                // 处理长文本预览 (例如只显示前 80 个字符)
                // 先转义，再截断可能会截断转义字符，所以先截断再转义 (但这不安全，因为截断可能正好在 tag 中间)
                // 正确做法：先转义，然后作为纯文本显示。这里我们把 text 视为纯文本。
                const safeText = escapeHtml(text);
                const previewText = safeText.length > 80 ? safeText.substring(0, 80) + '...' : safeText;
                
                // 移除 tagsHtml 生成逻辑
                /* const tagsHtml = tags.length > 0 ? `
                    <div class="entry-tags">
                        ${tags.map(tag => `<span class="entry-tag-item">${tag}</span>`).join('')}
                    </div>
                ` : ''; */

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

        // 3. 情绪足迹 (热力图)
        renderMoodHeatmap(entries);

        // 4. 类型分布
        renderTypeChart(entries);
    }

    function renderMoodHeatmap(entries) {
        const container = document.getElementById('heatmap-chart');
        
        // 准备心情颜色映射 (莫兰迪/马卡龙色盘)
        const moodColors = {
            'happy': '#FFD166',    // 温暖的夕阳黄
            'excited': '#FFD166',  // 复用开心
            'calm': '#06D6A0',     // 清透的海水绿
            'sad': '#118AB2',      // 忧郁的深海蓝
            'anxious': '#118AB2',  // 复用难过
            'confused': '#EF476F', // 柔和的珊瑚粉
            'scared': '#EF476F'    // 复用梦幻
        };

        // 处理数据：将 entries 映射为 date -> mood
        const dateMoodMap = {};
        entries.forEach(e => {
            // 提取日期 YYYY/M/D 或 YYYY-MM-DD
            try {
                const dateKey = new Date(parseInt(e.id)).toDateString(); // 使用时间戳 ID 更准确
                // 如果同一天有多条，优先保留第一个遍历到的 (entries 通常是倒序，所以是最新的一条)
                // 或者保留情绪更强烈的？这里简单起见，取最新一条
                if (!dateMoodMap[dateKey]) {
                    dateMoodMap[dateKey] = e.mood;
                }
            } catch(err) {}
        });

        // 生成最近 30 天的日期数组 (倒序：从今天往前)
        // 为了显示在 Grid 里符合直觉，我们通常按日历顺序显示，或者简单地展示过去30个格子
        // 这里采用 GitHub 风格：从左上到右下，按时间顺序排列？
        // 或者简单点：7列 (周日到周六)，展示最近 4-5 周
        
        const days = [];
        const today = new Date();
        // 生成过去 28 天 (4周) 的数据，方便 Grid 排列
        for (let i = 27; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            days.push(d);
        }

        container.innerHTML = days.map(date => {
            const dateKey = date.toDateString();
            const mood = dateMoodMap[dateKey];
            const color = mood ? moodColors[mood] : '';
            const style = color ? `background-color: ${color};` : '';
            const className = mood ? 'heatmap-day has-data' : 'heatmap-day';
            const title = `${date.toLocaleDateString()} ${mood ? getMoodLabel(mood) : '无记录'}`;
            
            return `<div class="${className}" style="${style}" title="${title}"></div>`;
        }).join('');
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
        currentFilter.tag = null; // 切换类型时，清除标签筛选，避免冲突
        
        // Switch to home view
        switchView('view-home');
        
        // Ideally switchView handles tab active state, but we need to ensure data is reloaded
        // switchView calls loadEntries() if target is view-home
        loadEntries(); // 手动调用一次确保状态更新
    };

    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', () => {
            currentFilter.type = null;
            currentFilter.tag = null; // 清除标签筛选
            searchInput.value = ''; // 清除搜索框
            loadEntries();
        });
    }

    // Search Logic
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase().trim();
            loadEntries(keyword);
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
        console.log('=== 开始执行导出流程 ===');
        
        // 1. 数据获取与验证
        const key = 'dream-entries'; // 确认使用的 Key
        const rawData = localStorage.getItem(key);
        
        console.log(`正在读取 localStorage key: "${key}"`);
        console.log('获取到的原始数据类型:', typeof rawData);
        if (rawData) {
            console.log('获取到的原始数据长度:', rawData.length);
            console.log('获取到的原始数据(前100字符):', rawData.substring(0, 100));
        } else {
            console.log('获取到的原始数据: null');
        }

        // 判空逻辑
        if (!rawData) {
            console.warn('导出失败：无法从 localStorage 获取数据');
            alert('没有可导出的日记！(数据为空)');
            return;
        }

        let parsedData;
        try {
            parsedData = JSON.parse(rawData);
            if (!Array.isArray(parsedData) || parsedData.length === 0) {
                console.warn('导出中止：数据解析后为空数组');
                alert('没有可导出的日记！(列表为空)');
                return;
            }
            console.log('数据校验通过，包含条目数:', parsedData.length);
        } catch (e) {
            console.error('JSON 解析错误:', e);
            alert('导出失败：数据格式错误');
            return;
        }

        try {
            // 2. 生成 Data URI (关键兼容性修改)
            // 使用 unescape + encodeURIComponent 解决中文乱码问题
            const jsonString = JSON.stringify(parsedData, null, 2);
            const base64Content = btoa(unescape(encodeURIComponent(jsonString)));
            const dataUri = 'data:application/json;base64,' + base64Content;
            
            console.log('生成的 Data URI 长度:', dataUri.length);
            console.log('生成的 Data URI 前100个字符:', dataUri.substring(0, 100));

            // 3. 触发下载
            // 生成文件名: dream_diary_backup_YYYYMMDD_HHMMSS.json
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
            const filename = `dream_diary_backup_${dateStr}_${timeStr}.json`;
            
            console.log('准备下载文件:', filename);

            const a = document.createElement('a');
            a.href = dataUri;
            a.download = filename;
            a.style.display = 'none'; // 隐藏元素
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            console.log('=== 导出操作已触发 ===');
            // 考虑到部分安卓 WebView 下载后可能不会自动提示，给个 Alert
            // alert('已触发下载，请检查下载管理器');
        } catch (e) {
            console.error('导出过程中发生异常:', e);
            alert('导出发生错误: ' + e.message);
        }
    }

    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                // 简单的数据格式检查
                if (!Array.isArray(data)) {
                    alert('文件格式错误：备份文件必须是 JSON 数组');
                    return;
                }
                
                // 检查数组项是否看起来像日记 (可选)
                if (data.length > 0 && (!data[0].id || !data[0].text)) {
                    alert('文件内容格式不正确：找不到日记数据');
                    return;
                }

                if (confirm(`准备导入 ${data.length} 条记录。\n\n点击“确定”：覆盖现有数据（清空旧数据）。\n点击“取消”：合并到现有数据（保留旧数据）。`)) {
                     // 覆盖模式
                     localStorage.setItem('dream-entries', JSON.stringify(data));
                     alert('导入成功！旧数据已覆盖。');
                } else {
                    // 合并模式 (去重 id)
                    const current = JSON.parse(localStorage.getItem('dream-entries') || '[]');
                    const currentIds = new Set(current.map(c => c.id));
                    
                    // 找出新数据中 ID 不重复的项
                    const newEntries = data.filter(d => !currentIds.has(d.id));
                    
                    if (newEntries.length === 0) {
                        alert('导入完成：没有发现新记录 (所有记录已存在)。');
                    } else {
                        // 合并并按 ID (时间戳) 倒序排列
                        const merged = [...newEntries, ...current].sort((a,b) => b.id - a.id);
                        localStorage.setItem('dream-entries', JSON.stringify(merged));
                        alert(`导入成功！已追加 ${newEntries.length} 条新记录。`);
                    }
                }
                
                // 重新加载界面
                loadEntries();
                renderStats(); 
                
            } catch (err) {
                console.error('Import error:', err);
                alert('导入失败：文件损坏或 JSON 格式错误');
            } finally {
                // 重置 input，允许重复选择同一个文件
                importInput.value = '';
            }
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
                renderFlashback(); // 加载时光胶囊
            } else {
                showPinError();
            }
        } else if (pinState.mode === 'disable_verify') {
            // ... (保持不变)
            if (input === savedPin) {
                localStorage.removeItem('app-pin');
                privacyStatusLabel.textContent = '未开启';
                closePrivacyModal();
                alert('隐私锁已关闭');
            } else {
                showPinError();
            }
        } else if (pinState.mode === 'set_new_1') {
            // ... (保持不变)
            pinState.tempPin = input;
            pinState.currentInput = '';
            updatePinDisplay();
            pinState.mode = 'set_new_2';
            privacyTip.textContent = '请再次输入确认';
        } else if (pinState.mode === 'set_new_2') {
            // ... (保持不变)
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

    // 时光胶囊逻辑
    function renderFlashback() {
        if (!flashbackCard) return;
        
        try {
            const entries = JSON.parse(localStorage.getItem('dream-entries') || '[]');
            
            // 至少要有3条日记才显示
            if (entries.length < 3) {
                flashbackCard.classList.add('hidden');
                return;
            }

            const today = new Date();
            const todayMonth = today.getMonth() + 1;
            const todayDate = today.getDate();
            const todayYear = today.getFullYear();
            const todayDateStr = `${todayYear}/${todayMonth}/${todayDate}`;

            // 辅助函数：解析日期字符串
            function parseEntryDate(dateStr) {
                try {
                    // 尝试解析日期字符串（格式可能是 "2024/12/12 14:30:00" 或类似）
                    const datePart = dateStr.split(' ')[0]; // 获取日期部分
                    const parts = datePart.split('/');
                    if (parts.length >= 3) {
                        return {
                            year: parseInt(parts[0]),
                            month: parseInt(parts[1]),
                            date: parseInt(parts[2])
                        };
                    }
                    // 如果格式不对，尝试使用 Date 对象解析
                    const dateObj = new Date(dateStr);
                    if (!isNaN(dateObj.getTime())) {
                        return {
                            year: dateObj.getFullYear(),
                            month: dateObj.getMonth() + 1,
                            date: dateObj.getDate()
                        };
                    }
                } catch (e) {
                    console.warn('Failed to parse date:', dateStr, e);
                }
                return null;
            }

            // 1. 查找"那年今日"（同月同日但不同年）
            const anniversaryEntry = entries.find(e => {
                const parsed = parseEntryDate(e.date);
                if (!parsed) return false;
                return parsed.month === todayMonth && 
                       parsed.date === todayDate && 
                       parsed.year !== todayYear;
            });

            let flashbackEntry = null;
            let title = '';

            if (anniversaryEntry) {
                flashbackEntry = anniversaryEntry;
                title = '那年今日的梦';
            } else {
                // 2. 随机漫游：排除今天的日记，只回顾过去
                const pastEntries = entries.filter(e => {
                    const parsed = parseEntryDate(e.date);
                    if (!parsed) return false;
                    // 排除今天和未来的日期
                    const entryDateStr = `${parsed.year}/${parsed.month}/${parsed.date}`;
                    return entryDateStr !== todayDateStr;
                });

                if (pastEntries.length > 0) {
                    const randomIndex = Math.floor(Math.random() * pastEntries.length);
                    flashbackEntry = pastEntries[randomIndex];
                    title = '潜意识的碎片';
                }
            }

            if (flashbackEntry) {
                // 渲染卡片
                const titleEl = flashbackCard.querySelector('.flashback-title');
                const textEl = flashbackCard.querySelector('.flashback-text');
                
                titleEl.textContent = title;
                
                // 处理文本预览：取前30个字
                const fullText = flashbackEntry.text || '';
                const preview = fullText.length > 30 ? fullText.substring(0, 30) + '...' : fullText;
                const moodEmoji = getMoodEmoji(flashbackEntry.mood) || getMoodEmoji('confused'); // 使用默认图标
                
                // 使用 innerHTML 以正确显示 SVG 图标
                textEl.innerHTML = `${moodEmoji} <span style="margin-left: 4px;">${flashbackEntry.date.split(' ')[0]} - ${preview}</span>`;
                
                // 显示卡片
                flashbackCard.classList.remove('hidden');
                
                // 绑定点击事件
                flashbackCard.onclick = () => {
                    openEntryDetail(flashbackEntry);
                };
            } else {
                flashbackCard.classList.add('hidden');
            }

        } catch (e) {
            console.error('Flashback render failed:', e);
            flashbackCard.classList.add('hidden');
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
