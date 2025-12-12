const CACHE_NAME = 'dream-journal-v7'; // 更新版本号
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json'
];

// 安装事件：缓存资源
self.addEventListener('install', (event) => {
    // 强制立即进入 waiting 状态
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', (event) => {
    // 立即接管所有页面
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

// Fetch 事件：网络优先或缓存优先策略
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 如果缓存中有，直接返回缓存
                if (response) {
                    return response;
                }
                // 否则发起网络请求
                return fetch(event.request);
            })
    );
});
