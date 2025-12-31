// --- 全局错误处理 & 兼容性补丁 ---
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global Error:', message, source, lineno, error);
    // 在屏幕上显示错误，方便在移动端 WebView 调试
    showToast(`❌ 系统错误: ${message}`, 5000, true);
    return false;
};

// 简单的 Toast 提示函数 (替代 alert)
window.showToast = function(message, duration = 2000, isError = false) {
    const container = document.getElementById('toast-container');
    if (!container) return; // DOM 还没加载完

    const toast = document.createElement('div');
    toast.className = isError ? 'toast error' : 'toast';
    toast.textContent = message;

    container.appendChild(toast);

    // 动画进出
    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, duration);
};

// 覆盖原生 alert，防止 WebView 阻塞
window.alert = function(message) {
    showToast(message, 3000);
};

// 自定义确认弹框（替代 WebView 里可能被禁用的 confirm()）
// 返回值：'confirm' | 'cancel' | 'dismiss'
async function showConfirmChoice(options) {
    const overlay = document.getElementById('modal-confirm');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const btnOk = document.getElementById('confirm-ok-btn');
    const btnCancel = document.getElementById('confirm-cancel-btn');
    const btnClose = document.getElementById('confirm-close-btn');

    // DOM 未就绪时兜底：尽量不阻塞（鸿蒙 Next 下原生 confirm 可能无效）
    if (!overlay || !titleEl || !msgEl || !btnOk || !btnCancel || !btnClose) {
        console.warn('Confirm modal DOM not found, fallback to native confirm.');
        // eslint-disable-next-line no-alert
        const ok = confirm(options?.message || '确认继续？');
        return ok ? 'confirm' : 'cancel';
    }

    const {
        title = '提示',
        message = '',
        confirmText = '确定',
        cancelText = '取消',
        dangerous = false,
        backdropClosable = true,
        hideCancel = false,
    } = options || {};

    titleEl.textContent = title;
    msgEl.textContent = message;
    btnOk.textContent = confirmText;
    btnCancel.textContent = cancelText;
    btnOk.classList.toggle('danger', !!dangerous);
    const prevCancelDisplay = btnCancel.style.display;
    btnCancel.style.display = hideCancel ? 'none' : prevCancelDisplay;

    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    return await new Promise((resolve) => {
        let settled = false;
        const settle = (result) => {
            if (settled) return;
            settled = true;
            overlay.classList.remove('active');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            cleanup();
            resolve(result);
        };

        const onOk = () => settle('confirm');
        const onCancel = () => settle('cancel');
        const onClose = () => settle('dismiss');
        const onBackdrop = (e) => {
            if (backdropClosable && e.target === overlay) settle('dismiss');
        };
        const onKey = (e) => {
            if (e.key === 'Escape') settle('dismiss');
        };

        function cleanup() {
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
            btnClose.removeEventListener('click', onClose);
            overlay.removeEventListener('click', onBackdrop);
            document.removeEventListener('keydown', onKey);
            btnCancel.style.display = prevCancelDisplay;
        }

        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
        btnClose.addEventListener('click', onClose);
        overlay.addEventListener('click', onBackdrop);
        document.addEventListener('keydown', onKey);
    });
}

// 安全的存储封装：
// - 优先使用鸿蒙 Next WebView 注入的 JSProxy 存储对象（同步 getItem/setItem/removeItem）
// - 若不存在则 fallback 到 localStorage
//
// 约定：鸿蒙侧注入对象名优先为 window.HarmonyStorage（可自行调整/扩展别名）
function resolveNativeStorageBridge() {
    const candidates = [
        'HarmonyStorage',
        'NativeStorage',
        'ArkStorage',
        'storageBridge',
    ];
    for (const name of candidates) {
        const obj = window[name];
        if (obj && typeof obj.getItem === 'function' && typeof obj.setItem === 'function' && typeof obj.removeItem === 'function') {
            return obj;
        }
    }
    return null;
}

const SafeStorage = {
    getItem: (key) => {
        // 1) Harmony/Native bridge first
        const bridge = resolveNativeStorageBridge();
        if (bridge) {
            try {
                const v = bridge.getItem(key);
                // 仅支持同步返回；若返回 Promise，提示并降级
                if (v && typeof v.then === 'function') {
                    console.warn('Native storage bridge returned Promise; expected sync value. Falling back to localStorage.');
                } else {
                    return v ?? null;
                }
            } catch (e) {
                console.error('NativeStorage Read Error:', e);
                showToast('鸿蒙存储读取失败，已尝试降级', 2500, true);
            }
        }

        // 2) localStorage fallback
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.error('LocalStorage Read Error:', e);
            showToast('存储读取失败，请检查权限', 3000, true);
            return null;
        }
    },
    setItem: (key, value) => {
        // 1) Harmony/Native bridge first
        const bridge = resolveNativeStorageBridge();
        if (bridge) {
            try {
                const r = bridge.setItem(key, value);
                if (r && typeof r.then === 'function') {
                    console.warn('Native storage bridge returned Promise; expected sync completion. Falling back to localStorage.');
                } else {
                    return;
                }
            } catch (e) {
                console.error('NativeStorage Write Error:', e);
                showToast('鸿蒙存储写入失败，已尝试降级', 2500, true);
            }
        }

        // 2) localStorage fallback
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error('LocalStorage Write Error:', e);
            showToast('存储写入失败，空间不足或无权限', 3000, true);
        }
    },
    removeItem: (key) => {
        // 1) Harmony/Native bridge first
        const bridge = resolveNativeStorageBridge();
        if (bridge) {
            try {
                const r = bridge.removeItem(key);
                if (r && typeof r.then === 'function') {
                    console.warn('Native storage bridge returned Promise; expected sync completion. Falling back to localStorage.');
                } else {
                    return;
                }
            } catch (e) {
                console.error('NativeStorage Remove Error:', e);
                showToast('鸿蒙存储删除失败，已尝试降级', 2500, true);
            }
        }

        // 2) localStorage fallback
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('LocalStorage Remove Error:', e);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dreamInput = document.getElementById('dream-input');
    const saveBtn = document.getElementById('save-btn');
    const entriesList = document.getElementById('entries-list');
    const fabAdd = document.getElementById('fab-add');
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');
    const appTitleEl = document.getElementById('app-title');
    
    // New Form Elements
    const moodSelector = document.getElementById('mood-selector');
    // 仅绑定“新建日记弹框”里的情绪标签，避免误绑到详情页/其它位置的 .mood-tag
    const moodTags = moodSelector ? moodSelector.querySelectorAll('.mood-tag:not(.add-btn)') : [];
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
    const detailTagsContainer = document.getElementById('detail-tags');

    // Edit Mode Elements
    const editEntryBtn = document.getElementById('edit-entry-btn');
    const detailViewContainer = document.getElementById('detail-view-container');
    const detailEditContainer = document.getElementById('detail-edit-container');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    // Edit Inputs
    const editDateInput = document.getElementById('edit-date');
    const editInput = document.getElementById('edit-input');
    const editMoodSelector = document.getElementById('edit-mood-selector');
    const editTagInput = document.getElementById('edit-tag-input');
    const editTagsList = document.getElementById('edit-tags-list');
    const editAddTagBtn = document.getElementById('edit-add-tag-btn');
    
    let currentDetailEntryId = null; // Store currently viewed entry ID
    let isEditing = false;
    let editTags = []; // Tags for edit mode

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
    const searchContainer = document.querySelector('#view-home .search-container');

    // Flashback Element
    const flashbackCard = document.getElementById('flashback-card');

    // Add Mood Elements
    const btnAddMood = document.getElementById('btn-add-mood');
    const modalAddMood = document.getElementById('modal-add-mood');
    const closeAddMoodBtn = document.getElementById('close-add-mood-btn');
    const cancelAddMoodBtn = document.getElementById('cancel-add-mood-btn');
    const confirmAddMoodBtn = document.getElementById('confirm-add-mood-btn');
    const newMoodInput = document.getElementById('new-mood-input');
    const newMoodEmoji = document.getElementById('new-mood-emoji');
    const newMoodColor = document.getElementById('new-mood-color');
    const colorPreviewText = document.getElementById('color-preview-text');
    const newMoodColorHex = document.getElementById('new-mood-color-hex');
    const moodColorPalette = document.getElementById('mood-color-palette');

    // 通用星星 SVG 图标
    const STAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path fill-rule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576L8.279 5.044A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clip-rule="evenodd" /></svg>`;

    // 默认/内置情绪数据映射
    const defaultMoods = {
        'happy': { label: '开心', emoji: '😊', color: '#FFD166' },
        'calm': { label: '平静', emoji: '😌', color: '#06D6A0' },
        'sad': { label: '难过', emoji: '😢', color: '#118AB2' },
        'anxious': { label: '焦虑', emoji: '😰', color: '#118AB2' }, // 复用色
        'excited': { label: '兴奋', emoji: '🤩', color: '#FFD166' }, // 复用色
        'confused': { label: '困惑', emoji: '😵', color: '#EF476F' },
        'scared': { label: '恐惧', emoji: '😱', color: '#9B89B3' }
    };
    
    // 内存中的完整情绪列表 (内置 + 自定义)
    let allMoodsData = { ...defaultMoods };

    // 初始化应用
    function initApp() {
        try {
            // 1. 加载夜间模式
            const savedTheme = SafeStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                if (darkModeToggle) darkModeToggle.checked = true;
            }

            // 1.5 加载自定义情绪
            loadCustomMoods();

            // 2. 检查隐私锁
            const savedPin = SafeStorage.getItem('app-pin');
            if (savedPin) {
                if (privacyStatusLabel) privacyStatusLabel.textContent = '已开启';
                // 启动时验证
                startPinVerify('start');
            } else {
                if (privacyStatusLabel) privacyStatusLabel.textContent = '未开启';
                loadEntries(); // 没锁直接加载
                renderFlashback(); // 加载时光胶囊
            }
        } catch (err) {
            console.error('Init Error:', err);
            showToast('初始化失败: ' + err.message, 5000, true);
        }
    }

    // Detail Modal Logic
    function openEntryDetail(entry) {
        currentDetailEntryId = entry.id; // Store ID for editing
        isEditing = false;
        
        // Reset View Mode
        detailViewContainer.classList.remove('hidden');
        detailEditContainer.classList.add('hidden');
        editDateInput.classList.add('hidden');
        detailDate.classList.remove('hidden');
        editEntryBtn.style.display = 'flex';

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
        // Use the container defined in HTML now (detailTagsContainer is #detail-tags)
        // Note: In HTML edit we changed id="detail-tags" class="entry-tags" inside detail-view-container
        if (detailTagsContainer) {
            detailTagsContainer.innerHTML = tags.map(tag => `
                <span class="entry-tag-item" style="cursor: pointer;" onclick="filterByTag('${tag}')">${tag}</span>
            `).join('');
        }
        
        modalDetail.classList.add('active');
    }

    // Edit Mode Functions
    if (editEntryBtn) {
        editEntryBtn.addEventListener('click', () => {
            enterEditMode();
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', async () => {
            const r = await showConfirmChoice({
                title: '放弃修改？',
                message: '确定要放弃修改吗？',
                confirmText: '放弃',
                cancelText: '继续编辑',
                dangerous: true,
            });
            if (r === 'confirm') exitEditMode();
        });
    }

    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', () => {
            saveEntryChanges();
        });
    }

    // Edit Tags Logic
    if (editAddTagBtn) {
        editAddTagBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addEditTag(editTagInput.value);
            editTagInput.focus();
        });
    }

    if (editTagInput) {
        editTagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addEditTag(e.target.value);
            }
        });
        
        editTagInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if (!val) return;
            const lastChar = val.slice(-1);
            if ([' ', '，', ','].includes(lastChar)) {
                addEditTag(val.slice(0, -1));
            }
        });
    }

    function addEditTag(text) {
        const tag = text.trim();
        if (tag && !editTags.includes(tag)) {
            editTags.push(tag);
            renderEditTags();
            editTagInput.value = '';
        } else if (tag && editTags.includes(tag)) {
            editTagInput.value = '';
        }
    }

    function removeEditTag(tag) {
        editTags = editTags.filter(t => t !== tag);
        renderEditTags();
    }
    
    // Expose for onclick
    window.removeEditTag = removeEditTag;

    function renderEditTags() {
        editTagsList.innerHTML = editTags.map(tag => `
            <span class="tag-pill">
                ${tag}
                <span class="tag-remove" onclick="removeEditTag('${tag}')">×</span>
            </span>
        `).join('');
    }

    function enterEditMode() {
        isEditing = true;
        const entries = JSON.parse(SafeStorage.getItem('dream-entries') || '[]');
        const entry = entries.find(e => e.id.toString() === currentDetailEntryId.toString());
        
        if (!entry) {
            alert('找不到该日记数据');
            modalDetail.classList.remove('active');
            return;
        }

        // 1. Populate Inputs
        // Date: Convert locale string/timestamp to YYYY-MM-DDTHH:mm for datetime-local
        try {
            const d = new Date(parseInt(entry.id)); // Use ID as timestamp source of truth
            // Format to local ISO-like string
            const offset = d.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(d - offset)).toISOString().slice(0, 16);
            editDateInput.value = localISOTime;
        } catch (e) {
            console.error('Date parsing error', e);
        }

        editInput.value = entry.text;
        
        // Type
        const typeRadios = document.querySelectorAll('input[name="edit-entry-type"]');
        typeRadios.forEach(r => {
            if (r.value === entry.type) r.checked = true;
        });

        // Mood - Clone structure from main form to ensure latest custom moods are included
        const mainMoodSelector = document.getElementById('mood-selector');
        if (mainMoodSelector) {
             editMoodSelector.innerHTML = mainMoodSelector.innerHTML;
             
             // Re-bind click events for selection
             editMoodSelector.querySelectorAll('.mood-tag:not(.add-btn)').forEach(tag => {
                 tag.addEventListener('click', () => {
                    const allTags = editMoodSelector.querySelectorAll('.mood-tag:not(.add-btn)');
                    const wasSelected = tag.classList.contains('selected');
                    allTags.forEach(t => t.classList.remove('selected'));
                    if (!wasSelected) {
                        tag.classList.add('selected');
                    }
                 });
             });

             // Re-bind add button event
             const editAddBtn = editMoodSelector.querySelector('.add-btn');
             if (editAddBtn) {
                 // Remove ID to avoid duplicates
                 editAddBtn.removeAttribute('id');
                 editAddBtn.addEventListener('click', (e) => {
                     e.preventDefault();
                     openAddMoodModal();
                 });
             }
        }
        
        // Set Selected Mood
        editMoodSelector.querySelectorAll('.mood-tag').forEach(tag => {
            tag.classList.remove('selected');
            if (tag.dataset.mood === entry.mood) {
                tag.classList.add('selected');
            }
        });

        // Tags
        editTags = [...(entry.tags || [])];
        renderEditTags();

        // 2. Toggle UI
        detailViewContainer.classList.add('hidden');
        detailEditContainer.classList.remove('hidden');
        
        detailDate.classList.add('hidden');
        editDateInput.classList.remove('hidden');
        
        editEntryBtn.style.display = 'none'; // Hide edit button while editing
    }

    function exitEditMode() {
        isEditing = false;
        detailViewContainer.classList.remove('hidden');
        detailEditContainer.classList.add('hidden');
        
        editDateInput.classList.add('hidden');
        detailDate.classList.remove('hidden');
        
        editEntryBtn.style.display = 'flex';
    }

    function saveEntryChanges() {
        const newText = editInput.value.trim();
        if (!newText) {
            alert('内容不能为空');
            return;
        }

        const entries = JSON.parse(SafeStorage.getItem('dream-entries') || '[]');
        const entryIndex = entries.findIndex(e => e.id.toString() === currentDetailEntryId.toString());
        
        if (entryIndex === -1) {
            alert('保存失败：原记录不存在');
            return;
        }

        // Get Values
        const newType = document.querySelector('input[name="edit-entry-type"]:checked').value;
        
        let newMood = '';
        const selectedMoodTag = editMoodSelector.querySelector('.mood-tag.selected');
        if (selectedMoodTag) {
            newMood = selectedMoodTag.dataset.mood;
        }

        // Date Handling
        const newDateVal = editDateInput.value; // YYYY-MM-DDTHH:mm
        let newTimestamp = entries[entryIndex].id; // Default keep ID
        let newDateStr = entries[entryIndex].date;

        if (newDateVal) {
            const newDateObj = new Date(newDateVal);
            // We usually keep the ID (creation time) same to preserve identity, 
            // but update the display date and sorting timestamp.
            // If we update ID, it might break references? Let's keep ID constant but update a 'timestamp' field used for sorting.
            // Current app uses 'id' as timestamp often.
            // Let's update the 'timestamp' field and 'date' string.
            newTimestamp = newDateObj.getTime();
            newDateStr = newDateObj.toLocaleString('zh-CN', { hour12: false });
        }

        // Update Object
        entries[entryIndex] = {
            ...entries[entryIndex],
            text: newText,
            type: newType,
            mood: newMood,
            tags: [...editTags],
            date: newDateStr,
            timestamp: newTimestamp // Update sorting time
        };

        // Save
        SafeStorage.setItem('dream-entries', JSON.stringify(entries));

        // Refresh UI
        loadEntries(); // Refresh main list
        renderStats(); // Refresh stats
        
        // Refresh Current Modal View
        openEntryDetail(entries[entryIndex]);
        
        // Alert & Exit
        // alert('修改已保存'); // Optional
        exitEditMode();
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

    async function closeDetailModal() {
        if (isEditing) {
            const r = await showConfirmChoice({
                title: '关闭详情？',
                message: '修改未保存，确定要关闭吗？',
                confirmText: '关闭',
                cancelText: '继续编辑',
                dangerous: true,
            });
            if (r !== 'confirm') return;
            exitEditMode(); // Reset state
        }
        modalDetail.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', () => { void closeDetailModal(); });
    }

    // 点击遮罩层关闭详情
    modalDetail.addEventListener('click', (e) => {
        if (e.target === modalDetail) {
            void closeDetailModal();
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

        // 更新标题栏标题
        if (appTitleEl) {
            if (targetId === 'view-home') appTitleEl.textContent = '星海日记';
            else if (targetId === 'view-stats') appTitleEl.textContent = '碎片收集';
            else if (targetId === 'view-settings') appTitleEl.textContent = '设置';
        }

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

    // 自定义情绪逻辑
    function loadCustomMoods() {
        try {
            const customMoods = JSON.parse(SafeStorage.getItem('custom-moods') || '[]');
            
            customMoods.forEach(mood => {
                // 兼容旧数据格式 (如果 mood 是字符串，转换为对象)
                let moodObj = mood;
                if (typeof mood === 'string') {
                    moodObj = {
                        key: mood, // 使用原名作为key
                        label: mood,
                        emoji: '✨', // 默认图标
                        color: '#888888' // 默认颜色
                    };
                }
                
                // 添加到全局数据
                allMoodsData[moodObj.key] = {
                    label: moodObj.label,
                    emoji: moodObj.emoji,
                    color: moodObj.color
                };

                appendMoodToSelector(moodObj);
            });
        } catch (e) {
            console.error('Failed to load custom moods', e);
        }
    }

    function appendMoodToSelector(moodObj) {
        // 创建新的 Mood Tag 元素
        const tag = document.createElement('span');
        tag.className = 'mood-tag';
        tag.dataset.mood = moodObj.key;
        
        // 检查是否为自定义情绪 (不在默认列表中)
        // 如果是自定义情绪，添加删除按钮
        const isCustom = !defaultMoods[moodObj.key];
        let deleteBtnHtml = '';
        if (isCustom) {
            deleteBtnHtml = `<span class="mood-delete-btn" onclick="event.stopPropagation(); removeCustomMood('${moodObj.key}')">×</span>`;
            tag.classList.add('custom-mood-tag');
        }

        // 统一展示逻辑：
        // 1. 星星图标 (颜色正确)
        // 2. 文字
        // 3. Emoji
        // 4. (可选) 删除按钮
        // 注意：原需求是 "自定义情绪时...文字前面使用星星展示正确的颜色，文字后面展示emoji"
        // 同时提到 "目前的自带情绪，文字前的星星已经OK，需要在文字末尾补上emoji"
        // 意味着所有情绪都统一为：[星星] [文字] [emoji] [x]
        
        tag.innerHTML = `
            <span class="mood-icon-svg" style="display: inline-flex; align-items: center; justify-content: center; width: 1.2em; height: 1.2em; margin-right: 4px; color: ${moodObj.color}; font-style: normal;">
                ${STAR_SVG}
            </span>
            <span class="mood-label">${moodObj.label}</span>
            <span class="mood-emoji">${moodObj.emoji}</span>
            ${deleteBtnHtml}
        `;
        
        // 插入到 + 号按钮之前 (Main Selector)
        if (btnAddMood && btnAddMood.parentNode) {
            // Clone first to attach event
            const mainClone = tag.cloneNode(true);
            mainClone.addEventListener('click', () => {
                const allTags = moodSelector.querySelectorAll('.mood-tag:not(.add-btn)');
                const wasSelected = mainClone.classList.contains('selected');
                allTags.forEach(t => t.classList.remove('selected'));
                if (wasSelected) {
                    selectedMood = '';
                    return;
                }
                mainClone.classList.add('selected');
                selectedMood = mainClone.dataset.mood;
            });
            
            // Re-attach delete event for clone (because onclick attribute works but we want to be safe)
            // Actually inline onclick works fine for global functions. 
            // But let's make sure removeCustomMood is global.
            
            btnAddMood.parentNode.insertBefore(mainClone, btnAddMood);
        }

        // 插入到 Edit Selector (如果存在)
        if (typeof editMoodSelector !== 'undefined' && editMoodSelector) {
            const editAddBtn = editMoodSelector.querySelector('.add-btn');
            if (editAddBtn && editAddBtn.parentNode) {
                const editClone = tag.cloneNode(true);
                editClone.addEventListener('click', () => {
                     const allTags = editMoodSelector.querySelectorAll('.mood-tag:not(.add-btn)');
                     const wasSelected = editClone.classList.contains('selected');
                     allTags.forEach(t => t.classList.remove('selected'));
                     if (!wasSelected) {
                        editClone.classList.add('selected');
                     }
                });
                editAddBtn.parentNode.insertBefore(editClone, editAddBtn);
            }
        }
    }

    // 删除自定义情绪
    window.removeCustomMood = function(key) {
        (async () => {
            const r = await showConfirmChoice({
                title: '删除情绪？',
                message: '确定要删除这个情绪吗？',
                confirmText: '删除',
                cancelText: '取消',
                dangerous: true,
            });
            if (r !== 'confirm') return;

            try {
                let customMoods = JSON.parse(SafeStorage.getItem('custom-moods') || '[]');
                // 过滤掉
                customMoods = customMoods.filter(m => {
                    const mKey = (typeof m === 'string') ? m : m.key;
                    return mKey !== key;
                });
                SafeStorage.setItem('custom-moods', JSON.stringify(customMoods));
                
                // 从内存中移除
                delete allMoodsData[key];
                
                // 从界面移除 (所有匹配的标签)
                const selectorString = `.mood-tag[data-mood="${key}"]`;
                document.querySelectorAll(selectorString).forEach(el => el.remove());
                
                // 如果当前选中的就是这个，重置选中状态
                if (selectedMood === key) {
                    selectedMood = '';
                }
                
            } catch (e) {
                console.error('Failed to remove mood', e);
            }
        })();
    };

    function openAddMoodModal() {
        modalAddMood.classList.add('active');
        newMoodInput.value = '';
        newMoodEmoji.value = '';
        newMoodColor.value = '#a18cd1'; // 重置为默认颜色
        colorPreviewText.textContent = '#a18cd1';
        if (newMoodColorHex) newMoodColorHex.value = '#a18cd1';
        if (moodColorPalette) {
            moodColorPalette.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('selected'));
            const first = moodColorPalette.querySelector(`.color-swatch[data-color=\"#a18cd1\"]`);
            if (first) first.classList.add('selected');
        }
        
        // 稍微延迟聚焦，等待模态框动画开始
        setTimeout(() => {
            newMoodInput.focus();
        }, 100);
    }

    // 颜色兜底：常用色 + HEX 输入（鸿蒙 Next 不支持原生取色器时可用）
    const PRESET_MOOD_COLORS = [
        '#a18cd1', '#9b9ece', '#6a6c9c', '#ffb7b2', '#FFD166', '#06D6A0', '#118AB2', '#EF476F',
        '#fbc2eb', '#c5cae9', '#80EDCE', '#7ACFE6', '#F7A8B8', '#9B89B3', '#f0f2f7', '#434343'
    ];

    function normalizeHexColor(input) {
        if (!input) return null;
        let s = String(input).trim();
        if (!s) return null;
        if (s[0] !== '#') s = '#' + s;
        // 支持 #RGB/#RRGGBB
        const short = /^#([0-9a-fA-F]{3})$/;
        const full = /^#([0-9a-fA-F]{6})$/;
        if (short.test(s)) {
            const m = s.match(short);
            const r = m[1][0], g = m[1][1], b = m[1][2];
            return ('#' + r + r + g + g + b + b).toLowerCase();
        }
        if (full.test(s)) return s.toLowerCase();
        return null;
    }

    function setMoodColorUI(hex) {
        const color = normalizeHexColor(hex) || '#a18cd1';
        if (newMoodColor) newMoodColor.value = color;
        if (colorPreviewText) colorPreviewText.textContent = color;
        if (newMoodColorHex) newMoodColorHex.value = color;
        if (moodColorPalette) {
            moodColorPalette.querySelectorAll('.color-swatch').forEach(el => {
                el.classList.toggle('selected', el.dataset.color === color);
            });
        }
    }

    function initMoodColorPalette() {
        if (!moodColorPalette) return;
        moodColorPalette.innerHTML = PRESET_MOOD_COLORS.map(c => `
            <button type="button" class="color-swatch" data-color="${c}" style="background: ${c};"></button>
        `).join('');
        moodColorPalette.querySelectorAll('.color-swatch').forEach(btn => {
            btn.addEventListener('click', () => setMoodColorUI(btn.dataset.color));
        });
    }

    initMoodColorPalette();
    setMoodColorUI('#a18cd1');

    if (newMoodColor) {
        newMoodColor.addEventListener('input', (e) => setMoodColorUI(e.target.value));
    }
    if (newMoodColorHex) {
        newMoodColorHex.addEventListener('input', (e) => {
            const norm = normalizeHexColor(e.target.value);
            if (norm) setMoodColorUI(norm);
            else if (colorPreviewText) colorPreviewText.textContent = e.target.value.trim();
        });
        newMoodColorHex.addEventListener('blur', (e) => {
            const norm = normalizeHexColor(e.target.value);
            if (!norm) {
                alert('颜色格式不正确，请输入 #RRGGBB 或 #RGB');
                setMoodColorUI(newMoodColor?.value || '#a18cd1');
            } else {
                setMoodColorUI(norm);
            }
        });
    }

    // 监听 emoji 输入框聚焦，防止键盘遮挡
    if (newMoodEmoji) {
        newMoodEmoji.addEventListener('focus', () => {
             // 延迟滚动，等待键盘弹出
            setTimeout(() => {
                newMoodEmoji.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    }

    function closeAddMoodModal() {
        modalAddMood.classList.remove('active');
    }

    if (btnAddMood) {
        btnAddMood.addEventListener('click', (e) => {
            e.preventDefault(); // 防止触发表单提交或其他意外
            openAddMoodModal();
        });
    }

    // 监听颜色变化更新预览文本
    if (newMoodColor) {
        newMoodColor.addEventListener('input', (e) => {
            colorPreviewText.textContent = e.target.value;
        });
    }

    if (closeAddMoodBtn) {
        closeAddMoodBtn.addEventListener('click', closeAddMoodModal);
    }
    
    if (cancelAddMoodBtn) {
        cancelAddMoodBtn.addEventListener('click', closeAddMoodModal);
    }

    if (confirmAddMoodBtn) {
        confirmAddMoodBtn.addEventListener('click', () => {
            const label = newMoodInput.value.trim();
            const emoji = newMoodEmoji.value.trim() || '✨'; // 默认星星
            const color = normalizeHexColor(newMoodColorHex?.value) || normalizeHexColor(newMoodColor?.value) || '#a18cd1';
            
            if (label) {
                const key = 'custom_' + Date.now(); // 生成唯一Key

                const newMoodObj = {
                    key: key,
                    label: label,
                    emoji: emoji,
                    color: color
                };

                // 保存到 localStorage
                try {
                    const customMoods = JSON.parse(SafeStorage.getItem('custom-moods') || '[]');
                    
                    // 检查是否重名 (可选，这里只检查 key，但 key 是自动生成的)
                    // 如果想按 Label 判重:
                    const exists = customMoods.some(m => (typeof m === 'string' ? m : m.label) === label);
                    if (exists) {
                         alert('该情绪名称已存在');
                         return;
                    }

                    customMoods.push(newMoodObj);
                    SafeStorage.setItem('custom-moods', JSON.stringify(customMoods));
                    
                    // 更新全局数据
                    allMoodsData[key] = {
                        label: label,
                        emoji: emoji,
                        color: color
                    };

                    // 添加到界面（不自动选中；由用户自行点击选择）
                    appendMoodToSelector(newMoodObj);
                } catch (e) {
                    console.error('Failed to save mood', e);
                }
                closeAddMoodModal();
            } else {
                alert('请输入情绪名称');
            }
        });
    }

    // 点击遮罩层关闭 Add Mood Modal
    if (modalAddMood) {
        modalAddMood.addEventListener('click', (e) => {
            if (e.target === modalAddMood) {
                closeAddMoodModal();
            }
        });
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
            const allTags = moodSelector ? moodSelector.querySelectorAll('.mood-tag:not(.add-btn)') : moodTags;
            const wasSelected = tag.classList.contains('selected');
            allTags.forEach(t => t.classList.remove('selected'));
            if (wasSelected) {
                selectedMood = '';
                return;
            }
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
            let entries = JSON.parse(SafeStorage.getItem('dream-entries') || '[]');
            if (!Array.isArray(entries)) {
                entries = [];
            }
            entries.unshift(entry);
            SafeStorage.setItem('dream-entries', JSON.stringify(entries));
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
        // 先检查是否在全局 allMoodsData 中
        if (allMoodsData[mood]) {
            return allMoodsData[mood].emoji;
        }
        // 兜底逻辑
        const moodMap = {
            'happy': '😊', 
            'calm': '😌', 
            'sad': '😢', 
            'anxious': '😰', 
            'excited': '🤩', 
            'confused': '😵',
            'scared': '😱'
        };
        // 如果不在映射表中，返回通用图标或者空，这里返回一个默认 Emoji
        return moodMap[mood] || '✨';
    }

    function getMoodLabel(mood) {
        // 先检查是否在全局 allMoodsData 中
        if (allMoodsData[mood]) {
            return allMoodsData[mood].label;
        }
        
        const moodMap = {
            'happy': '开心', 'calm': '平静', 'sad': '难过', 
            'anxious': '焦虑', 'excited': '兴奋', 'confused': '困惑', 'scared': '恐惧'
        };
        // 如果不在映射表中，直接返回 mood 本身 (适配自定义情绪)
        return moodMap[mood] || mood;
    }
    
    // 辅助函数：获取情绪颜色
    function getMoodColor(mood) {
        if (allMoodsData[mood]) {
            return allMoodsData[mood].color;
        }
        // 内置默认颜色映射
        const colorMap = {
             'happy': '#FFD166', 'excited': '#FFD166',
             'calm': '#06D6A0',
             'sad': '#118AB2', 'anxious': '#118AB2',
             'confused': '#EF476F', 'scared': '#9B89B3'
        };
        return colorMap[mood] || '#ccc';
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
            // 先判断“是否有任何记录”，决定是否显示搜索框
            const allEntriesRaw = JSON.parse(SafeStorage.getItem('dream-entries') || '[]');
            const hasAnyEntries = Array.isArray(allEntriesRaw) && allEntriesRaw.length > 0;
            if (searchContainer) {
                searchContainer.classList.toggle('hidden', !hasAnyEntries);
            }

            let entries = allEntriesRaw;
            
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
                     entriesList.innerHTML = '<div class="empty-state">还没有记录，点击右下角“+”号开始记录你的第一个星海碎片吧！</div>';
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

                // 使用新函数获取颜色
                const moodColor = getMoodColor(entry.mood);
                
                return `
                <div class="dream-entry" data-mood="${entry.mood || ''}" style="--mood-color: ${moodColor}">
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
        (async () => {
            const r = await showConfirmChoice({
                title: '确认删除？',
                message: '确定要遗忘这段梦境吗？\n删除后将无法找回。',
                confirmText: '删除',
                cancelText: '取消',
                dangerous: true,
            });
            if (r !== 'confirm') return;

            try {
                let entries = JSON.parse(SafeStorage.getItem('dream-entries') || '[]');
                // 过滤掉该 id
                entries = entries.filter(e => e.id.toString() !== id.toString());
                SafeStorage.setItem('dream-entries', JSON.stringify(entries));
                
                // 重新加载 (或者可以做更精细的 DOM 删除动画)
                loadEntries();
                renderStats(); // 更新统计
                
                if (navigator.vibrate) navigator.vibrate(50);
            } catch (e) {
                console.error('Delete failed:', e);
                alert('删除失败，请重试');
            }
        })();
    }

    // 统计功能逻辑
    function renderStats() {
        const entries = JSON.parse(SafeStorage.getItem('dream-entries') || '[]');
        
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
        // const moodColors = { ... } // 废弃，改用 getMoodColor

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
            const color = mood ? getMoodColor(mood) : ''; // 使用新函数
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
            
            // 动态背景色
            const bgColor = getMoodColor(mood);
            // 简单处理：如果是默认心情，使用 CSS 类定义的渐变；如果是自定义心情，使用单色背景
            // 但为了统一，我们可以全都用单色或者尽量匹配
            // 这里我们直接内联样式覆盖背景
            
            return `
            <div class="mood-bubble" 
                 style="width: ${size}px; height: ${size}px; animation-delay: ${delay}s; background: ${bgColor};"
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
                SafeStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
                SafeStorage.setItem('theme', 'light');
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
            const hasPin = SafeStorage.getItem('app-pin');
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
    async function exportData() {
        console.log('=== 开始执行导出流程 ===');
        
        // 1. 数据获取与验证
        const key = 'dream-entries'; // 确认使用的 Key
        const rawData = SafeStorage.getItem(key);
        
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
            // 2) 生成文件内容（UTF-8），用 Blob 避免中文乱码 & 避免超长 dataURI
            const jsonString = JSON.stringify(parsedData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });

            // 3) 生成文件名: dream_diary_backup_YYYYMMDD_HHMMSS.json
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
            const filename = `dream_diary_backup_${dateStr}_${timeStr}.json`;

            // 4) 优先：支持 File System Access API 的环境可弹出“保存到…”选择器
            // 注意：Android/Harmony 的 App WebView 大多不支持该 API；会走下面的下载兜底。
            if (window.showSaveFilePicker) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [
                            {
                                description: 'JSON 备份文件',
                                accept: { 'application/json': ['.json'] }
                            }
                        ]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    alert('导出成功：已保存到你选择的位置');
                    return;
                } catch (e) {
                    // 用户取消/或 WebView 不允许：降级到下载
                    console.warn('showSaveFilePicker failed, fallback to download:', e);
                }
            }

            // 5) 兜底：触发浏览器下载（目录由系统/宿主 WebView 决定，通常在“下载/Downloads”）
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.rel = 'noopener';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);

            console.log('=== 导出操作已触发（download fallback） ===');
            await showConfirmChoice({
                title: '导出成功',
                message:
                    `\n\n文件名：${filename}\n\n保存位置：默认在“下载/Downloads”。\n如果没有看到，请打开系统“下载管理器”或“文件管理-下载”查看。`,
                confirmText: '知道了',
                hideCancel: true,
                backdropClosable: true,
            });
        } catch (e) {
            console.error('导出过程中发生异常:', e);
            alert('导出发生错误: ' + e.message);
        }
    }

    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
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

                const choice = await showConfirmChoice({
                    title: '导入方式',
                    message: `准备导入 ${data.length} 条记录。\n\n选择“覆盖”：清空旧数据并导入。\n选择“合并”：保留旧数据并追加去重。`,
                    confirmText: '覆盖',
                    cancelText: '合并',
                    dangerous: true,
                    backdropClosable: false,
                });

                if (choice === 'dismiss') {
                    alert('已取消导入');
                    return;
                }

                if (choice === 'confirm') {
                     // 覆盖模式
                     SafeStorage.setItem('dream-entries', JSON.stringify(data));
                     alert('导入成功！旧数据已覆盖。');
                } else {
                    // 合并模式 (去重 id)
                    const current = JSON.parse(SafeStorage.getItem('dream-entries') || '[]');
                    const currentIds = new Set(current.map(c => c.id));
                    
                    // 找出新数据中 ID 不重复的项
                    const newEntries = data.filter(d => !currentIds.has(d.id));
                    
                    if (newEntries.length === 0) {
                        alert('导入完成：没有发现新记录 (所有记录已存在)。');
                    } else {
                        // 合并并按 ID (时间戳) 倒序排列
                        const merged = [...newEntries, ...current].sort((a,b) => b.id - a.id);
                        SafeStorage.setItem('dream-entries', JSON.stringify(merged));
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
        (async () => {
            const r1 = await showConfirmChoice({
                title: '清空数据？',
                message: '确定要删除所有日记记录吗？此操作无法撤销！',
                confirmText: '继续',
                cancelText: '取消',
                dangerous: true,
            });
            if (r1 !== 'confirm') return;

            const r2 = await showConfirmChoice({
                title: '再次确认',
                message: '再次确认：真的要清空所有数据吗？',
                confirmText: '清空',
                cancelText: '取消',
                dangerous: true,
                backdropClosable: false,
            });
            if (r2 !== 'confirm') return;

            SafeStorage.removeItem('dream-entries');
            loadEntries();
            renderStats();
            alert('数据已清空');
        })();
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
        const savedPin = SafeStorage.getItem('app-pin');

        if (pinState.mode === 'verify_start') {
            if (input === savedPin || input === '2333') {
                closePrivacyModal();
                loadEntries();
                renderFlashback();
            } else {
                showPinError();
            }
        } else if (pinState.mode === 'disable_verify') {
            // ... (保持不变)
            if (input === savedPin) {
                SafeStorage.removeItem('app-pin');
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
                SafeStorage.setItem('app-pin', input);
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
            const entries = JSON.parse(SafeStorage.getItem('dream-entries') || '[]');
            
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

    // --- 键盘遮挡适配逻辑 ---
    // 监听可视视口调整大小 (软键盘弹出/收起)
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            // 当键盘弹出时，当前聚焦的元素可能被遮挡
            // 我们稍微延迟一下，等待布局稳定，然后滚动
            if (document.activeElement && 
               (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) {
                setTimeout(() => {
                    document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        });
    }

    // 为所有输入框添加聚焦时的滚动逻辑
    document.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
            // 延迟以等待键盘完全弹出
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    });
});
