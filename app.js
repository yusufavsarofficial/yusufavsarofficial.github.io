document.addEventListener('DOMContentLoaded', () => {
    
    /**
     * ------------------------------------------------------------------------
     *  1. DİNAMİK COMPONENT YÜKLEYİCİ
     * ------------------------------------------------------------------------
     * Header ve Footer gibi tekrarlanan bileşenleri dinamik olarak yükler.
     * Bu, kod tekrarını önler ve bakımı kolaylaştırır.
     */
    const loadComponent = async (componentId, filePath) => {
        const element = document.getElementById(componentId);
        if (element) {
            try {
                const response = await fetch(filePath);
                if (!response.ok) throw new Error(`Component not found: ${filePath}`);
                const text = await response.text();
                element.innerHTML = text;
            } catch (error) {
                console.error(`Error loading component ${componentId}:`, error);
                element.innerHTML = `<p style="color:red; text-align:center;">Error loading ${componentId}.</p>`;
            }
        }
    };

    /**
     * ------------------------------------------------------------------------
     *  2. MOBİL NAVİGASYON YÖNETİMİ
     * ------------------------------------------------------------------------
     * Hamburger menüye tıklandığında tam ekran menüyü açar/kapatır.
     */
    const handleMobileNavigation = () => {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('nav-links');

        if (!hamburger || !navLinks) return;

        const toggleMenu = () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            // Menü açıkken body'nin kaymasını engelle
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        };

        hamburger.addEventListener('click', toggleMenu);

        // Menüdeki bir linke tıklandığında menüyü kapat
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    toggleMenu();
                }
            })
        });
    };

    /**
     * ------------------------------------------------------------------------
     *  3. SCROLL-TO-REVEAL ANİMASYONLARI
     * ------------------------------------------------------------------------
     * Intersection Observer API kullanarak, ekran görüş alanına giren
     * elementlere 'visible' class'ı ekler ve CSS animasyonlarını tetikler.
     */
    const handleScrollAnimations = () => {
        const revealElements = document.querySelectorAll('.scroll-reveal');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // Animasyon bir kez çalışsın
                }
            });
        }, {
            threshold: 0.1 // Elementin %10'u göründüğünde tetikle
        });

        revealElements.forEach(el => observer.observe(el));
    };

    /**
     * ------------------------------------------------------------------------
     *  4. İLETİŞİM FORMU YÖNETİMİ (FORMSPREE)
     * ------------------------------------------------------------------------
     * Formu asenkron olarak gönderir ve sayfa yenilenmeden sonuç mesajını
     * kullanıcıya gösterir.
     */
    const handleContactForm = () => {
        const form = document.getElementById('contact-form');
        if (!form) return;

        const statusDiv = document.getElementById('form-status');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = new FormData(e.target);
            
            try {
                const response = await fetch(e.target.action, {
                    method: 'POST',
                    body: data,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    form.style.display = 'none';
                    statusDiv.innerHTML = `<h3 style="color: var(--color-success-green);">Teşekkürler!</h3><p>Mesajınız başarıyla gönderildi. En kısa sürede size geri dönüş yapacağım.</p>`;
                } else {
                    const responseData = await response.json();
                    const errorMessage = responseData.errors ? responseData.errors.map(error => error.message).join(', ') : 'Bir hata oluştu.';
                    statusDiv.innerHTML = `<p style="color: #ff4d4d;">Hata: ${errorMessage} Lütfen daha sonra tekrar deneyin.</p>`;
                }
            } catch (error) {
                statusDiv.innerHTML = `<p style="color: #ff4d4d;">Bir ağ hatası oluştu. Lütfen daha sonra tekrar deneyin.</p>`;
            }
        });
    };

    /**
     * ------------------------------------------------------------------------
     *  5. AKTİF NAVİGASYON LİNKİNİ İŞARETLEME
     * ------------------------------------------------------------------------
     * Mevcut sayfanın URL'sini alıp navigasyondaki ilgili linke 'active'
     * class'ı ekler.
     */
    const setActiveNavLink = () => {
        const navLinks = document.querySelectorAll('#nav-links a');
        if (!navLinks.length) return;

        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href').split('/').pop() || 'index.html';
            if (linkPage === currentPage) {
                link.classList.add('active');
            }
        });
    };

    /**
     * ------------------------------------------------------------------------
     *  5. PROJE FİLTRELEME YÖNETİMİ
     * ------------------------------------------------------------------------
     * Projelerim sayfasındaki butonlara tıklandığında proje kartlarını
     * kategorilere göre filtreler ve akıcı bir animasyonla gösterir/gizler.
     */
    const handleProjectFiltering = () => {
        const filterContainer = document.querySelector('.filter-buttons');
        if (!filterContainer) return;

        const filterButtons = filterContainer.querySelectorAll('.btn-filter');
        const projectCards = document.querySelectorAll('.projects-grid .project-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Aktif butonu güncelle
                filterContainer.querySelector('.active').classList.remove('active');
                button.classList.add('active');

                const filterValue = button.getAttribute('data-filter');

                projectCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    
                    // Kartı gizle veya göster
                    if (filterValue === 'all' || cardCategory === filterValue) {
                        card.classList.remove('hide');
                    } else {
                        card.classList.add('hide');
                    }
                });
            });
        });
    };

    /**
     * ------------------------------------------------------------------------
     *  UYGULAMA BAŞLATMA
     * ------------------------------------------------------------------------
     */
    const initApp = async () => {
        // Önce component'leri yükle, sonra diğer script'leri çalıştır
        await Promise.all([
            loadComponent('header-placeholder', 'header.html'),
            loadComponent('footer-placeholder', 'footer.html')
        ]);
        
        // Component'ler yüklendikten sonra çalışacak fonksiyonlar
        handleMobileNavigation();
        handleScrollAnimations();
        handleContactForm();
        handleProjectFiltering();
        setActiveNavLink();
        // Gelecekteki Firebase Auth veya diğer modüller buraya eklenebilir.
    };

    initApp();
});