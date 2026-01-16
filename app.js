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

  // Initialize
  const init = () => {
    initLoginSystem();
    initHamburgerMenu();
    activateNav();
    updateYear();
    initSmoothScroll();
    initPageFade();
    if ('IntersectionObserver' in window) initScrollReveal();
    initDetailsAnimation();
    document.body.style.opacity = '1';
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
