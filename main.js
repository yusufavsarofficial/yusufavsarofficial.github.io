document.addEventListener('DOMContentLoaded', () => {
    // --- Dinamik Header ve Footer Yükleyici ---
    const loadComponent = (url, placeholderId) => {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok for ${url}`);
                }
                return response.text();
            })
            .then(data => {
                document.getElementById(placeholderId).innerHTML = data;
            })
            .catch(error => console.error(`Error loading ${placeholderId}:`, error));
    };

    // Aktif sayfa linkini işaretleyen fonksiyon
    const setActiveLink = () => {
        const navLinks = document.querySelectorAll('#nav-links a');
        const currentPage = window.location.pathname.split('/').pop();

        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href').split('/').pop();
            if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
                link.classList.add('active');
            }
        });
    };

    // Header'ı yükle, sonra menü fonksiyonlarını ve aktif linki ayarla
    loadComponent('header.html', 'header-placeholder').then(() => {
        initializeHamburgerMenu();
        initializeThemeSwitcher();
        setActiveLink();
    });

    // Footer'ı yükle
    loadComponent('footer.html', 'footer-placeholder');

    // Tema değiştirici fonksiyonu
    const initializeThemeSwitcher = () => {
        const themeSwitcher = document.getElementById('theme-switcher');
        const body = document.body;

        if (themeSwitcher) {
            // Sayfa yüklendiğinde kayıtlı temayı uygula
            if (localStorage.getItem('theme') === 'dark') {
                body.classList.add('dark-mode');
            }

            themeSwitcher.addEventListener('click', () => {
                body.classList.toggle('dark-mode');
                // Kullanıcının tercihini kaydet
                if (body.classList.contains('dark-mode')) {
                    localStorage.setItem('theme', 'dark');
                } else {
                    localStorage.setItem('theme', 'light');
                }
            });
        }
    };

    // Hamburger menü fonksiyonunu dinamik olarak yüklenen header için yeniden düzenleyelim
    const initializeHamburgerMenu = () => {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('nav-links');

        if (hamburger && navLinks) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navLinks.classList.toggle('active');
                const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
                hamburger.setAttribute('aria-expanded', !isExpanded);
            });
        }
    };

    // --- Çerez Banner Fonksiyonu (Tüm Sayfalar) ---
    const cookieBanner = document.getElementById('cookieBanner');
    const cookieAcceptBtn = document.getElementById('cookieAcceptBtn');

    if (cookieBanner && cookieAcceptBtn) {
        // Eğer daha önce kabul edilmediyse banner'ı göster
        if (!localStorage.getItem('cookieConsent')) {
            cookieBanner.style.display = 'flex';
        }

        // Kabul et butonuna tıklanınca
        cookieAcceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'true');
            cookieBanner.style.display = 'none';
        });
    }

    // --- Beğeni Butonu Fonksiyonu (Sadece ilgili sayfalarda çalışır) ---
    const likeBtn = document.getElementById('likeBtn');
    const likeCountSpan = document.getElementById('likeCount');

    if (likeBtn && likeCountSpan) {
        const pageId = window.location.pathname; // Her sayfa için benzersiz bir ID
        const likedStateKey = `liked_${pageId}`;
        const likeCountKey = `likes_${pageId}`;

        // Başlangıç değerlerini ayarla
        const initialLikes = parseInt(likeCountSpan.textContent.replace(/[^0-9]/g, ''), 10) || 0;
        let currentLikes = parseInt(localStorage.getItem(likeCountKey), 10);
        if (isNaN(currentLikes)) {
            currentLikes = initialLikes; // Eğer localStorage'da kayıt yoksa, HTML'deki değeri kullan
        }
        
        let isLiked = localStorage.getItem(likedStateKey) === 'true';

        // Butonun başlangıç durumunu ayarla
        if (isLiked) {
            likeBtn.classList.add('liked');
            likeBtn.textContent = 'Beğenildi';
        }
        likeCountSpan.textContent = currentLikes.toLocaleString('tr-TR') + ' beğeni';

        // Tıklama olayını yönet
        likeBtn.addEventListener('click', () => {
            isLiked = !isLiked; // Durumu tersine çevir
            currentLikes += isLiked ? 1 : -1; // Sayıyı artır veya azalt

            localStorage.setItem(likedStateKey, isLiked);
            localStorage.setItem(likeCountKey, currentLikes);

            likeBtn.classList.toggle('liked', isLiked);
            likeBtn.textContent = isLiked ? 'Beğenildi' : 'Beğen';
            likeCountSpan.textContent = currentLikes.toLocaleString('tr-TR') + ' beğeni';
        });
    }

    // --- Geliştirici Araçlarını Engelleme (index.html'e özeldi, globale taşındı) ---
    document.addEventListener('contextmenu', event => event.preventDefault());

    document.onkeydown = function(e) {
        if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0))) || (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0))) {
            return false;
        }
    };

    // --- Proje Filtreleme Fonksiyonu (projelerim.html'e özel) ---
    const filterContainer = document.querySelector('.filter-buttons');
    if (filterContainer) {
        const filterButtons = filterContainer.querySelectorAll('.filter-btn');
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
    }

    // --- İletişim Formu Gönderimi (iletisim.html'e özel) ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        const statusDiv = document.getElementById('form-status');

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Sayfanın yeniden yüklenmesini engelle
            const form = e.target;
            const data = new FormData(form);
            
            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    body: data,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    form.style.display = 'none'; // Formu gizle
                    statusDiv.innerHTML = "<h3>Teşekkürler!</h3><p>Mesajınız başarıyla gönderildi. En kısa sürede size geri dönüş yapacağım.</p>";
                } else {
                    statusDiv.innerHTML = "<p>Bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>";
                }
            } catch (error) {
                statusDiv.innerHTML = "<p>Bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>";
            }
        });
    }

    // --- İletişim Formunu Ürün Bilgisiyle Doldurma ---
    if (contactForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const productName = urlParams.get('product');

        if (productName) {
            const messageTextarea = document.getElementById('message');
            messageTextarea.value = `Merhaba, "${productName}" ürününüz hakkında teklif almak istiyorum.`;
        }
    }

    // --- Blog Yazısı Navigasyonu ---
    const initializePostNavigation = () => {
        const postNavPlaceholder = document.getElementById('post-navigation');
        if (!postNavPlaceholder) return; // Sadece blog yazısı sayfalarında çalışır

        const blogPosts = [
            { url: 'blog-proje-basarisizligi.html', title: 'Bir Projenin Başarısız Olacağı Nasıl Anlaşılır?' },
            { url: 'blog-aws-maliyet.html', title: 'AWS Faturaları Neden Yüksek Gelir?' },
            { url: 'blog-tdd-guvenlik.html', title: 'TDD\'nin Gizli Güvenlik Avantajları' },
            { url: 'blog-golang-vs-python.html', title: 'GoLang ile Eşzamanlılıkta Python\'a Geçiş' },
            { url: 'blog-kubernetes-guvenligi.html', title: 'Kubernetes\'te Policy as Code Hataları' },
            { url: 'blog-ci-cd-kontrol-listesi.html', title: 'Güvenli CI/CD Kontrol Listesi' },
            { url: 'blog-saldirgan-zihniyeti.html', title: 'Saldırgan Zihniyetine Sahip Olmak' },
            { url: 'blog-log-guvenligi.html', title: 'Güvenlikte En Çok İhmal Edilen Şey' },
            { url: 'blog-pentest-yonetimi.html', title: 'Sızma Testi Ekibi Nasıl Yönetilir?' },
            { url: 'blog-bola-zafiyeti.html', title: 'API Güvenliğinde BOLA Zafiyeti' }
        ];

        const currentPage = window.location.pathname.split('/').pop();
        const currentIndex = blogPosts.findIndex(post => post.url === currentPage);

        if (currentIndex === -1) return;

        const prevPost = currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null;
        const nextPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null;

        let navHTML = '';

        if (prevPost) {
            navHTML += `
                <a href="${prevPost.url}" class="nav-prev">
                    <span class="nav-label">&larr; Önceki Yazı</span>
                    <span class="nav-title">${prevPost.title}</span>
                </a>`;
        }

        if (nextPost) {
            navHTML += `
                <a href="${nextPost.url}" class="nav-next">
                    <span class="nav-label">Sonraki Yazı &rarr;</span>
                    <span class="nav-title">${nextPost.title}</span>
                </a>`;
        }

        postNavPlaceholder.innerHTML = navHTML;
    };

    initializePostNavigation();

    // --- Blog Filtreleme Fonksiyonu (blog.html'e özel) ---
    const blogFilterContainer = document.querySelector('.post-list');
    if (blogFilterContainer) { // Sadece blog listesi olan sayfalarda çalışır
        const filterButtons = document.querySelectorAll('.filter-buttons .filter-btn');
        const postCards = document.querySelectorAll('.post-list .post-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Aktif butonu güncelle
                document.querySelector('.filter-buttons .active').classList.remove('active');
                button.classList.add('active');

                const filterValue = button.getAttribute('data-filter');

                postCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    
                    if (filterValue === 'all' || cardCategory === filterValue) {
                        card.classList.remove('hide');
                    } else {
                        card.classList.add('hide');
                    }
                });
            });
        });
    }

    // --- SSS Akordiyon Fonksiyonu (sss.html'e özel) ---
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const summary = item.querySelector('summary');
            summary.addEventListener('click', (e) => {
                // Varsayılan açma/kapama davranışını engelle
                e.preventDefault();

                // Eğer tıklanan zaten açıksa, kapat. Değilse devam et.
                if (item.hasAttribute('open')) {
                    item.removeAttribute('open');
                } else {
                    // Diğer tüm açık olanları kapat
                    faqItems.forEach(otherItem => otherItem.removeAttribute('open'));
                    // Tıklananı aç
                    item.setAttribute('open', '');
                }
            });
        });
    }

    // --- Kod Bloklarına Kopyala Butonu Ekleme ---
    const codeBlocks = document.querySelectorAll('.code-block-wrapper pre code');
    codeBlocks.forEach(codeBlock => {
        const wrapper = codeBlock.parentElement.parentElement;
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.textContent = 'Kopyala';

        copyButton.addEventListener('click', () => {
            const codeToCopy = codeBlock.innerText;
            navigator.clipboard.writeText(codeToCopy).then(() => {
                copyButton.textContent = 'Kopyalandı!';
                setTimeout(() => {
                    copyButton.textContent = 'Kopyala';
                }, 2000);
            }).catch(err => {
                console.error('Kopyalama başarısız oldu:', err);
            });
        });

        wrapper.appendChild(copyButton);
    });
});