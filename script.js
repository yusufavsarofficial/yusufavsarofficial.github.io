// =================================================================================
// STATE MANAGEMENT
// =================================================================================

const appState = {
  isAuthenticated: false,
  currentUser: null,
  currentData: [],
  currentPage: 'dashboard',
  isLoading: false,
  searchQuery: '',
  activeFilters: {}, // { status: ['Aktif'], priority: ['Yüksek'] }
  searchDebounceTimer: null,
  defaultSortBy: 'date', // 'date', 'priority', 'title'
  defaultFilter: 'all', // 'all', 'Aktif', etc.
  theme: 'light', // 'light' or 'dark'
  itemsPerPage: 10,
  chartInstances: {},
  welcomeTourStep: 1,
  moduleTableListener: null,
};

const defaultConfig = {
  company_name: 'AyfSoft',
  dashboard_title: 'ERP Yönetim Paneli',
  welcome_message: 'Hoş Geldiniz',
  primary_bg: '#0f172a',
  secondary_bg: '#1e293b',
  surface_bg: '#ffffff',
  text_color: '#1e293b',
  primary_action: '#3b82f6',
  primary_action_rgb: '59, 130, 246',
  // Dark theme colors
  dark_primary_bg: '#0f172a',
  dark_secondary_bg: '#1e293b',
  dark_surface_bg: '#111827',
  dark_text_color: '#f9fafb',
  secondary_action: '#10b981',
  font_family: 'Inter',
  font_size: 16
};

const CONSTANTS = {
  APP_ID: 'app',
  SIDEBAR_ID: 'sidebar',
  TOPBAR_ID: 'topbar',
  MAIN_CONTENT_ID: 'main-content',
  PAGE_CONTENT_ID: 'page-content',
  ADD_MODAL_ID: 'add-modal',
  EDIT_MODAL_ID: 'edit-modal',
  CONFIRM_MODAL_ID: 'confirm-modal',
  DETAIL_MODAL_ID: 'detail-modal',
  WELCOME_MODAL_ID: 'welcome-modal',
  SUBMIT_BTN_ID: 'submit-btn',
  EDIT_SUBMIT_BTN_ID: 'edit-submit-btn',
  CONFIRM_DELETE_BTN_ID: 'confirm-delete-btn',
  GLOBAL_SEARCH_RESULTS_ID: 'global-search-results',
  MODULE_CHART_ID: 'module-chart',
  STATUS_CHART_ID: 'status-chart',
  PRIORITY_CHART_ID: 'priority-chart',
  MODULE_STATUS_CHART_ID_PREFIX: 'module-status-chart-',
  MODULE_PRIORITY_CHART_ID_PREFIX: 'module-priority-chart-',
};

const WELCOME_TOUR_STEPS = [
    {
        title: 'AyfSoft ERP Sistemine Hoş Geldiniz!',
        content: 'Bu hızlı tur, uygulamanın temel özelliklerini keşfetmenize yardımcı olacaktır. Başlamak için "İleri" butonuna tıklayın.'
    },
    {
        title: 'Modüler Yapı',
        content: 'Sol taraftaki kenar çubuğu, Personel, Stok, Finans gibi tüm iş yönetimi modüllerinize hızlı erişim sağlar. İlgili modüle gitmek için üzerine tıklamanız yeterlidir.'
    },
    {
        title: 'Kişiselleştirilebilir Arayüz',
        content: 'Sağ üst köşedeki ay ve güneş ikonları ile uygulama temasını Açık ve Koyu mod arasında anında değiştirebilirsiniz. Göz zevkinize en uygun olanı seçin!'
    },
    {
        title: 'Gelişmiş Raporlama',
        content: 'Raporlar sayfası, verilerinizi interaktif grafiklerle görselleştirir. İşletmenizin genel durumu hakkında bir bakışta bilgi edinin.'
    },
    {
        title: 'Her Şey Hazır!',
        content: 'Artık sistemi kullanmaya hazırsınız. Verilerinizi yönetmeye başlamak için "Turu Bitir" butonuna tıklayın.'
    }
];

const USERS = [
  {
    username: 'yusufavsar@ayfsoft.com',
    password: '1234123',
    name: 'Yusuf Avşar',
    initials: 'YA',
    role: 'Proje Yöneticisi'
  },
  {
    username: 'demo@ayfsoft.com',
    password: 'demo',
    name: 'Demo Kullanıcı',
    initials: 'DK',
    role: 'Kullanıcı'
  }
];

const USER_PERMISSIONS = {
    'Proje Yöneticisi': {
        canView: ['dashboard', 'personel', 'stok', 'finans', 'satis', 'satin-alma', 'uretim', 'musteri', 'proje', 'raporlar', 'ayarlar'],
        canManage: ['personel', 'stok', 'finans', 'satis', 'satin-alma', 'uretim', 'musteri', 'proje'], // Can add/edit/delete
        canExport: true,
        canChangeSettings: true,
    },
    'Kullanıcı': {
        canView: ['dashboard', 'personel', 'stok', 'satis', 'proje', 'raporlar'],
        canManage: [], // No add/edit/delete for 'Kullanıcı'
        canExport: false,
        canChangeSettings: false,
    }
};

function hasAccess(action, module = null) {
    if (!appState.isAuthenticated || !appState.currentUser) return false;
    const userRole = appState.currentUser.role;
    const permissions = USER_PERMISSIONS[userRole];
    if (!permissions) return false;
    if (action === 'view') return permissions.canView.includes(module);
    if (action === 'manage') return permissions.canManage.includes(module);
    if (action === 'export') return permissions.canExport;
    if (action === 'changeSettings') return permissions.canChangeSettings;
    return false;
}
// =================================================================================
// SDK & DATA HANDLING
// =================================================================================

const dataHandler = {
  onDataChanged(data) {
    appState.currentData = data;
    renderCurrentPage();
  }
};

function renderSidebar(config) {
  const { company_name } = { ...defaultConfig, ...config };
  const {
    font_size: baseFont,
    font_family: customFont,
    company_name: companyName,
    dashboard_title: dashboardTitle,
    welcome_message: welcomeMessage,
    primary_bg: primaryBg,
    secondary_bg: secondaryBg,
    surface_bg: surfaceBg,
    text_color: textColor,
    primary_action: primaryAction,
    secondary_action: secondaryAction
  } = { ...defaultConfig, ...config };
  
  const navItems = [
    { page: 'dashboard', label: 'Dashboard', icon: '📊' },
    { page: 'personel', label: 'Personel Yönetimi', icon: '👥' },
    { page: 'stok', label: 'Stok & Envanter', icon: '📦' },
    { page: 'finans', label: 'Finans & Muhasebe', icon: '💰' },
    { page: 'satis', label: 'Satış Yönetimi', icon: '🛒' },
    { page: 'satin-alma', label: 'Satın Alma', icon: '🛍️' },
    { page: 'uretim', label: 'Üretim Planlama', icon: '🏭' },
    { page: 'musteri', label: 'Müşteri İlişkileri', icon: '🤝' },
    { page: 'proje', label: 'Proje Yönetimi', icon: '📋' },
    { page: 'raporlar', label: 'Raporlar & Analiz', icon: '📈' },
    { page: 'ayarlar', label: 'Ayarlar', icon: '⚙️' }
  ];

  // Filter navItems based on user permissions
  const accessibleNavItems = navItems.filter(item => hasAccess('view', item.page));

  return `
    <aside id="${CONSTANTS.SIDEBAR_ID}" class="sidebar w-64 text-white p-6 flex flex-col h-full">
      <div class="mb-8">
        <h1 class="company-name font-bold text-white">${company_name}</h1>
        <p class="text-label text-blue-300 mt-1">Kurumsal ERP Sistemi</p>
      </div>
      <nav class="sidebar-nav flex-1 space-y-2 overflow-y-auto pr-2 -mr-2">
        ${accessibleNavItems.map(item => `
          <div data-action="navigate" data-page="${item.page}" class="sidebar-item px-4 py-3 rounded-lg cursor-pointer hover:bg-slate-700">
            <span>${item.icon} ${item.label}</span>
          </div>
        `).join('')}
      </nav>
      <nav class="mt-4 pt-4 border-t border-slate-700">
        <div data-action="logout" class="sidebar-item px-4 py-3 rounded-lg cursor-pointer hover:bg-slate-700">
            <span>
                🚪 Çıkış Yap
            </span>
        </div>
      </nav>
    </aside>
  `;
}

/**
 * Renders the top bar component.
 */
function renderTopbar(config) {
  const { dashboard_title, welcome_message } = { ...defaultConfig, ...config };
  const themeIcon = appState.theme === 'light' ? '🌙' : '☀️';
  const currentUser = appState.currentUser;

  return `
    <header id="${CONSTANTS.TOPBAR_ID}" class="topbar p-4 flex justify-between items-center">
      <div class="flex items-center gap-4">
        <h2 id="dashboard-title" class="text-subheader font-semibold">${dashboard_title}</h2>
        <div class="relative">
          <input type="text" id="global-search" placeholder="🔍 Tüm modüllerde ara..." class="search-input w-64 px-4 py-2 rounded-lg text-gray-800 text-sm" oninput="handleGlobalSearch(event)" autocomplete="off" />
          <div id="${CONSTANTS.GLOBAL_SEARCH_RESULTS_ID}" class="search-results-container absolute top-full left-0 w-full mt-2"></div>
        </div>
      </div>
      <div class="flex items-center gap-5">
        <div data-action="show-notifications" class="relative cursor-pointer">
          <span class="text-2xl">🔔</span>
          <div class="notification-dot"></div>
        </div>
        <div id="theme-toggle" data-action="toggle-theme" class="cursor-pointer text-xl">
          ${themeIcon}
        </div>
        <div id="welcome-message" class="text-right leading-tight">
          <div class="font-semibold">${currentUser?.name || ''}</div>
          <div class="text-xs text-gray-400">${currentUser?.role || ''}</div>
        </div>
        <div data-action="show-profile" class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold cursor-pointer">
          ${currentUser?.initials || 'A'}
        </div>
      </div>
    </header>
  `;
}

// =================================================================================
// RENDER FUNCTIONS (UI)
// =================================================================================

/**
 * Renders the main application layout.
 */
function renderApp() {
  const config = window.elementSdk?.config || defaultConfig;
  const app = document.getElementById(CONSTANTS.APP_ID);

  if (!appState.isAuthenticated) {
    app.innerHTML = renderLoginScreen();
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    return;
  }
  
  app.innerHTML = `
    <div class="w-full h-screen flex">
      ${renderSidebar(config)}
      <div class="flex-1 flex flex-col h-screen">
        ${renderTopbar(config)}
        <main id="${CONSTANTS.MAIN_CONTENT_ID}" class="main-content flex-1 p-6 overflow-y-auto">
          <div id="${CONSTANTS.PAGE_CONTENT_ID}"></div>
        </main>
      </div>
    </div>
  `;

  renderCurrentPage();
}

/**
 * Renders the login screen.
 */
function renderLoginScreen() {
    const config = window.elementSdk?.config || defaultConfig;
    return `
        <div class="login-container">
            <div class="login-form">
                <div class="text-center mb-8">
                    <h1 class="company-name font-bold text-3xl">${config.company_name}</h1>
                    <p class="text-label mt-2">Lütfen giriş yapın</p>
                </div>
                <form id="login-form">
                    <div id="login-error-message" class="mb-4"></div>
                    <div class="mb-4">
                        <label for="username" class="block font-medium mb-2">Kullanıcı Adı</label>
                        <input type="email" id="username" name="username" required class="form-input w-full px-4 py-3 border-2 border-gray-300 rounded-lg" value="yusufavsar@ayfsoft.com" />
                    </div>
                    <div class="mb-6">
                        <label for="password" class="block font-medium mb-2">Şifre</label>
                        <input type="password" id="password" name="password" required class="form-input w-full px-4 py-3 border-2 border-gray-300 rounded-lg" value="1234123" />
                    </div>
                    <button type="submit" class="btn-primary w-full text-white font-bold py-3 px-4 rounded-lg">
                        Giriş Yap
                    </button>
                </form>
            </div>
        </div>
    `;
}
/**
 * Renders the content for the current page.
 */
function renderCurrentPage() {
  const content = document.getElementById(CONSTANTS.PAGE_CONTENT_ID);
  if (!content) return;

  const pages = {
    dashboard: renderDashboard,
    personel: () => renderModule('Personel Yönetimi', 'personel', '👥'),
    stok: () => renderModule('Stok & Envanter', 'stok', '📦'),
    finans: () => renderModule('Finans & Muhasebe', 'finans', '💰'),
    satis: () => renderModule('Satış Yönetimi', 'satis', '🛒'),
    'satin-alma': () => renderModule('Satın Alma', 'satin-alma', '🛍️'),
    uretim: renderUretimPage,
    musteri: renderCrmPage,
    proje: renderProjePage,
    raporlar: renderReports,
    ayarlar: renderSettingsPage
  };

  const renderFunction = pages[appState.currentPage] || renderDashboard;
  content.innerHTML = renderFunction();

  // Apply theme-specific text content
  applyThemeStyles();

  // Destroy old charts before rendering new ones or navigating away
  destroyCharts();

  // If on the reports page, initialize the charts
  if (appState.currentPage === 'raporlar' && typeof Chart !== 'undefined') {
    initReportCharts();
  } 
  // If on a module page, initialize module charts
  else if (appState.currentPage !== 'dashboard' && appState.currentPage !== 'raporlar' && typeof Chart !== 'undefined') {
    initModuleCharts(appState.currentPage);
  }

  updateActiveSidebarItem();
}

/**
 * Updates the active state in the sidebar.
 */
function updateActiveSidebarItem() {
    const { currentPage } = appState;
    
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active-page');
    });

    const activeItem = document.querySelector(`.sidebar-item[data-page="${currentPage}"]`);
    if (activeItem) {
        activeItem.classList.add('active-page');
    }
}

/**
 * Destroys all active chart instances to prevent memory leaks.
 */
function destroyCharts() {
    Object.values(appState.chartInstances).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
    appState.chartInstances = {};
}

/**
 * Toggles the color theme between light and dark.
 */
function toggleTheme() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('erp-theme', appState.theme);
    
    // Update the icon
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.innerHTML = appState.theme === 'light' ? '🌙' : '☀️';
    }
    
    document.body.dataset.theme = appState.theme;
    applyThemeStyles(); // Update chart colors and other JS-driven styles
}

/**
 * Applies the current theme's colors to all relevant elements.
 */
function applyThemeStyles(config) {
    const currentConfig = config || window.elementSdk?.config || defaultConfig;
    const isDark = appState.theme === 'dark';

    document.body.dataset.theme = isDark ? 'dark' : 'light';

    document.documentElement.style.setProperty('--primary-bg', isDark ? currentConfig.dark_primary_bg : currentConfig.primary_bg);
    document.documentElement.style.setProperty('--secondary-bg', isDark ? currentConfig.dark_secondary_bg : currentConfig.secondary_bg);
    document.documentElement.style.setProperty('--surface-bg', isDark ? currentConfig.dark_surface_bg : currentConfig.surface_bg);
    document.documentElement.style.setProperty('--text-color', isDark ? currentConfig.dark_text_color : currentConfig.text_color);
    document.documentElement.style.setProperty('--primary-action-rgb', currentConfig.primary_action_rgb);

    document.querySelectorAll('.company-name').forEach(el => el.textContent = currentConfig.company_name);
    const dashboardTitleEl = document.getElementById('dashboard-title');
    if (dashboardTitleEl) dashboardTitleEl.textContent = currentConfig.dashboard_title;
    const welcomeEl = document.getElementById('welcome-message');
    if (welcomeEl && appState.currentUser) {
      welcomeEl.innerHTML = `
        <div class="font-semibold">${appState.currentUser.name || ''}</div>
        <div class="text-xs text-gray-400">${appState.currentUser.role || ''}</div>
      `;
    }

    // Update Chart.js global defaults for the new theme
    if (typeof Chart !== 'undefined') {
        const chartTextColor = isDark ? defaultConfig.dark_text_color : defaultConfig.text_color;
        Chart.defaults.color = chartTextColor;
        Chart.defaults.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    }
}

/**
 * Renders a single statistic card component for the dashboard.
 */
function renderStatCard(config, { label, value, trend, icon }) {
    return `
        <div class="stat-card p-6 rounded-xl shadow-md">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-label mb-2">${label}</p>
                    <p class="stat-value font-bold">${value}</p>
                    ${trend ? `<p class="text-small ${trend.color} mt-1">${trend.text}</p>` : ''}
                </div>
                <div class="stat-icon">${icon}</div>
            </div>
        </div>
    `;
}

/**
 * Renders a single quick action button for the dashboard.
 */
function renderQuickActionButton(config, { page, icon, label }) {
    return `
        <button 
            class="btn-primary p-4 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all"
            data-action="navigate" data-page="${page}"
        >
            <div class="text-2xl mb-2">${icon}</div>
            <div>${label}</div>
        </button>
    `;
}


function renderDashboard() {
  const config = { ...defaultConfig, ...(window.elementSdk?.config || {}) };

  const { currentData } = appState;

  const moduleData = {
    personel: currentData.filter(d => d.module === 'personel').length,
    stok: currentData.filter(d => d.module === 'stok').length,
    finans: currentData.filter(d => d.module === 'finans').reduce((sum, d) => sum + (d.amount || 0), 0),
    satis: currentData.filter(d => d.module === 'satis').length,
    proje: currentData.filter(d => d.module === 'proje').length,
    musteri: currentData.filter(d => d.module === 'musteri').length,
  };

  const highPriorityTasks = currentData.filter(d => d.priority === 'Yüksek' && d.status !== 'Tamamlandı').length;
  const pendingTasks = currentData.filter(d => d.status === 'Beklemede').length;

  const upcomingTasks = currentData
    .filter(item => item.deadline && item.status !== 'Tamamlandı')
    .map(item => ({
      ...item,
      daysLeft: getDaysUntil(item.deadline)
    }))
    .sort((a, b) => {
        // Süresi dolanları en üste al, sonra yaklaşanları sırala
        if (a.daysLeft.isOverdue && !b.daysLeft.isOverdue) return -1;
        if (!a.daysLeft.isOverdue && b.daysLeft.isOverdue) return 1;
        return a.daysLeft.days - b.daysLeft.days;
    })
    .slice(0, 5);


  const statCards = [
    { label: 'Toplam Personel', value: moduleData.personel, trend: { text: '↑ Aktif durumda', color: 'text-green-600' }, icon: '👥' },
    { label: 'Stok Kalemleri', value: moduleData.stok, trend: { text: 'Envanterde', color: 'text-blue-600' }, icon: '📦' },
    { label: 'Toplam Ciro', value: `₺${moduleData.finans.toLocaleString('tr-TR')}`, trend: { text: 'Bu ay', color: 'text-green-600' }, icon: '💰' },
    { label: 'Aktif Projeler', value: moduleData.proje, trend: { text: `${highPriorityTasks} öncelikli`, color: 'text-orange-600' }, icon: '📋' }
  ];

  const quickActions = [
    { page: 'personel', icon: '👤', label: 'Yeni Personel' },
    { page: 'stok', icon: '📦', label: 'Ürün Ekle' },
    { page: 'satis', icon: '🛒', label: 'Yeni Sipariş' },
    { page: 'raporlar', icon: '📊', label: 'Rapor Görüntüle' }
  ];

  return `
    <div>
      <h1 class="text-header font-bold mb-6">Dashboard - Genel Bakış</h1>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        ${statCards.map(card => renderStatCard(config, card)).join('')}
      </div>

      <!-- Alerts & Quick Stats -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="alert-card alert-card-urgent">
          <h3 class="alert-card-title">⚠️ Acil Görevler</h3>
          <p class="alert-card-value">${highPriorityTasks}</p>
          <p class="alert-card-label">Yüksek öncelikli görev bekliyor</p>
        </div>

        <div class="alert-card alert-card-pending">
          <h3 class="alert-card-title">⏳ Bekleyen İşler</h3>
          <p class="alert-card-value">${pendingTasks}</p>
          <p class="alert-card-label">Beklemede olan kayıt</p>
        </div>

        <div class="alert-card alert-card-customer">
          <h3 class="alert-card-title">👥 Müşteri Tabanı</h3>
          <p class="alert-card-value">${moduleData.musteri}</p>
          <p class="alert-card-label">Kayıtlı müşteri</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="mb-8">
        <h2 class="text-subheader font-semibold mb-4">⚡ Hızlı İşlemler</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${quickActions.map(action => renderQuickActionButton(config, action)).join('')}
        </div>
      </div>

      <!-- Upcoming Tasks -->
      ${renderUpcomingTasks(upcomingTasks, config)}

      <!-- Recent Activity -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-subheader font-semibold">📝 Son Aktiviteler</h2>
          <button data-action="export-data" class="export-btn btn-cancel px-4 py-2 rounded-lg font-medium text-sm" ${!hasAccess('export') ? 'style="display:none;"' : ''}>
            📥 Dışa Aktar
          </button>
        </div>
        <div class="stat-card rounded-xl shadow-md p-6">
          ${currentData.length === 0 ? `
            <div class="text-center py-8">
              <span class="text-5xl">📋</span>
              <p class="mt-4 text-muted">Henüz aktivite bulunmuyor</p>
              <p class="mt-2 text-label text-sm">Modüllerden işlem yapmaya başlayın!</p>
            </div>
          ` : `
            <div class="space-y-3">
              ${currentData.slice(-8).reverse().map(item => `
                <div class="recent-activity-item flex items-center justify-between p-4 rounded-lg transition-all hover:shadow-md">
                  <div class="flex items-center gap-4 flex-1">
                    <span class="text-2xl">${getModuleIcon(item.module)}</span>
                    <div class="flex-1">
                      <p class="font-medium">${item.title}</p>
                      <div class="flex items-center gap-3 mt-1">
                        <span class="text-small text-muted">${getModuleName(item.module)}</span>
                        <span class="text-small text-label">•</span>
                        <span class="text-small text-muted">${new Date(item.createdAt).toLocaleDateString('tr-TR')}</span>
                        ${item.assignee ? `
                          <span class="text-small text-label">•</span>
                          <span class="text-small text-muted">👤 ${item.assignee}</span>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    ${item.priority ? `<span class="badge badge-${item.priority === 'Yüksek' ? 'high' : item.priority === 'Orta' ? 'medium' : 'low'}">${item.priority}</span>` : ''}
                    <span class="status-badge status-badge-${(item.status || 'Aktif').toLowerCase()}">${item.status || 'Aktif'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders the upcoming tasks component for the dashboard.
 */
function renderUpcomingTasks(tasks, config) {
    if (tasks.length === 0) {
        return ''; // Eğer görev yoksa bu bölümü hiç gösterme
    }

    return `
      <div class="mb-8">
        <h2 class="text-subheader font-semibold mb-4">🗓️ Yaklaşan Görevler</h2>
        <div class="stat-card rounded-xl shadow-md p-6">
          <div class="space-y-4">
            ${tasks.map(task => {
                const { text, isOverdue, isDueSoon } = task.daysLeft;
                let taskClass = 'task-calendar-item';
                if (isOverdue) taskClass += ' task-overdue';
                if (isDueSoon) taskClass += ' task-due-soon';

                return `
                  <div class="${taskClass} p-3 rounded-lg cursor-pointer" data-action="navigate" data-page="${task.module}">
                    <div class="flex items-center justify-between">
                      <div class="flex-1">
                        <p class="font-medium">${task.title}</p>
                        <div class="flex items-center gap-3 mt-1">
                          <span class="text-small text-muted">${getModuleIcon(task.module)} ${getModuleName(task.module)}</span>
                          <span class="text-small text-label">•</span>
                          <span class="text-small text-muted">Son Tarih: ${new Date(task.deadline).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      <div class="text-right ml-4">
                        <p class="task-days-left font-medium text-sm">${text}</p>
                      </div>
                    </div>
                  </div>
                `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
}

function renderSearchResultsDropdown(results) {
  const container = document.getElementById(CONSTANTS.GLOBAL_SEARCH_RESULTS_ID);
  if (!container) return;

  if (results.length === 0) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  container.style.display = 'block';
  container.innerHTML = `
    <div class="p-2 text-sm text-gray-500">${results.length} sonuç bulundu</div>
    ${results.slice(0, 10).map(item => `
      <div class="search-result-item p-3 flex items-center gap-3" data-action="navigate-search-result" data-module="${item.module}">
        <span class="text-lg">${getModuleIcon(item.module)}</span>
        <div>
          <p class="font-medium text-gray-800">${item.title}</p>
          <p class="text-xs text-gray-500">${getModuleName(item.module)}</p>
        </div>
      </div>
    `).join('')}
    ${results.length > 10 ? `<div class="p-2 text-center text-xs text-gray-400">... ve ${results.length - 10} daha fazla sonuç</div>` : ''}
  `;
}

function hideSearchResults() {
    const container = document.getElementById(CONSTANTS.GLOBAL_SEARCH_RESULTS_ID);
    if (container) container.style.display = 'none';
}


function renderModule(title, moduleType, icon) {
  const config = { ...defaultConfig, ...(window.elementSdk?.config || {}) };
  const canManageModule = hasAccess('manage', moduleType);
  const { activeFilters } = appState;

  const totalItemCount = appState.currentData.filter(d => d.module === moduleType).length;

  const moduleItems = appState.currentData.filter(d => d.module === moduleType);
  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);
  const priorityFiltersAvailable = moduleItems.some(item => item.priority);

  const statusCounts = {
    'Aktif': moduleItems.filter(d => d.status === 'Aktif').length,
    'Beklemede': moduleItems.filter(d => d.status === 'Beklemede').length,
    'Tamamlandı': moduleItems.filter(d => d.status === 'Tamamlandı').length,
  };

  return `
    <div>
      <!-- Module Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <span class="text-4xl">${icon}</span>
          <div>
            <h1 class="text-header font-bold">${title}</h1>
            <p class="text-label">${totalItemCount} kayıt bulundu</p>
          </div>
        </div>
        ${canManageModule ? `
          <button data-action="open-add-modal" data-module-type="${moduleType}" class="btn-primary px-6 py-3 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all">
            + Yeni Ekle
          </button>
        ` : ''}
      </div>

      <!-- Main Layout Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Main Content: Table and Filters -->
        <div class="lg:col-span-8 space-y-6">
          <!-- Filters & Search -->
          <div class="stat-card p-4 rounded-xl space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p class="text-small text-label mb-2">FİLTRELER</p>
                <div class="flex gap-2">
                  <span data-action="filter" data-type="status" data-value="Aktif" class="filter-chip text-sm ${activeFilters.status?.includes('Aktif') ? 'active' : ''}">Aktif</span>
                  <span data-action="filter" data-type="status" data-value="Beklemede" class="filter-chip text-sm ${activeFilters.status?.includes('Beklemede') ? 'active' : ''}">Beklemede</span>
                  <span data-action="filter" data-type="status" data-value="Tamamlandı" class="filter-chip text-sm ${activeFilters.status?.includes('Tamamlandı') ? 'active' : ''}">Tamamlandı</span>
                </div>
              </div>
              ${hasActiveFilters ? `
                <button data-action="clear-filters" class="btn-cancel text-sm px-3 py-1">Filtreleri Temizle</button>
              ` : ''}
            </div>
            ${priorityFiltersAvailable ? `
              <div class="flex flex-wrap items-center gap-4">
                <div>
                  <div class="flex gap-2">
                    <span data-action="filter" data-type="priority" data-value="Yüksek" class="filter-chip text-sm ${activeFilters.priority?.includes('Yüksek') ? 'active' : ''}">Yüksek Öncelik</span>
                    <span data-action="filter" data-type="priority" data-value="Orta" class="filter-chip text-sm ${activeFilters.priority?.includes('Orta') ? 'active' : ''}">Orta Öncelik</span>
                    <span data-action="filter" data-type="priority" data-value="Düşük" class="filter-chip text-sm ${activeFilters.priority?.includes('Düşük') ? 'active' : ''}">Düşük Öncelik</span>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Data Table Container -->
          <div id="module-table-container" class="stat-card rounded-xl shadow-md overflow-x-auto">
            <!-- This content will be dynamically inserted by updateModuleView -->
          </div>
        </div>

        <!-- Sidebar: Charts and Stats -->
        <div class="lg:col-span-4 space-y-6">
          <div class="stat-card rounded-xl shadow-md p-4">
              <h3 class="font-semibold mb-2 text-center text-sm">Hızlı Bakış</h3>
              <div class="space-y-2 text-sm">
                  <div class="flex justify-between p-2 rounded-lg bg-blue-50"><span>Aktif Kayıtlar:</span> <span class="font-bold text-blue-600">${statusCounts['Aktif']}</span></div>
                  <div class="flex justify-between p-2 rounded-lg bg-yellow-50"><span>Beklemede:</span> <span class="font-bold text-yellow-600">${statusCounts['Beklemede']}</span></div>
                  <div class="flex justify-between p-2 rounded-lg bg-green-50"><span>Tamamlananlar:</span> <span class="font-bold text-green-600">${statusCounts['Tamamlandı']}</span></div>
              </div>
          </div>
          <div class="stat-card rounded-xl shadow-md p-4">
              <h3 class="font-semibold mb-2 text-center text-sm">Durum Dağılımı</h3>
              <div class="module-chart-container relative">
                  <canvas id="${CONSTANTS.MODULE_STATUS_CHART_ID_PREFIX}${moduleType}"></canvas>
              </div>
          </div>
          <div class="stat-card rounded-xl shadow-md p-4">
              <h3 class="font-semibold mb-2 text-center text-sm">Öncelik Dağılımı</h3>
              <div class="module-chart-container relative">
                  <canvas id="${CONSTANTS.MODULE_PRIORITY_CHART_ID_PREFIX}${moduleType}"></canvas>
              </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateModuleView(moduleType, icon) {
    const container = document.getElementById('module-table-container');
    if (!container) return;
    const canManageModule = hasAccess('manage', moduleType);
    const { filteredItems, totalItems } = getFilteredData(moduleType);

    const rowHeight = 72; // Height of a single row in pixels
    const visibleItemCount = 20; // Number of items to render at a time
    const totalHeight = totalItems * rowHeight;

    let startIndex = 0;

    if (totalItems === 0) {
        container.innerHTML = `
            <div class="text-center py-16">
                <span class="text-6xl">${icon}</span>
                <p class="mt-4 text-muted text-lg">
                    ${appState.searchQuery || appState.activeFilter !== 'all' ? 'Filtreye uygun kayıt bulunamadı' : 'Henüz kayıt bulunmuyor'}
                </p>
                <p class="mt-2 text-label">
                    ${appState.searchQuery || appState.activeFilter !== 'all' ? 'Farklı bir filtre deneyin' : 'Yeni kayıt eklemek için yukarıdaki butonu kullanın'}
                </p>
            </div>
        `;
        return;
    }

    function renderVisibleRows(scrollTop) {
        const tbody = container.querySelector('tbody');
        if (!tbody) return;

        startIndex = Math.floor(scrollTop / rowHeight);
        const endIndex = Math.min(startIndex + visibleItemCount, totalItems);
        
        let html = '';
        for (let i = startIndex; i < endIndex; i++) {
            const item = filteredItems[i];
            const statusClass = (item.status || 'Aktif').toLowerCase();
            html += `
                <tr class="table-row hover:bg-gray-50 transition-colors" style="position: absolute; top: ${i * rowHeight}px; left: 0; right: 0; height: ${rowHeight}px;">
                    <td class="p-4">
                        <div class="font-medium">${item.title}</div>
                        ${item.assignee ? `<div class="text-muted text-sm mt-1">👤 ${item.assignee}</div>` : ''}
                    </td>
                    <td class="p-4 text-muted">
                        ${item.description ? `<div class="mb-1">${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}</div>` : '-'}
                        ${item.progress !== undefined ? `<div class="mt-2"><div class="progress-bar"><div class="progress-fill" style="width: ${item.progress}%;"></div></div><span class="text-xs text-gray-500">${item.progress}% tamamlandı</span></div>` : ''}
                    </td>
                    <td class="p-4">${item.priority ? `<span class="badge badge-${item.priority === 'Yüksek' ? 'high' : item.priority === 'Orta' ? 'medium' : 'low'}">${item.priority}</span>` : '-'}</td>
                    <td class="p-4"><span class="status-badge status-badge-${statusClass}">${item.status || 'Aktif'}</span></td>
                    <td class="p-4 text-muted">
                        ${new Date(item.createdAt).toLocaleDateString('tr-TR')}
                        ${item.deadline ? `<div class="text-xs text-orange-600 mt-1">⏰ ${new Date(item.deadline).toLocaleDateString('tr-TR')}</div>` : ''}
                    </td>
                    <td class="p-4 text-right space-x-2">
                        <button data-action="view" data-id="${item.__backendId}" class="action-btn action-btn-view px-3 py-2 rounded-lg font-medium">👁️</button>
                        ${canManageModule ? `<button data-action="edit" data-id="${item.__backendId}" class="action-btn action-btn-edit px-3 py-2 rounded-lg font-medium">✏️</button><button data-action="delete" data-id="${item.__backendId}" class="action-btn action-btn-delete px-3 py-2 rounded-lg font-medium">🗑️</button>` : ''}
                    </td>
                </tr>
            `;
        }
        tbody.innerHTML = html;
    }

    container.innerHTML = `
        <div class="virtual-scroll-wrapper">
            <div class="virtual-scroll-content" style="height: ${totalHeight}px;">
                <table class="w-full text-sm">
                    <thead class="table-header">
                        <tr>
                            <th class="text-left p-4 font-semibold">Başlık</th>
                            <th class="text-left p-4 font-semibold">Detaylar</th>
                            <th class="text-left p-4 font-semibold">Öncelik</th>
                            <th class="text-left p-4 font-semibold">Durum</th>
                            <th class="text-left p-4 font-semibold">Tarih</th>
                            <th class="text-right p-4 font-semibold">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
        <div class="p-4 text-center text-sm text-muted border-t border-gray-200">Toplam ${totalItems} kayıt gösteriliyor.</div>
    `;

    const scrollWrapper = container.querySelector('.virtual-scroll-wrapper');
    scrollWrapper.addEventListener('scroll', (e) => renderVisibleRows(e.target.scrollTop));
    renderVisibleRows(0); // Initial render
}

function renderProjePage() {
    const projects = appState.currentData.filter(d => d.module === 'proje');
    const canManage = hasAccess('manage', 'proje');

    // Calculate stats
    const totalProjects = projects.length;
    const ongoingProjects = projects.filter(p => p.status === 'Aktif').length;
    const completedProjects = projects.filter(p => p.status === 'Tamamlandı').length;
    const overdueProjects = projects.filter(p => p.deadline && new Date(p.deadline) < new Date() && p.status !== 'Tamamlandı').length;

    const statCards = [
        { label: 'Toplam Proje', value: totalProjects, icon: '📋' },
        { label: 'Devam Eden', value: ongoingProjects, icon: '⏳' },
        { label: 'Tamamlanan', value: completedProjects, icon: '✅' },
        { label: 'Süresi Dolan', value: overdueProjects, icon: '⚠️' }
    ];

    return `
        <div>
            <!-- Module Header -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <span class="text-4xl">📋</span>
                    <div>
                        <h1 class="text-header font-bold">Proje Yönetimi</h1>
                        <p class="text-label">${totalProjects} proje bulundu</p>
                    </div>
                </div>
                ${canManage ? `
                    <button data-action="open-add-modal" data-module-type="proje" class="btn-primary px-6 py-3 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all">
                        + Yeni Proje Ekle
                    </button>
                ` : ''}
            </div>

            <!-- Project Stats -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                ${statCards.map(card => `
                    <div class="stat-card p-6 rounded-xl shadow-md">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-label mb-1">${card.label}</p>
                                <p class="stat-value font-bold">${card.value}</p>
                            </div>
                            <div class="stat-icon text-gray-300">${card.icon}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Project List -->
            <div class="space-y-6">
                ${projects.length > 0 ? projects.map(p => renderProjectCard(p, canManage)).join('') : `
                    <div class="text-center py-16 stat-card rounded-xl">
                        <span class="text-6xl">📂</span>
                        <p class="mt-4 text-muted text-lg">Henüz proje bulunmuyor</p>
                        <p class="mt-2 text-label">Yeni bir proje ekleyerek başlayın.</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderProjectCard(project, canManage) {
    const daysLeft = getDaysUntil(project.deadline);
    const budgetUsage = project.budget ? (project.spent / project.budget) * 100 : 0;

    return `
        <div class="stat-card rounded-xl shadow-md p-6">
            <div class="flex flex-col md:flex-row gap-6">
                <!-- Left Side: Info -->
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-subheader font-bold hover:text-blue-500 cursor-pointer" data-action="view" data-id="${project.__backendId}">${project.title}</h3>
                        <div class="flex items-center gap-2">
                            <span class="status-badge status-badge-${(project.status || 'Aktif').toLowerCase()}">${project.status || 'Aktif'}</span>
                            ${project.priority ? `<span class="badge badge-${project.priority === 'Yüksek' ? 'high' : project.priority === 'Orta' ? 'medium' : 'low'}">${project.priority}</span>` : ''}
                        </div>
                    </div>
                    <p class="text-muted text-sm mb-4">${project.description}</p>
                    
                    <div class="text-sm space-y-3">
                        <div class="flex items-center gap-2"><strong class="w-28 text-label">Yönetici:</strong> <span>${project.assignee || '-'}</span></div>
                        <div class="flex items-center gap-2"><strong class="w-28 text-label">Son Tarih:</strong> <span class="${daysLeft.isOverdue ? 'text-red-500 font-semibold' : ''}">${project.deadline ? new Date(project.deadline).toLocaleDateString('tr-TR') : '-'} (${daysLeft.text})</span></div>
                    </div>
                </div>

                <!-- Right Side: Stats & Team -->
                <div class="w-full md:w-64 space-y-4">
                    <div>
                        <div class="flex justify-between items-center text-sm mb-1">
                            <span class="font-medium">İlerleme</span>
                            <span class="font-bold text-blue-500">${project.progress || 0}%</span>
                        </div>
                        <div class="progress-bar"><div class="progress-fill" style="width: ${project.progress || 0}%;"></div></div>
                    </div>
                    ${project.budget ? `
                    <div>
                        <div class="flex justify-between items-center text-sm mb-1">
                            <span class="font-medium">Bütçe Kullanımı</span>
                            <span class="text-muted">₺${(project.spent || 0).toLocaleString()} / ₺${project.budget.toLocaleString()}</span>
                        </div>
                        <div class="progress-bar"><div class="progress-fill bg-green-500" style="width: ${budgetUsage}%;"></div></div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function renderUretimPage() {
    const orders = appState.currentData.filter(d => d.module === 'uretim');
    const canManage = hasAccess('manage', 'uretim');

    // Calculate stats
    const totalOrders = orders.length;
    const inProduction = orders.filter(o => o.status === 'Üretimde').length;
    const completedToday = orders.filter(o => {
        if (o.status !== 'Tamamlandı') return false;
        const today = new Date();
        const completedDate = new Date(o.updatedAt);
        return today.toDateString() === completedDate.toDateString();
    }).length;

    const statCards = [
        { label: 'Toplam Üretim Emri', value: totalOrders, icon: '🏭' },
        { label: 'Aktif Üretimdeki', value: inProduction, icon: '⚙️' },
        { label: 'Bugün Tamamlanan', value: completedToday, icon: '✅' }
    ];

    const columns = ['Planlandı', 'Üretimde', 'Kalite Kontrol', 'Tamamlandı'];

    return `
        <div>
            <!-- Module Header -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <span class="text-4xl">🏭</span>
                    <div>
                        <h1 class="text-header font-bold">Üretim Planlama</h1>
                        <p class="text-label">${totalOrders} üretim emri</p>
                    </div>
                </div>
                ${canManage ? `
                    <button data-action="open-add-modal" data-module-type="uretim" class="btn-primary px-6 py-3 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all">
                        + Yeni Üretim Emri
                    </button>
                ` : ''}
            </div>

            <!-- Production Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                ${statCards.map(card => `
                    <div class="stat-card p-6 rounded-xl shadow-md">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-label mb-1">${card.label}</p>
                                <p class="stat-value font-bold">${card.value}</p>
                            </div>
                            <div class="stat-icon text-gray-300">${card.icon}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Production Kanban Board -->
            <div class="kanban-board">
                ${columns.map(column => `
                    <div class="kanban-column">
                        <div class="kanban-column-header">${column} (${orders.filter(o => o.status === column).length})</div>
                        <div class="kanban-cards-container space-y-3">
                            ${orders.filter(o => o.status === column).map(o => renderUretimCard(o, canManage)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderUretimCard(order, canManage) {
    return `
        <div class="kanban-card">
            <h4 class="font-bold mb-2">${order.title}</h4>
            <p class="text-sm text-blue-500 font-semibold mb-3">Miktar: ${order.quantity || 0}</p>
            <div class="text-xs text-muted space-y-2">
                <div class="flex items-center gap-2"><span>🏭</span><span>Üretim Hattı: ${order.assignee || '-'}</span></div>
                <div class="flex items-center gap-2"><span>📅</span><span>Bitiş Tarihi: ${order.deadline ? new Date(order.deadline).toLocaleDateString('tr-TR') : '-'}</span></div>
            </div>
        </div>
    `;
}

function renderCrmPage() {
    const customers = appState.currentData.filter(d => d.module === 'musteri');
    const canManage = hasAccess('manage', 'musteri');

    // Calculate stats
    const totalCustomers = customers.length;
    const activeDeals = customers.filter(c => c.status !== 'Kazanıldı' && c.status !== 'Kaybedildi').length;
    const totalWonValue = customers.filter(c => c.status === 'Kazanıldı').reduce((sum, c) => sum + (c.amount || 0), 0);

    const statCards = [
        { label: 'Toplam Müşteri', value: totalCustomers, icon: '👥' },
        { label: 'Aktif Fırsatlar', value: activeDeals, icon: '⏳' },
        { label: 'Kazanılan Tutar', value: `₺${totalWonValue.toLocaleString()}`, icon: '💰' }
    ];

    const columns = ['Potansiyel', 'İletişime Geçildi', 'Teklif Sunuldu', 'Kazanıldı', 'Kaybedildi'];

    return `
        <div>
            <!-- Module Header -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <span class="text-4xl">🤝</span>
                    <div>
                        <h1 class="text-header font-bold">Müşteri İlişkileri (CRM)</h1>
                        <p class="text-label">${totalCustomers} müşteri kaydı</p>
                    </div>
                </div>
                ${canManage ? `
                    <button data-action="open-add-modal" data-module-type="musteri" class="btn-primary px-6 py-3 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all">
                        + Yeni Müşteri Ekle
                    </button>
                ` : ''}
            </div>

            <!-- CRM Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                ${statCards.map(card => `
                    <div class="stat-card p-6 rounded-xl shadow-md">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-label mb-1">${card.label}</p>
                                <p class="stat-value font-bold">${card.value}</p>
                            </div>
                            <div class="stat-icon text-gray-300">${card.icon}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- CRM Kanban Board -->
            <div class="kanban-board">
                ${columns.map(column => `
                    <div class="kanban-column">
                        <div class="kanban-column-header">${column} (${customers.filter(c => c.status === column).length})</div>
                        <div class="kanban-cards-container space-y-3">
                            ${customers.filter(c => c.status === column).map(c => renderCrmCard(c, canManage)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderCrmCard(customer, canManage) {
    return `
        <div class="kanban-card">
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-bold">${customer.title}</h4>
                ${customer.priority ? `<span class="badge badge-${customer.priority === 'Yüksek' ? 'high' : customer.priority === 'Orta' ? 'medium' : 'low'}">${customer.priority}</span>` : ''}
            </div>
            <p class="text-sm text-blue-500 font-semibold mb-3">₺${(customer.amount || 0).toLocaleString()}</p>
            <div class="text-xs text-muted space-y-2">
                <div class="flex items-center gap-2">
                    <span>👤</span>
                    <span>${customer.assignee || '-'}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span>📞</span>
                    <span>Son İletişim: ${customer.lastContacted ? new Date(customer.lastContacted).toLocaleDateString('tr-TR') : 'Yok'}</span>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
                <button data-action="view" data-id="${customer.__backendId}" class="action-btn action-btn-view p-2 rounded-md text-xs">👁️</button>
                ${canManage ? `
                    <button data-action="edit" data-id="${customer.__backendId}" class="action-btn action-btn-edit p-2 rounded-md text-xs">✏️</button>
                    <button data-action="delete" data-id="${customer.__backendId}" class="action-btn action-btn-delete p-2 rounded-md text-xs">🗑️</button>
                ` : ''}
            </div>
        </div>
    `;
}

function renderReports() {
  const config = { ...defaultConfig, ...(window.elementSdk?.config || {}) };

  const { currentData } = appState;

  const moduleStats = {
    personel: currentData.filter(d => d.module === 'personel').length,
    stok: currentData.filter(d => d.module === 'stok').length,
    finans: currentData.filter(d => d.module === 'finans').length,
    satis: currentData.filter(d => d.module === 'satis').length,
    'satin-alma': currentData.filter(d => d.module === 'satin-alma').length,
    uretim: currentData.filter(d => d.module === 'uretim').length,
    musteri: currentData.filter(d => d.module === 'musteri').length,
    proje: currentData.filter(d => d.module === 'proje').length,
  };

  const statusStats = {
    'Aktif': currentData.filter(d => d.status === 'Aktif').length,
    'Beklemede': currentData.filter(d => d.status === 'Beklemede').length,
    'Tamamlandı': currentData.filter(d => d.status === 'Tamamlandı').length,
  };

  const priorityStats = {
    'Yüksek': currentData.filter(d => d.priority === 'Yüksek').length,
    'Orta': currentData.filter(d => d.priority === 'Orta').length,
    'Düşük': currentData.filter(d => d.priority === 'Düşük').length,
  };

  return `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-header font-bold">📈 Raporlar & Analiz</h1>
        <button data-action="export-data" class="export-btn btn-primary px-6 py-3 rounded-lg text-white font-medium shadow-md" ${!hasAccess('export') ? 'style="display:none;"' : ''}>
          📥 Raporu İndir
        </button>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <!-- Module Stats Bar Chart -->
        <div class="stat-card rounded-xl shadow-md p-6 xl:col-span-2">
          <h3 class="text-subheader font-semibold mb-4">📊 Modül Bazlı Kayıt Sayıları</h3>
          <div class="chart-container relative"><canvas id="${CONSTANTS.MODULE_CHART_ID}"></canvas></div>
        </div>

        <!-- Summary Stats -->
        <div class="stat-card rounded-xl shadow-md p-6">
          <h3 class="text-subheader font-semibold mb-4">📋 Genel Özet</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center p-4 rounded-lg" style="background: var(--surface-muted);">
              <span class="font-medium">Toplam Kayıt Sayısı</span>
              <span class="font-bold text-2xl text-blue-500">${currentData.length}</span>
            </div>
            <div class="flex justify-between items-center p-4 rounded-lg" style="background: var(--surface-muted);">
              <span class="font-medium">Aktif Modül Sayısı</span>
              <span class="font-bold text-2xl text-blue-500">${Object.values(moduleStats).filter(v => v > 0).length}</span>
            </div>
            <div class="flex justify-between items-center p-4 rounded-lg" style="background: var(--surface-muted);">
              <span class="font-medium">En Çok Kullanılan</span>
              <span class="font-bold text-lg text-blue-500">
                ${Object.entries(moduleStats).sort((a, b) => b[1] - a[1])[0]?.[0] ? getModuleName(Object.entries(moduleStats).sort((a, b) => b[1] - a[1])[0][0]) : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Status & Priority Analysis -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- Status Distribution Doughnut Chart -->
        <div class="stat-card rounded-xl shadow-md p-6">
          <h3 class="text-subheader font-semibold mb-4">📌 Durum Dağılımı</h3>
          <div class="chart-container relative"><canvas id="${CONSTANTS.STATUS_CHART_ID}"></canvas></div>
        </div>

        <!-- Priority Distribution Doughnut Chart -->
        <div class="stat-card rounded-xl shadow-md p-6">
          <h3 class="text-subheader font-semibold mb-4">🎯 Öncelik Dağılımı</h3>
          <div class="chart-container relative"><canvas id="${CONSTANTS.PRIORITY_CHART_ID}"></canvas></div>
        </div>
      </div>
    </div>
  `;
}

function renderSettingsPage() {
    const isDark = appState.theme === 'dark';

    if (!hasAccess('changeSettings')) {
        return `
            <div class="text-center py-16 stat-card rounded-xl shadow-md p-6">
                <span class="text-6xl">🚫</span>
                <p class="mt-4 text-muted text-lg">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
                <p class="mt-2 text-label">Lütfen yöneticinizle iletişime geçin.</p>
            </div>
        `;
    }

    return `
        <div>
            <h1 class="text-header font-bold mb-6">⚙️ Uygulama Ayarları</h1>

            <div class="space-y-8 max-w-3xl">
                <!-- Display Settings -->
                <div class="stat-card rounded-xl shadow-md p-6">
                    <h2 class="text-subheader font-semibold mb-4">Görünüm Ayarları</h2>
                    <div class="flex items-center justify-between">
                        <label for="theme-select" class="font-medium">Uygulama Teması</label>
                        <div class="flex items-center gap-2 p-1 rounded-full bg-surface-muted">
                            <button data-action="set-theme" data-theme="light" class="px-4 py-2 rounded-full transition-colors ${!isDark ? 'shadow-md bg-surface' : 'bg-transparent'}">☀️ Açık</button>
                            <button data-action="set-theme" data-theme="dark" class="px-4 py-2 rounded-full transition-colors ${isDark ? 'shadow-md bg-surface' : 'bg-transparent'}">🌙 Koyu</button>
                        </div>
                    </div>
                </div>

                <!-- Default Filter/Sort Settings -->
                <div class="stat-card rounded-xl shadow-md p-6">
                    <h2 class="text-subheader font-semibold mb-4">Varsayılan Tercihler</h2>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <label for="default-sort" class="font-medium">Modül Varsayılan Sıralama</label>
                            <select id="default-sort" data-action="change-setting" data-key="defaultSortBy" class="px-4 py-2 rounded-lg border-2 bg-transparent border-surface-border">
                                <option value="date" ${appState.defaultSortBy === 'date' ? 'selected' : ''}>Tarihe göre</option>
                                <option value="priority" ${appState.defaultSortBy === 'priority' ? 'selected' : ''}>Önceliğe göre</option>
                                <option value="title" ${appState.defaultSortBy === 'title' ? 'selected' : ''}>Başlığa göre</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initModuleCharts(moduleType) {
    const moduleItems = appState.currentData.filter(d => d.module === moduleType);
    if (moduleItems.length === 0) return;

    // Status Chart
    const statusCtx = document.getElementById(`${CONSTANTS.MODULE_STATUS_CHART_ID_PREFIX}${moduleType}`);
    if (statusCtx) {
        const statusStats = {
            'Aktif': moduleItems.filter(d => d.status === 'Aktif').length,
            'Beklemede': moduleItems.filter(d => d.status === 'Beklemede').length,
            'Tamamlandı': moduleItems.filter(d => d.status === 'Tamamlandı').length,
        };

        appState.chartInstances.moduleStatusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusStats),
                datasets: [{
                    data: Object.values(statusStats),
                    backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'],
                    hoverOffset: 4,
                    borderColor: (window.elementSdk?.config || defaultConfig).surface_bg,
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        display: true, 
                        position: 'bottom', 
                        labels: { boxWidth: 12 } 
                    } 
                },
                cutout: '60%'
            }
        });
    }

    // Priority Chart
    const priorityCtx = document.getElementById(`${CONSTANTS.MODULE_PRIORITY_CHART_ID_PREFIX}${moduleType}`);
    if (priorityCtx) {
        const priorityStats = {
            'Yüksek': moduleItems.filter(d => d.priority === 'Yüksek').length,
            'Orta': moduleItems.filter(d => d.priority === 'Orta').length,
            'Düşük': moduleItems.filter(d => d.priority === 'Düşük').length,
        };

        // Only render chart if there is priority data
        if (Object.values(priorityStats).some(v => v > 0)) {
            appState.chartInstances.modulePriorityChart = new Chart(priorityCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(priorityStats),
                    datasets: [{
                        data: Object.values(priorityStats),
                        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
                        hoverOffset: 4,
                        borderColor: (window.elementSdk?.config || defaultConfig).surface_bg,
                        borderWidth: 2,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            display: true, 
                            position: 'bottom', 
                            labels: { boxWidth: 12 } 
                        } 
                    },
                    cutout: '60%'
                }
            });
        }
    }
}

function initReportCharts() {
    initModuleBarChart();
    initStatusDoughnutChart();
    initPriorityDoughnutChart();
}

function initModuleBarChart() {
    const ctx = document.getElementById(CONSTANTS.MODULE_CHART_ID);
    if (!ctx) return;

    const moduleStats = {
        'Personel': appState.currentData.filter(d => d.module === 'personel').length,
        'Stok': appState.currentData.filter(d => d.module === 'stok').length,
        'Finans': appState.currentData.filter(d => d.module === 'finans').length,
        'Satış': appState.currentData.filter(d => d.module === 'satis').length,
        'Satın Alma': appState.currentData.filter(d => d.module === 'satin-alma').length,
        'Üretim': appState.currentData.filter(d => d.module === 'uretim').length,
        'Müşteri': appState.currentData.filter(d => d.module === 'musteri').length,
        'Proje': appState.currentData.filter(d => d.module === 'proje').length,
    };

    appState.chartInstances.moduleChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(moduleStats),
            datasets: [{
                label: 'Kayıt Sayısı',
                data: Object.values(moduleStats),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { 
                    beginAtZero: true, 
                    ticks: { stepSize: 1 },
                    grid: { color: 'rgba(128, 128, 128, 0.2)' }
                },
                x: { ticks: {} }
            },
            plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b' } }
        }
    });
}

function initStatusDoughnutChart() {
    const ctx = document.getElementById(CONSTANTS.STATUS_CHART_ID);
    if (!ctx) return;

    const statusStats = {
        'Aktif': appState.currentData.filter(d => d.status === 'Aktif').length,
        'Beklemede': appState.currentData.filter(d => d.status === 'Beklemede').length,
        'Tamamlandı': appState.currentData.filter(d => d.status === 'Tamamlandı').length,
    };

    appState.chartInstances.statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusStats),
            datasets: [{
                label: 'Durum Dağılımı',
                data: Object.values(statusStats),
                backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } }
        }
    });
}

function initPriorityDoughnutChart() {
    const ctx = document.getElementById(CONSTANTS.PRIORITY_CHART_ID);
    if (!ctx) return;

    const priorityStats = {
        'Yüksek': appState.currentData.filter(d => d.priority === 'Yüksek').length,
        'Orta': appState.currentData.filter(d => d.priority === 'Orta').length,
        'Düşük': appState.currentData.filter(d => d.priority === 'Düşük').length,
    };

    appState.chartInstances.priorityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(priorityStats),
            datasets: [{
                label: 'Öncelik Dağılımı',
                data: Object.values(priorityStats),
                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } }
        }
    });
}

// =================================================================================
// EVENT HANDLERS & ACTIONS
// =================================================================================

function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const username = form.username.value;
    const password = form.password.value;

    // Check against the user list
    const user = USERS.find(u => u.username === username && u.password === password);

    if (user) {
        appState.isAuthenticated = true;
        appState.currentUser = user;
        sessionStorage.setItem('erp-session', JSON.stringify(user));
        renderApp();
    } else {
        const errorContainer = document.getElementById('login-error-message');
        errorContainer.innerHTML = `
            <div class="login-error text-sm">
                Kullanıcı adı veya şifre hatalı.
            </div>
        `;
    }
}

function handleLogout() {
    appState.isAuthenticated = false;
    appState.currentUser = null;
    sessionStorage.removeItem('erp-session');
    // Reset to dashboard page on logout
    appState.currentPage = 'dashboard';
    renderApp();
}

function navigateTo(page) {
  appState.currentPage = page;

  // Reset filters and sorting to defaults when entering a module page
  const isModulePage = !['dashboard', 'raporlar', 'ayarlar'].includes(page);
  if (isModulePage) {
    appState.currentPageNumber = 1;
    appState.searchQuery = '';
    appState.activeFilter = appState.defaultFilter;
    appState.sortBy = appState.defaultSortBy;
  }
  renderCurrentPage();
}

function handleGlobalSearch(event) {
    clearTimeout(appState.searchDebounceTimer);
    const query = event.target.value.toLowerCase();

    if (query.length < 2) {
        hideSearchResults();
        // If search is cleared, also clear page-level search
        if (appState.searchQuery !== '') {
            appState.searchQuery = '';
            updateModuleView(appState.currentPage);
        }
        return;
    }

    // Update page-level search for filtering within modules
    appState.searchQuery = query;

    appState.searchDebounceTimer = setTimeout(() => {
        const searchResults = appState.currentData.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(query)
            )
        );
        renderSearchResultsDropdown(searchResults);
    }, 250); // 250ms debounce
}

function navigateToSearchResult(module) {
    navigateTo(module);
    hideSearchResults();
}

function handleFilter(type, value) {
  const { activeFilters } = appState;

  // Initialize the filter array if it doesn't exist
  if (!activeFilters[type]) {
    activeFilters[type] = [];
  }

  const filterIndex = activeFilters[type].indexOf(value);

  if (filterIndex > -1) {
    // If filter is already active, remove it
    activeFilters[type].splice(filterIndex, 1);
  } else {
    // Otherwise, add it
    activeFilters[type].push(value);
  }

  appState.currentPageNumber = 1; // Reset to first page on filter change
  updateModuleView(appState.currentPage);
}

function handleSettingChange(key, value) {    
    if (key in appState) {
        appState[key] = value;
        localStorage.setItem(`erp-${key}`, value);
        showToast('✅ Ayar kaydedildi!', 'success');
        // No need to re-render immediately, will be applied on next navigation
    }
}

function changePage(pageNumber) {
    // This function is now obsolete with virtual scrolling.
    updateModuleView(appState.currentPage);
}

async function handleAddSubmit(event, moduleType) {
  event.preventDefault();

  if (!hasAccess('manage', moduleType)) {
    showToast('❌ Bu modüle kayıt ekleme yetkiniz yok!', 'error');
    return;
  }
  
  if (appState.isLoading) return;
  appState.isLoading = true;

  const submitBtn = document.getElementById(CONSTANTS.SUBMIT_BTN_ID);
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="loading-spinner mx-auto"></div>';

  const form = event.target;
  const newItem = {
    id: Date.now().toString(),
    module: moduleType,
    title: form.title.value,
    description: form.description.value,
    status: form.status.value,
    priority: form.priority?.value || '',
    assignee: form.assignee?.value || '',
    deadline: form.deadline?.value || '',
    tags: form.tags?.value || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (form.amount) newItem.amount = parseFloat(form.amount.value) || 0;
  if (form.quantity) newItem.quantity = parseInt(form.quantity.value) || 0;
  if (form.email) newItem.email = form.email.value;
  if (form.phone) newItem.phone = form.phone.value;
  if (form.progress) newItem.progress = parseInt(form.progress.value) || 0;
  if (form.lastContacted) newItem.lastContacted = form.lastContacted.value;

  const result = await window.dataSdk.create(newItem);
  appState.isLoading = false;

  if (result.isOk) {
    closeModal(CONSTANTS.ADD_MODAL_ID);
    showToast('✅ Kayıt başarıyla eklendi!', 'success');
  } else {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '💾 Kaydet';
    showToast('❌ Kayıt eklenirken hata oluştu!', 'error');
  }
}

async function confirmDelete(backendId) {
  const item = appState.currentData.find(d => d.__backendId === backendId);
  if (!item || appState.isLoading) return;

  if (!hasAccess('manage', item.module)) {
    closeConfirmModal();
    showToast('❌ Bu kaydı silme yetkiniz yok!', 'error');
    return;
  }

  appState.isLoading = true;
  const confirmBtn = document.getElementById(CONSTANTS.CONFIRM_DELETE_BTN_ID);
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<div class="loading-spinner mx-auto"></div>';

  const result = await window.dataSdk.delete(item);
  appState.isLoading = false;

  if (result.isOk) {
    closeConfirmModal();
    showToast('✅ Kayıt başarıyla silindi!', 'success');
  } else {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '🗑️ Sil';
    showToast('❌ Kayıt silinirken hata oluştu!', 'error');
  }
}

function editItem(backendId) {
  const itemToEdit = appState.currentData.find(item => item.__backendId === backendId);
  if (!itemToEdit) {
    showToast('❌ Düzenlenecek kayıt bulunamadı!', 'error');
    return;
  }
  if (!hasAccess('manage', itemToEdit.module)) {
    showToast('❌ Bu kaydı düzenleme yetkiniz yok!', 'error');
    return;
  }
  openEditModal(itemToEdit);
}

function viewItem(backendId) {
  const itemToView = appState.currentData.find(item => item.__backendId === backendId);
  if (itemToView) openDetailModal(itemToView);
}

function showNotifications() {
  showToast('🔔 Yeni bildiriminiz yok', 'info');
}

function showProfile() {
  showToast('👤 Profil sayfası yakında eklenecek!', 'info');
}

function exportData() {
  if (appState.currentData.length === 0) {
    showToast('⚠️ Dışa aktarılacak veri bulunmuyor', 'error');
    return;
  }
  if (!hasAccess('export')) {
    showToast('❌ Veri dışa aktarma yetkiniz yok!', 'error');
    return;
  }

  const csvContent = convertToCSV(appState.currentData);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `ayfsoft-erp-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('📥 Veriler başarıyla dışa aktarıldı!', 'success');
}

// =================================================================================
// MODAL & TOAST FUNCTIONS
// =================================================================================

function openDetailModal(item) {
  const config = window.elementSdk?.config || defaultConfig;
  const statusClass = (item.status || 'Aktif').toLowerCase();
  const priorityBadge = item.priority ? `<span class="badge badge-${item.priority === 'Yüksek' ? 'high' : item.priority === 'Orta' ? 'medium' : 'low'}">${item.priority}</span>` : '';
  
  const modal = document.createElement('div');
  modal.id = CONSTANTS.DETAIL_MODAL_ID;
  modal.className = 'modal-overlay fixed inset-0 flex items-center justify-center p-4';
  modal.style.zIndex = '1000';

  const renderDetailField = (label, value, isBadge = false) => {
    if (!value && value !== 0) return '';
    return `
      <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt class="text-sm font-medium text-gray-500">${label}</dt>
        <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
          ${isBadge ? value : (value || '-')}
        </dd>
      </div>
    `;
  };

  modal.innerHTML = `
    <div class="stat-card rounded-xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-start justify-between">
            <div>
                <h2 class="text-subheader font-bold">${item.title}</h2>
                <p class="text-sm text-gray-500 mt-1">${getModuleIcon(item.module)} ${getModuleName(item.module)}</p>
            </div>
            <button data-action="close-modal" data-modal-id="${CONSTANTS.DETAIL_MODAL_ID}" class="text-2xl text-gray-500 hover:text-gray-800">&times;</button>
        </div>
      </div>
      <div class="p-6">
        <dl>
          ${renderDetailField('Açıklama', item.description)}
          ${renderDetailField('Durum', `<span class="status-badge status-badge-${statusClass}">${item.status || 'Aktif'}</span>`, true)}
          ${renderDetailField('Öncelik', priorityBadge, true)}
          ${renderDetailField('Atanan Kişi', item.assignee)}
          ${renderDetailField('Oluşturma Tarihi', new Date(item.createdAt).toLocaleString('tr-TR'))}
          ${renderDetailField('Son Güncelleme', new Date(item.updatedAt).toLocaleString('tr-TR'))}
          ${renderDetailField('Son Tarih', item.deadline ? new Date(item.deadline).toLocaleDateString('tr-TR') : '')}
          ${item.progress !== undefined ? renderDetailField('İlerleme', `
            <div class="w-full progress-bar mt-1">
              <div class="progress-fill" style="width: ${item.progress}%;"></div>
            </div>
            <span class="text-xs text-gray-500">${item.progress}% tamamlandı</span>
          `, true) : ''}
          ${renderDetailField('Tutar', item.amount ? `₺${item.amount.toLocaleString('tr-TR')}` : '')}
          ${renderDetailField('Miktar', item.quantity)}
          ${renderDetailField('E-posta', item.email ? `<a href="mailto:${item.email}" class="text-blue-500 hover:underline">${item.email}</a>` : '', true)}
          ${renderDetailField('Telefon', item.phone)}
          ${renderDetailField('Etiketler', item.tags)}
        </dl>
      </div>
      <div class="p-4 bg-surface-muted text-right rounded-b-xl">
          <button data-action="close-modal" data-modal-id="${CONSTANTS.DETAIL_MODAL_ID}" class="btn-cancel px-4 py-2 rounded-lg font-medium">Kapat</button>
      </div>
    </div>
  `;

  document.getElementById(CONSTANTS.APP_ID).appendChild(modal);
}

function openEditModal(item) {
  const config = window.elementSdk?.config || defaultConfig;

  const modal = document.createElement('div');
  modal.id = CONSTANTS.EDIT_MODAL_ID;
  modal.className = 'modal-overlay fixed inset-0 flex items-center justify-center p-4';
  modal.style.zIndex = '1000';

  // Tarih formatını YYYY-MM-DD'ye çevir
  const deadlineDate = item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : '';

  modal.innerHTML = `
    <div class="stat-card rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
      <h2 class="text-subheader font-bold mb-4">✏️ Kayıt Düzenle - ${getModuleName(item.module)}</h2>
      <form id="edit-form" onsubmit="handleEditSubmit(event, '${item.__backendId}')">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label for="title" class="block font-medium mb-2">Başlık *</label>
            <input type="text" id="title" name="title" required class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" value="${item.title || ''}" />
          </div>
          
          <div class="md:col-span-2">
            <label for="description" class="block font-medium mb-2">Açıklama</label>
            <textarea id="description" name="description" rows="3" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">${item.description || ''}</textarea>
          </div>

          <div>
            <label for="status" class="block font-medium mb-2">Durum</label>
            <select id="status" name="status" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">
              <option ${item.status === 'Aktif' ? 'selected' : ''}>Aktif</option>
              <option ${item.status === 'Beklemede' ? 'selected' : ''}>Beklemede</option>
              <option ${item.status === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
            </select>
          </div>

          <div>
            <label for="priority" class="block font-medium mb-2">Öncelik</label>
            <select id="priority" name="priority" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">
              <option ${item.priority === 'Düşük' ? 'selected' : ''}>Düşük</option>
              <option ${item.priority === 'Orta' ? 'selected' : ''}>Orta</option>
              <option ${item.priority === 'Yüksek' ? 'selected' : ''}>Yüksek</option>
            </select>
          </div>

          <div>
            <label for="assignee" class="block font-medium mb-2">Atanan Kişi</label>
            <input type="text" id="assignee" name="assignee" placeholder="İsim Soyisim" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" value="${item.assignee || ''}" />
          </div>

          <div>
            <label for="deadline" class="block font-medium mb-2">Son Tarih</label>
            <input type="date" id="deadline" name="deadline" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" value="${deadlineDate}" />
          </div>

          ${item.module === 'finans' || item.module === 'satis' ? `
            <div>
              <label for="amount" class="block font-medium mb-2">Tutar (₺)</label>
              <input type="number" id="amount" name="amount" placeholder="0.00" step="0.01" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" value="${item.amount || ''}" />
            </div>
          ` : ''}

          ${item.module === 'stok' ? `
            <div>
              <label for="quantity" class="block font-medium mb-2">Miktar</label>
              <input type="number" id="quantity" name="quantity" placeholder="0" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" value="${item.quantity || ''}" />
            </div>
          ` : ''}

          ${item.module === 'musteri' || item.module === 'personel' ? `
            <div>
              <label for="email" class="block font-medium mb-2">E-posta</label>
              <input type="email" id="email" name="email" placeholder="ornek@email.com" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" value="${item.email || ''}" />
            </div>
            <div>
              <label for="phone" class="block font-medium mb-2">Telefon</label>
              <input type="tel" id="phone" name="phone" placeholder="+90 5XX XXX XX XX" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" value="${item.phone || ''}" />
            </div>
          ` : ''}

          ${item.module === 'proje' ? `
            <div>
              <label for="progress" class="block font-medium mb-2">İlerleme (%)</label>
              <input type="range" id="progress" name="progress" min="0" max="100" class="w-full" value="${item.progress || '0'}" oninput="this.nextElementSibling.textContent = this.value + '%'">
              <span class="text-sm text-muted">${item.progress || '0'}%</span>
            </div>
          ` : ''}
          
          ${item.module === 'musteri' ? `
            <div>
              <label for="lastContacted" class="block font-medium mb-2">Son İletişim Tarihi</label>
              <input type="date" id="lastContacted" name="lastContacted" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg" value="${item.lastContacted ? new Date(item.lastContacted).toISOString().split('T')[0] : ''}" />
            </div>
          ` : ''}
          
          ${item.module === 'uretim' ? `
            <div class="md:col-span-2">
              <label for="status" class="block font-medium mb-2">Üretim Aşaması</label>
              <select id="status" name="status" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg"><option ${item.status === 'Planlandı' ? 'selected' : ''}>Planlandı</option><option ${item.status === 'Üretimde' ? 'selected' : ''}>Üretimde</option><option ${item.status === 'Kalite Kontrol' ? 'selected' : ''}>Kalite Kontrol</option><option ${item.status === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option></select>
            </div>
          ` : ''}

          <div class="md:col-span-2">
            <label for="tags" class="block font-medium mb-2">Etiketler</label>
            <input type="text" id="tags" name="tags" placeholder="etiket1, etiket2, etiket3" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" value="${item.tags || ''}" />
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button type="button" data-action="close-modal" data-modal-id="${CONSTANTS.EDIT_MODAL_ID}" class="btn-cancel flex-1 px-4 py-3 rounded-lg font-medium transition-all hover:shadow-md">İptal</button>
          <button type="submit" id="${CONSTANTS.EDIT_SUBMIT_BTN_ID}" class="btn-primary flex-1 px-4 py-3 rounded-lg text-white font-medium transition-all hover:shadow-lg">
            💾 Güncelle
          </button>
        </div>
      </form>
    </div>
  `;

  document.getElementById(CONSTANTS.APP_ID).appendChild(modal);
}

function openAddModal(moduleType) {
  if (!hasAccess('manage', moduleType)) {
    showToast('❌ Bu modüle kayıt ekleme yetkiniz yok!', 'error');
    return;
  }

  if (appState.currentData.length >= 999) {
    showToast('Maksimum 999 kayıt limitine ulaşıldı. Lütfen önce bazı kayıtları silin.', 'error');
    return;
  }

  const modal = document.createElement('div');
  modal.id = CONSTANTS.ADD_MODAL_ID;
  modal.className = 'modal-overlay fixed inset-0 flex items-center justify-center p-4';
  modal.style.zIndex = '1000';
  
  modal.innerHTML = `
    <div class="stat-card rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
      <h2 class="text-subheader font-bold mb-4">✨ Yeni Kayıt Ekle - ${getModuleName(moduleType)}</h2>
      <form id="add-form" onsubmit="handleAddSubmit(event, '${moduleType}')">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label for="title" class="block font-medium mb-2">Başlık *</label>
            <input type="text" id="title" name="title" required class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          
          <div class="md:col-span-2">
            <label for="description" class="block font-medium mb-2">Açıklama</label>
            <textarea id="description" name="description" rows="3" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"></textarea>
          </div>

          <div>
            <label for="status" class="block font-medium mb-2">Durum</label>
            <select id="status" name="status" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">
              <option>Aktif</option>
              <option>Beklemede</option>
              <option>Tamamlandı</option>
            </select>
          </div>

          <div>
            <label for="priority" class="block font-medium mb-2">Öncelik</label>
            <select id="priority" name="priority" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">
              <option>Düşük</option>
              <option>Orta</option>
              <option>Yüksek</option>
            </select>
          </div>

          <div>
            <label for="assignee" class="block font-medium mb-2">Atanan Kişi</label>
            <input type="text" id="assignee" name="assignee" placeholder="İsim Soyisim" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>

          <div>
            <label for="deadline" class="block font-medium mb-2">Son Tarih</label>
            <input type="date" id="deadline" name="deadline" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>

          ${moduleType === 'finans' || moduleType === 'satis' ? `
            <div>
              <label for="amount" class="block font-medium mb-2">Tutar (₺)</label>
              <input type="number" id="amount" name="amount" placeholder="0.00" step="0.01" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
          ` : ''}

          ${moduleType === 'stok' ? `
            <div>
              <label for="quantity" class="block font-medium mb-2">Miktar</label>
              <input type="number" id="quantity" name="quantity" placeholder="0" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
          ` : ''}

          ${moduleType === 'musteri' || moduleType === 'personel' ? `
            <div>
              <label for="email" class="block font-medium mb-2">E-posta</label>
              <input type="email" id="email" name="email" placeholder="ornek@email.com" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label for="phone" class="block font-medium mb-2">Telefon</label>
              <input type="tel" id="phone" name="phone" placeholder="+90 5XX XXX XX XX" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
          ` : ''}

          ${moduleType === 'proje' ? `
            <div>
              <label for="progress" class="block font-medium mb-2">İlerleme (%)</label>
              <input type="range" id="progress" name="progress" min="0" max="100" value="0" class="w-full" oninput="this.nextElementSibling.textContent = this.value + '%'">
              <span class="text-sm text-muted">0%</span>
            </div>
          ` : ''}
          
          ${moduleType === 'musteri' ? `
            <div>
              <label for="lastContacted" class="block font-medium mb-2">Son İletişim Tarihi</label>
              <input type="date" id="lastContacted" name="lastContacted" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
          ` : ''}
          
          ${moduleType === 'uretim' ? `
            <div class="md:col-span-2">
              <label for="status" class="block font-medium mb-2">Üretim Aşaması</label>
              <select id="status" name="status" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg"><option>Planlandı</option><option>Üretimde</option><option>Kalite Kontrol</option><option>Tamamlandı</option></select>
            </div>
          ` : ''}

          <div class="md:col-span-2">
            <label for="tags" class="block font-medium mb-2">Etiketler</label>
            <input type="text" id="tags" name="tags" placeholder="etiket1, etiket2, etiket3" class="form-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button type="button" data-action="close-modal" data-modal-id="${CONSTANTS.ADD_MODAL_ID}" class="btn-cancel flex-1 px-4 py-3 rounded-lg font-medium transition-all hover:shadow-md">İptal</button>
          <button type="submit" id="${CONSTANTS.SUBMIT_BTN_ID}" class="btn-primary flex-1 px-4 py-3 rounded-lg text-white font-medium transition-all hover:shadow-lg">
            💾 Kaydet
          </button>
        </div>
      </form>
    </div>
  `;

  document.getElementById(CONSTANTS.APP_ID).appendChild(modal);
}

function deleteItem(backendId) {
  const item = appState.currentData.find(d => d.__backendId === backendId);
  if (!item) return;

  if (!hasAccess('manage', item.module)) {
    showToast('❌ Bu kaydı silme yetkiniz yok!', 'error');
    return;
  }

  const modal = document.createElement('div');
  modal.id = CONSTANTS.CONFIRM_MODAL_ID;
  modal.className = 'modal-overlay fixed inset-0 flex items-center justify-center p-4';
  modal.style.zIndex = '1000';
  
  modal.innerHTML = `
    <div class="stat-card rounded-xl shadow-2xl p-6 w-full max-w-md">
      <div class="text-center mb-4">
        <span class="text-5xl">⚠️</span>
      </div>
      <h2 class="text-subheader font-bold mb-4 text-center">Silme Onayı</h2>
      <p class="mb-6 text-center">
        <strong>"${item.title}"</strong> kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
      </p>
      <div class="flex gap-3">
        <button data-action="close-confirm-modal" class="btn-cancel flex-1 px-4 py-3 rounded-lg font-medium transition-all hover:shadow-md">İptal</button>
        <button id="${CONSTANTS.CONFIRM_DELETE_BTN_ID}" data-action="confirm-delete" data-id="${backendId}" class="btn-danger flex-1 px-4 py-3 rounded-lg text-white font-medium transition-all hover:shadow-lg">🗑️ Sil</button>
      </div>
    </div>
  `;

  document.getElementById(CONSTANTS.APP_ID).appendChild(modal);
}

async function handleEditSubmit(event, backendId) {
  event.preventDefault();

  const itemToUpdate = appState.currentData.find(item => item.__backendId === backendId);
  if (!itemToUpdate || appState.isLoading) return;

  if (!hasAccess('manage', itemToUpdate.module)) {
    closeModal(CONSTANTS.EDIT_MODAL_ID);
    showToast('❌ Bu kaydı düzenleme yetkiniz yok!', 'error');
    return;
  }

  appState.isLoading = true;
  const submitBtn = document.getElementById(CONSTANTS.EDIT_SUBMIT_BTN_ID);
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="loading-spinner mx-auto"></div>';

  const form = event.target;
  const updatedData = {
    ...itemToUpdate, // Keep original data like id, module, createdAt
    title: form.title.value,
    description: form.description.value,
    status: form.status.value,
    priority: form.priority?.value || '',
    assignee: form.assignee?.value || '',
    deadline: form.deadline?.value || '',
    tags: form.tags?.value || '',
    updatedAt: new Date().toISOString()
  };

  if (form.amount) updatedData.amount = parseFloat(form.amount.value) || 0;
  if (form.quantity) updatedData.quantity = parseInt(form.quantity.value) || 0;
  if (form.email) updatedData.email = form.email.value;
  if (form.phone) updatedData.phone = form.phone.value;
  if (form.progress) updatedData.progress = parseInt(form.progress.value) || 0;
  if (form.lastContacted) updatedData.lastContacted = form.lastContacted.value;

  const result = await window.dataSdk.update(updatedData);
  appState.isLoading = false;

  if (result.isOk) {
    closeModal(CONSTANTS.EDIT_MODAL_ID);
    showToast('✅ Kayıt başarıyla güncellendi!', 'success');
  } else {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '💾 Güncelle';
    showToast('❌ Kayıt güncellenirken hata oluştu!', 'error');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.remove();
}

function closeConfirmModal() {
  const modal = document.getElementById(CONSTANTS.CONFIRM_MODAL_ID);
  if (modal) modal.remove();
}

function showToast(message, type) {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.background = colors[type] || colors.info;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function showWelcomeTour() {
    const modal = document.createElement('div');
    modal.id = CONSTANTS.WELCOME_MODAL_ID;
    modal.className = 'modal-overlay fixed inset-0 flex items-center justify-center p-4';
    modal.style.zIndex = '2000'; // Ensure it's on top

    modal.innerHTML = `<div class="welcome-modal-content"></div>`;
    document.getElementById(CONSTANTS.APP_ID).appendChild(modal);

    renderWelcomeTourContent();
}

function renderWelcomeTourContent() {
    const contentContainer = document.querySelector(`#${CONSTANTS.WELCOME_MODAL_ID} .welcome-modal-content`);
    if (!contentContainer) return;

    const stepIndex = appState.welcomeTourStep - 1;
    const stepData = WELCOME_TOUR_STEPS[stepIndex];

    let indicators = '';
    for (let i = 0; i < WELCOME_TOUR_STEPS.length; i++) {
        indicators += `<div class="tour-step-indicator ${i === stepIndex ? 'active' : ''}"></div>`;
    }

    const isFirstStep = appState.welcomeTourStep === 1;
    const isLastStep = appState.welcomeTourStep === WELCOME_TOUR_STEPS.length;

    contentContainer.innerHTML = `
        <div class="stat-card rounded-xl shadow-2xl p-8 text-center">
            <h2 class="text-2xl font-bold mb-4">${stepData.title}</h2>
            <p class="mb-8 text-base">${stepData.content}</p>

            <div class="tour-step-indicator-container mb-8">
                ${indicators}
            </div>

            <div class="flex items-center justify-between">
                <button 
                    class="tour-nav-btn px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    data-action="change-tour-step" data-direction="-1"
                    ${isFirstStep ? 'disabled' : ''}>
                    Geri
                </button>
                
                ${isLastStep ? `
                    <button 
                        class="tour-nav-btn px-6 py-2 rounded-lg text-white font-medium" 
                        style="background-color: var(--primary-action);"
                        data-action="close-welcome-tour">
                        Turu Bitir
                    </button>
                ` : `
                    <button 
                        class="tour-nav-btn px-6 py-2 rounded-lg text-white font-medium" 
                        style="background-color: var(--primary-action);"
                        data-action="change-tour-step" data-direction="1">
                        İleri
                    </button>
                `}
            </div>
        </div>
    `;
}

function changeTourStep(direction) {
    const newStep = appState.welcomeTourStep + direction;
    if (newStep > 0 && newStep <= WELCOME_TOUR_STEPS.length) {
        appState.welcomeTourStep = newStep;
        renderWelcomeTourContent();
    }
}

function closeWelcomeTour() {
    const modal = document.getElementById(CONSTANTS.WELCOME_MODAL_ID);
    if (modal) {
        modal.remove();
    }
    localStorage.setItem('erp-welcome-shown', 'true');
}

/**
 * Handles all click events in the app using event delegation.
 */
function handleGlobalClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const { action, page, module, filter, pageNumber, modalId, id, direction, theme, key } = target.dataset;

    switch (action) {
        case 'navigate':
            if (page) navigateTo(page);
            break;
        case 'show-notifications':
            showNotifications();
            break;
        case 'toggle-theme':
            toggleTheme();
            break;
        case 'set-theme':
            if (theme && appState.theme !== theme) toggleTheme();
            break;
        case 'show-profile':
            showProfile();
            break;
        case 'navigate-search-result':
            if (module) navigateToSearchResult(module);
            break;
        case 'open-add-modal':
            const moduleType = target.dataset.moduleType;
            if (moduleType) openAddModal(moduleType);
            break;
        case 'filter':
            const { type, value } = target.dataset;
            if (type && value) handleFilter(type, value);
            break;
        case 'clear-filters':
            appState.activeFilters = {};
            updateModuleView(appState.currentPage);
            break;
        case 'sort': // This case is now handled by handleGlobalChange
            break;
        case 'change-page':
            if (pageNumber) changePage(parseInt(pageNumber, 10));
            break;
        case 'close-modal':
            if (modalId) closeModal(modalId);
            break;
        case 'close-confirm-modal':
            closeConfirmModal();
            break;
        case 'export-data':
            if (hasAccess('export')) exportData();
            else showToast('❌ Veri dışa aktarma yetkiniz yok!', 'error');
            break;
        case 'confirm-delete':
            if (id) confirmDelete(id);
            break;
        case 'change-tour-step':
            if (direction) changeTourStep(parseInt(direction, 10));
            break;
        case 'close-welcome-tour':
            closeWelcomeTour();
            break;
        case 'edit':
            if (id) {
                const item = appState.currentData.find(d => d.__backendId === id);
                if (item && hasAccess('manage', item.module)) editItem(id);
                else showToast('❌ Bu kaydı düzenleme yetkiniz yok!', 'error');
            }
            break;
        case 'delete':
            if (id) deleteItem(id); // deleteItem has its own permission check
            break;
        case 'view': // View is generally allowed for all roles that can view the module
            if (id) viewItem(id);
            break;
        case 'logout':
            handleLogout();
            break;
    }
}

/**
 * Handles all change events for event delegation.
 */
function handleGlobalChange(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const { action, key } = target.dataset;

    if (action === 'sort') {
        appState.sortBy = target.value;
        updateModuleView(appState.currentPage);
    }
    if (action === 'change-setting' && key) {
        if (hasAccess('changeSettings')) handleSettingChange(key, target.value);
        else showToast('❌ Ayarları değiştirme yetkiniz yok!', 'error');
    }
}

// =================================================================================
// UTILITY FUNCTIONS
// =================================================================================

function getFilteredData(moduleType) {
  const { currentData, searchQuery, activeFilters, sortBy } = appState;
  
  let filtered = currentData.filter(d => d.module === moduleType);

  if (searchQuery) {
    filtered = filtered.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchQuery)
      )
    );
  }

  // Apply multi-filters
  Object.entries(activeFilters).forEach(([key, values]) => {
    if (values.length > 0) {
      filtered = filtered.filter(item => values.includes(item[key]));
    }
  });

  if (sortBy === 'date') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'priority') {
    const priorityOrder = { 'Yüksek': 0, 'Orta': 1, 'Düşük': 2 };
    filtered.sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));
  } else if (sortBy === 'title') {
    filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  const totalItems = filtered.length;
  return { filteredItems, totalItems };
}

function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]).filter(key => key !== '__backendId');
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header] || '';
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

function getModuleIcon(module) {
  const icons = {
    personel: '👥',
    stok: '📦',
    finans: '💰',
    satis: '🛒',
    'satin-alma': '🛍️',
    uretim: '🏭',
    musteri: '🤝',
    proje: '📋'
  };
  return icons[module] || '📄';
}

function getModuleName(module) {
  const names = {
    personel: 'Personel',
    stok: 'Stok & Envanter',
    finans: 'Finans',
    satis: 'Satış',
    'satin-alma': 'Satın Alma',
    uretim: 'Üretim',
    musteri: 'Müşteri İlişkileri',
    proje: 'Proje Yönetimi'
  };
  return names[module] || module;
}

/**
 * Calculates the number of days until a given date and returns a user-friendly string.
 */
function getDaysUntil(dateString) {
    if (!dateString) return { days: Infinity, text: '', isOverdue: false, isDueSoon: false };

    const today = new Date();
    const deadline = new Date(dateString);
    
    // Saat, dakika, saniye farklarını sıfırla
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { days: diffDays, text: 'Süresi Doldu', isOverdue: true, isDueSoon: false };
    } else if (diffDays === 0) {
        return { days: 0, text: 'Bugün', isOverdue: false, isDueSoon: true };
    } else if (diffDays === 1) {
        return { days: 1, text: 'Yarın', isOverdue: false, isDueSoon: true };
    } else if (diffDays <= 7) {
        return { days: diffDays, text: `${diffDays} gün kaldı`, isOverdue: false, isDueSoon: true };
    } else {
        return { days: diffDays, text: `${diffDays} gün kaldı`, isOverdue: false, isDueSoon: false };
    }
}

const sampleData = [
  {
    id: 'sample-1',
    module: 'personel',
    title: 'Yusuf Çelik',
    description: 'Kıdemli Yazılım Geliştirici',
    status: 'Aktif',
    priority: 'Orta',
    assignee: 'İnsan Kaynakları',
    email: 'yusuf.celik@example.com',
    phone: '+90 555 123 45 67',
    createdAt: new Date('2023-01-15T09:00:00Z').toISOString(),
    updatedAt: new Date('2023-10-01T11:30:00Z').toISOString(),
  },
  {
    id: 'sample-2',
    module: 'stok',
    title: 'Laptop Standı',
    description: 'Ergonomik, alüminyum laptop standı.',
    status: 'Aktif',
    priority: 'Düşük',
    quantity: 150,
    tags: 'ofis, ergonomi, aksesuar',
    createdAt: new Date('2023-03-20T14:00:00Z').toISOString(),
    updatedAt: new Date('2023-09-25T10:00:00Z').toISOString(),
  },
  {
    id: 'sample-3',
    module: 'finans',
    title: 'Aylık Ofis Kirası',
    description: 'Ekim 2023 ofis kirası ödemesi.',
    status: 'Tamamlandı',
    priority: 'Yüksek',
    amount: 25000,
    createdAt: new Date('2023-10-05T08:00:00Z').toISOString(),
    updatedAt: new Date('2023-10-05T08:00:00Z').toISOString(),
  },
  {
    id: 'sample-4',
    module: 'satis',
    title: '10 Adet Yazılım Lisansı',
    description: 'ABC Corp için kurumsal yazılım lisans satışı.',
    status: 'Beklemede',
    priority: 'Yüksek',
    assignee: 'Selin Yılmaz',
    amount: 75000,
    deadline: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-5',
    module: 'proje',
    title: 'Yeni Mobil Uygulama Geliştirme',
    description: 'iOS ve Android için yeni ERP mobil uygulaması.',
    status: 'Aktif',
    priority: 'Yüksek',
    assignee: 'Proje Ekibi A',
    team: ['Demo Kullanıcı', 'Ahmet Yılmaz'],
    budget: 150000,
    spent: 65000,
    progress: 45,
    deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
    createdAt: new Date('2023-09-01T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString(),
  }
  ,
  {
    id: 'sample-6',
    module: 'musteri',
    title: 'Global Tech Inc.',
    status: 'Teklif Sunuldu',
    priority: 'Yüksek',
    assignee: 'Yusuf Avşar',
    amount: 250000,
    lastContacted: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    createdAt: new Date('2023-11-01T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-7',
    module: 'musteri',
    title: 'Yerel Marketler Zinciri',
    status: 'Potansiyel',
    priority: 'Orta',
    assignee: 'Demo Kullanıcı',
    amount: 50000,
    createdAt: new Date('2023-11-10T15:00:00Z').toISOString(),
    updatedAt: new Date('2023-11-10T15:00:00Z').toISOString(),
  }
  ,
  {
    id: 'sample-8',
    module: 'uretim',
    title: 'Model X-200 Anakart',
    status: 'Üretimde',
    priority: 'Yüksek',
    assignee: 'Hat-A',
    quantity: 500,
    deadline: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

/**
 * Generates a specified number of unique personnel records.
 * @param {number} count - The number of records to generate.
 * @returns {Array<Object>} An array of generated personnel data.
 */
function generatePersonnelData(count) {
    const firstNames = ['Ahmet', 'Mehmet', 'Mustafa', 'Ali', 'Hüseyin', 'Hasan', 'İbrahim', 'İsmail', 'Osman', 'Yusuf', 'Murat', 'Ömer', 'Ramazan', 'Halil', 'Süleyman', 'Abdullah', 'Fatih', 'Salih', 'Kemal', 'Adem', 'Ayşe', 'Fatma', 'Emine', 'Hatice', 'Zeynep', 'Meryem', 'Şerife', 'Sultan', 'Zehra', 'Hanife', 'Havva', 'Elif', 'Yasemin', 'Gül', 'Songül'];
    const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özcan', 'Polat', 'Avşar', 'Çakır', 'Şen', 'Aktaş', 'Güneş'];
    const departments = ['Yazılım Geliştirme', 'İnsan Kaynakları', 'Pazarlama', 'Satış', 'Finans', 'Operasyon', 'Ürün Yönetimi', 'Destek', 'Tasarım'];
    const statuses = ['Aktif', 'Beklemede', 'Tamamlandı'];
    const priorities = ['Düşük', 'Orta', 'Yüksek'];
    
    const data = [];
    const usedNames = new Set();

    for (let i = 0; i < count; i++) {
        let fullName;
        let firstName;
        let lastName;
        
        // Ensure unique name
        do {
            firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            fullName = `${firstName} ${lastName}`;
        } while (usedNames.has(fullName));
        
        usedNames.add(fullName);

        const department = departments[Math.floor(Math.random() * departments.length)];
        const email = `${firstName.toLowerCase().replace(/[^a-z]/g, '')}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}${i}@ayfsoft.com`;
        const phone = `+90 5${String(Math.floor(10 + Math.random() * 90)).padStart(2, '0')} ${String(Math.floor(100 + Math.random() * 900)).padStart(3, '0')} ${String(Math.floor(10 + Math.random() * 90)).padStart(2, '0')} ${String(Math.floor(10 + Math.random() * 90)).padStart(2, '0')}`;
        const startDate = new Date(2020, 0, 1);
        const endDate = new Date();
        const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));

        data.push({
            id: `personnel-${i + 1}`,
            module: 'personel',
            title: fullName,
            description: department,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            priority: priorities[Math.floor(Math.random() * priorities.length)],
            assignee: 'İnsan Kaynakları',
            email: email,
            phone: phone,
            createdAt: randomDate.toISOString(),
            updatedAt: new Date(randomDate.getTime() + Math.random() * (new Date().getTime() - randomDate.getTime())).toISOString(),
        });
    }
    return data;
}

// =================================================================================
// INITIALIZATION
// =================================================================================

(async () => {
  // Check for session authentication
  const sessionData = sessionStorage.getItem('erp-session');
  if (sessionData) {
      const user = JSON.parse(sessionData);
      appState.isAuthenticated = true;
      appState.currentUser = user;
  }

  // Load theme from localStorage
  const savedTheme = localStorage.getItem('erp-theme');
  if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      appState.theme = savedTheme;
  }
  // Apply theme to body
  document.body.dataset.theme = appState.theme;


  // Load default settings from localStorage
  const savedSort = localStorage.getItem('erp-defaultSortBy');
  if (savedSort) {
      appState.defaultSortBy = savedSort;
      // appState.sortBy = savedSort; // Do not set sortBy here, let it be default
  }
  const savedFilter = localStorage.getItem('erp-defaultFilter');
  if (savedFilter) {
      appState.defaultFilter = savedFilter;
      // appState.activeFilters = {}; // Start with no filters
  }

  // Show welcome tour if it's the first visit
  const welcomeShown = localStorage.getItem('erp-welcome-shown');
  if (!welcomeShown) {
      // Use a timeout to ensure the main app has rendered first
      setTimeout(showWelcomeTour, 500);
  }

  if (window.elementSdk) {
    await window.elementSdk.init({
      defaultConfig,
      onConfigChange: (config) => {
          applyThemeStyles(config); // This will set CSS variables
          renderCurrentPage();
      },
      mapToCapabilities: (config) => ({
        recolorables: [
          { name: 'Primary Background', get: () => config.primary_bg || defaultConfig.primary_bg, set: (value) => window.elementSdk.setConfig({ primary_bg: value }) },
          { name: 'Secondary Background', get: () => config.secondary_bg || defaultConfig.secondary_bg, set: (value) => window.elementSdk.setConfig({ secondary_bg: value }) },
          { name: 'Surface Background', get: () => config.surface_bg || defaultConfig.surface_bg, set: (value) => window.elementSdk.setConfig({ surface_bg: value }) },
          { name: 'Text Color', get: () => config.text_color || defaultConfig.text_color, set: (value) => window.elementSdk.setConfig({ text_color: value }) },
          { name: 'Dark Primary BG', get: () => config.dark_primary_bg || defaultConfig.dark_primary_bg, set: (value) => window.elementSdk.setConfig({ dark_primary_bg: value }) },
          { name: 'Dark Secondary BG', get: () => config.dark_secondary_bg || defaultConfig.dark_secondary_bg, set: (value) => window.elementSdk.setConfig({ dark_secondary_bg: value }) },
          { name: 'Dark Surface BG', get: () => config.dark_surface_bg || defaultConfig.dark_surface_bg, set: (value) => window.elementSdk.setConfig({ dark_surface_bg: value }) },
          { name: 'Dark Text Color', get: () => config.dark_text_color || defaultConfig.dark_text_color, set: (value) => window.elementSdk.setConfig({ dark_text_color: value }) },
          { name: 'Primary Action', get: () => config.primary_action || defaultConfig.primary_action, set: (value) => window.elementSdk.setConfig({ primary_action: value }) }
        ],
        borderables: [],
        fontEditable: {
          get: () => config.font_family || defaultConfig.font_family,
          set: (value) => window.elementSdk.setConfig({ font_family: value })
        },
        fontSizeable: {
          get: () => config.font_size || defaultConfig.font_size,
          set: (value) => window.elementSdk.setConfig({ font_size: value })
        }
      }),
      mapToEditPanelValues: (config) => new Map([
        ['company_name', config.company_name || defaultConfig.company_name],
        ['dashboard_title', config.dashboard_title || defaultConfig.dashboard_title],
        ['welcome_message', config.welcome_message || defaultConfig.welcome_message]
      ])
    });
  }

  if (window.dataSdk) {
    const initResult = await window.dataSdk.init(dataHandler);
    if (!initResult.isOk) {
      console.error('Data SDK initialization failed');
    }

    // If data is empty after init, load sample data for development
    if (initResult.isOk && initResult.value.length === 0) {
        console.log('No data found, loading sample and generated data...');
        const allSampleData = [...sampleData, ...generatePersonnelData(1200)];

        for (const item of allSampleData) {
            // We don't wait for each one to finish, let them run in parallel
            window.dataSdk.create(item);
        }
    }
  }

  // Add a global click listener to hide search results
  document.addEventListener('click', (event) => {
    const searchContainer = event.target.closest('.relative');
    if (!searchContainer || !searchContainer.contains(document.getElementById('global-search'))) {
      hideSearchResults();
    }
  });

  // Add global event listeners for delegation
  document.getElementById(CONSTANTS.APP_ID).addEventListener('click', handleGlobalClick);
  document.getElementById(CONSTANTS.APP_ID).addEventListener('change', handleGlobalChange);

  renderApp();
})();
