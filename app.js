(function(){
  'use strict';

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
