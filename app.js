(function(){
  'use strict';

  // Simple password hashing (not cryptographically secure, for basic security only)
  const hashPassword = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  // Admin Dashboard
  const initAdminPanel = () => {
    const adminPanel = document.getElementById('admin-panel');
    const accessDenied = document.getElementById('admin-access-denied');
    const loginFromAdmin = document.getElementById('login-from-admin');
    
    if (!adminPanel || !accessDenied) return;
    
    const checkAdmin = () => {
      const isLoggedIn = localStorage.getItem('authToken') === 'admin_session_active';
      if (isLoggedIn) {
        adminPanel.style.display = 'block';
        accessDenied.style.display = 'none';
        loadAdminStats();
      } else {
        adminPanel.style.display = 'none';
        accessDenied.style.display = 'block';
      }
    };
    
    const loadAdminStats = () => {
      const analytics = JSON.parse(localStorage.getItem('analytics') || '{}');
      document.getElementById('stat-visitors').textContent = analytics.visitors || 0;
      document.getElementById('stat-logins').textContent = analytics.logins || 0;
      document.getElementById('stat-pageviews').textContent = analytics.pageviews || 0;
      
      const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
      const logTable = document.getElementById('activity-log');
      
      if (activityLog.length > 0) {
        logTable.innerHTML = activityLog.slice(-10).reverse().map(log => `
          <tr>
            <td>${new Date(log.timestamp).toLocaleString('tr-TR')}</td>
            <td>${log.event}</td>
            <td>${log.detail}</td>
          </tr>
        `).join('');
      }
    };
    
    document.getElementById('clear-data')?.addEventListener('click', () => {
      if (confirm('Tüm verileri temizlemek istediğinize emin misiniz?')) {
        localStorage.removeItem('analytics');
        localStorage.removeItem('activityLog');
        loadAdminStats();
        alert('Veriler temizlendi!');
      }
    });
    
    document.getElementById('export-data')?.addEventListener('click', () => {
      const data = {
        analytics: JSON.parse(localStorage.getItem('analytics') || '{}'),
        activityLog: JSON.parse(localStorage.getItem('activityLog') || '[]'),
        exportDate: new Date().toISOString()
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    });
    
    if (loginFromAdmin) {
      loginFromAdmin.addEventListener('click', () => {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) loginBtn.click();
      });
    }
    
    checkAdmin();
  };

  // Analytics tracking
  const trackEvent = (event, detail) => {
    const analytics = JSON.parse(localStorage.getItem('analytics') || '{"visitors":0,"logins":0,"pageviews":0}');
    analytics.pageviews = (analytics.pageviews || 0) + 1;
    localStorage.setItem('analytics', JSON.stringify(analytics));
    
    const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
    activityLog.push({
      timestamp: new Date().toISOString(),
      event,
      detail
    });
    if (activityLog.length > 100) activityLog.shift();
    localStorage.setItem('activityLog', JSON.stringify(activityLog));
  };

  // Theme toggle
  const initThemeToggle = () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    if (!themeToggle) return;
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      body.classList.add('light-mode');
      themeToggle.textContent = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
      body.classList.toggle('light-mode');
      const isLight = body.classList.contains('light-mode');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      themeToggle.textContent = isLight ? '☀️' : '🌙';
    });
  };

  // ScrollTop button
  const initScrollTop = () => {
    const scrollTopBtn = document.getElementById('scroll-top');
    if (!scrollTopBtn) return;
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        scrollTopBtn.classList.add('show');
      } else {
        scrollTopBtn.classList.remove('show');
      }
    });
    
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // Login system
  const initLoginSystem = () => {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loginModal = document.getElementById('login-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const loginForm = document.getElementById('login-form');
    
    const CORRECT_USERNAME = 'yusufavsar';
    const CORRECT_PASSWORD_HASH = hashPassword('AyfSoftYusuf');
    
    if (!loginBtn || !loginModal) return;
    
    const checkAuthStatus = () => {
      const isLoggedIn = localStorage.getItem('authToken') === 'admin_session_active';
      if (isLoggedIn) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'flex';
      } else {
        loginBtn.style.display = 'flex';
        logoutBtn.style.display = 'none';
      }
    };
    
    checkAuthStatus();
    
    loginBtn.addEventListener('click', () => {
      loginModal.classList.add('active');
      modalOverlay.classList.add('active');
    });
    
    const closeModal = () => {
      loginModal.classList.remove('active');
      modalOverlay.classList.remove('active');
      loginForm.reset();
      document.getElementById('login-error').style.display = 'none';
    };
    
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const errorEl = document.getElementById('login-error');
      
      if (username === CORRECT_USERNAME && hashPassword(password) === CORRECT_PASSWORD_HASH) {
        localStorage.setItem('authToken', 'admin_session_active');
        localStorage.setItem('loginTime', new Date().getTime());
        
        // Track login
        const analytics = JSON.parse(localStorage.getItem('analytics') || '{"visitors":0,"logins":0,"pageviews":0}');
        analytics.logins = (analytics.logins || 0) + 1;
        localStorage.setItem('analytics', JSON.stringify(analytics));
        trackEvent('login', CORRECT_USERNAME);
        
        closeModal();
        checkAuthStatus();
      } else {
        errorEl.textContent = 'Kullanıcı adı veya şifre hatalı!';
        errorEl.style.display = 'block';
      }
    });
    
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('loginTime');
      checkAuthStatus();
    });
  };

  // Hamburger menu
  const initHamburgerMenu = () => {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    if (!hamburger || !navMenu) return;
    
    hamburger.addEventListener('click', () => {
      const isActive = hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isActive);
    });
    
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
    
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  };

  // Navbar active state
  const activateNav = () => {
    const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('a[data-nav]').forEach(a => {
      const href = (a.getAttribute('href') || '').split('?')[0].toLowerCase();
      a.classList.toggle('active', href === current);
    });
  };

  // Update year
  const updateYear = () => {
    const y = document.getElementById('y');
    if (y) y.textContent = new Date().getFullYear();
  };

  // Smooth scroll
  const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  // Page fade
  const initPageFade = () => {
    document.querySelectorAll('a[data-nav]').forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href && !href.startsWith('#')) {
          e.preventDefault();
          document.body.style.transition = 'opacity .2s ease';
          document.body.style.opacity = '0';
          setTimeout(() => { location.href = href; }, 200);
        }
      });
    });
  };

  // Scroll reveal
  const initScrollReveal = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = entry.target.style.animation || 'slideInUp .6s ease-out forwards';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.card, .btn, .badge').forEach(el => {
      observer.observe(el);
    });
  };

  // Details animation
  const initDetailsAnimation = () => {
    document.querySelectorAll('details.accordion').forEach(details => {
      details.addEventListener('toggle', function() {
        if (this.open) {
          this.querySelector('.acc').style.animation = 'slideDown .3s ease-out';
        }
      });
    });
  };

  // Education Filter
  const initEduFilter = () => {
    const input = document.getElementById('edu-search');
    if (!input) return;
    
    input.addEventListener('keyup', (e) => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll('.card').forEach(el => {
        const text = el.textContent.toLowerCase();
        if (text.includes(term)) {
          el.style.display = '';
        } else {
          el.style.display = 'none';
        }
      });
    });
  };

  // Publication Filter
  const initPubFilter = () => {
    const input = document.getElementById('pub-search');
    if (!input) return;
    
    input.addEventListener('keyup', (e) => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll('.card').forEach(el => {
        const text = el.textContent.toLowerCase();
        if (text.includes(term)) {
          el.style.display = '';
        } else {
          el.style.display = 'none';
        }
      });
    });
  };

  // Course Details Modal System
  const initCourseModal = () => {
    const modal = document.getElementById('course-modal');
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('course-modal-close');
    const titleEl = document.getElementById('course-modal-title');
    const contentEl = document.getElementById('course-modal-content');

    if (!modal || !overlay) return;

    // Open Modal
    document.querySelectorAll('.btn-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        const title = card.querySelector('h3').textContent;
        const desc = card.querySelector('p').outerHTML; // Description paragraph
        const details = card.querySelector('.card-details').innerHTML; // Hidden details

        titleEl.textContent = title;
        // Combine description and details
        contentEl.innerHTML = desc + details;
        
        // Clean up inline styles to allow CSS to take over for a professional look
        contentEl.querySelectorAll('*[style]').forEach(el => el.removeAttribute('style'));

        // Add CTA button with alert ONLY for trainings page
        if (window.location.pathname.includes('egitimler.html')) {
          const actionDiv = document.createElement('div');
          actionDiv.style.cssText = "margin-top:30px;display:flex;justify-content:flex-end;border-top:1px solid var(--border);padding-top:20px;";
          actionDiv.innerHTML = `<button class="btn" onclick="alert('Planlanan bir eğitim bulunamamıştır. Lütfen duyuruları takip ediniz.')">Programa Başvur</button>`;
          contentEl.appendChild(actionDiv);
        }
        
        modal.classList.add('active');
        overlay.classList.add('active');
      });
    });

    // Close Modal Logic
    const closeModal = () => {
      modal.classList.remove('active');
      // Overlay removal is handled by shared overlay logic or we can force it here if needed, 
      // but usually we want to ensure we don't close other modals if stacked (not the case here).
      // Since overlay is shared, we remove active class from it too.
      overlay.classList.remove('active');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    // Add click listener to overlay to close this modal as well
    overlay.addEventListener('click', () => {
      if (modal.classList.contains('active')) closeModal();
    });
  };

  // Initialize
  const init = () => {
    initAdminPanel();
    trackEvent('pageview', window.location.pathname);
    initThemeToggle();
    initScrollTop();
    initLoginSystem();
    initHamburgerMenu();
    activateNav();
    updateYear();
    initSmoothScroll();
    initPageFade();
    if ('IntersectionObserver' in window) initScrollReveal();
    initDetailsAnimation();
    initEduFilter();
    initPubFilter();
    initCourseModal();
    document.body.style.opacity = '1';
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
