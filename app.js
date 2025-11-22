/**
 * YUSUF AVSAR - app.js
 * ------------------------------------------------------------------------
 * Bu dosya, sitenin tüm interaktif özelliklerini yönetir.
 * - Dinamik component yükleyici (Header/Footer)
 * - Mobil navigasyon
 * - Scroll animasyonları
 * - İletişim formu yönetimi
 * - Proje filtreleme
 * - Blog sayfası özellikleri (İçindekiler, kod kopyalama vb.)
 * - Gelişmiş UI özellikleri (Özel imleç, preloader)
 */
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
                console.error(`[ComponentLoader] Error loading ${componentId}:`, error);
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
            // Menü açıkken body'nin kaydırılmasını engelle
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
                    observer.unobserve(entry.target); // Animasyon sadece bir kez çalışsın
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
                    statusDiv.innerHTML = `<div class="form-success"><h3 style="color: var(--color-success-green);">Teşekkürler!</h3><p>Mesajınız başarıyla gönderildi. En kısa sürede size geri dönüş yapacağım.</p></div>`;
                } else {
                    const responseData = await response.json();
                    const errorMessage = responseData.errors ? responseData.errors.map(error => error.message).join(', ') : 'Bilinmeyen bir hata oluştu.';
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
     *  6. PROJE/BLOG FİLTRELEME YÖNETİMİ
     * ------------------------------------------------------------------------
     * Projelerim sayfasındaki butonlara tıklandığında proje kartlarını
     * kategorilere göre filtreler ve akıcı bir animasyonla gösterir/gizler.
     */
    const handleProjectFiltering = () => {
        const filterContainer = document.querySelector('.filter-buttons');
        if (!filterContainer) return;

        const filterButtons = filterContainer.querySelectorAll('.btn-filter');
        const filterableCards = document.querySelectorAll('.projects-grid .project-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Aktif butonu güncelle
                filterContainer.querySelector('.active').classList.remove('active');
                button.classList.add('active');

                const filterValue = button.getAttribute('data-filter');

                filterableCards.forEach(card => {
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
     *  7. BLOG YAZISI SAYFASI ÖZELLİKLERİ
     * ------------------------------------------------------------------------
     * İçindekiler (TOC) oluşturma, aktif başlığı izleme ve kod kopyalama
     * işlevlerini yönetir.
     */
    const handleBlogPostFeatures = () => {
        const tocList = document.getElementById('toc-list');
        const postContent = document.querySelector('.blog-post-content');

        if (!tocList || !postContent) return; // Sadece blog sayfalarında çalışır

        // 1. İçindekiler (TOC) Oluşturma
        const headings = postContent.querySelectorAll('h2, h3');
        const tocItems = [];

        headings.forEach(heading => {
            const id = heading.getAttribute('id');
            if (!id) return;

            const text = heading.textContent;
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.setAttribute('href', `#${id}`);
            a.textContent = text;
            li.appendChild(a);
            tocList.appendChild(li);
            tocItems.push(a);
        });

        // 2. Aktif Başlığı İzleme
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const id = entry.target.getAttribute('id');
                const tocLink = tocList.querySelector(`a[href="#${id}"]`);
                
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    // Önce tüm aktif class'ları temizle
                    tocItems.forEach(item => item.classList.remove('active'));
                    // Sonra ilgili linke ekle
                    if(tocLink) tocLink.classList.add('active');
                }
            });
        }, { rootMargin: "0px 0px -50% 0px", threshold: 0.5 });

        headings.forEach(heading => observer.observe(heading));

        // 3. Kod Kopyalama Butonları
        const codeBlocks = document.querySelectorAll('.code-block-wrapper');
        codeBlocks.forEach(wrapper => {
            const copyButton = wrapper.querySelector('.copy-btn');
            const codeElement = wrapper.querySelector('code');

            if (copyButton && codeElement) {
                copyButton.addEventListener('click', () => {
                    navigator.clipboard.writeText(codeElement.innerText).then(() => {
                        copyButton.textContent = 'Kopyalandı!';
                        setTimeout(() => {
                            copyButton.textContent = 'Kopyala';
                        }, 2000);
                    }).catch(err => {
                        console.error('Kopyalama başarısız oldu:', err);
                        copyButton.textContent = 'Hata';
                    });
                });
            }
        });
    };

    /**
     * ------------------------------------------------------------------------
     *  8. BLOG YAZILARINDA BEĞENİ BUTONU
     * ------------------------------------------------------------------------
     * Beğeni butonuna tıklandığında sayıyı artırır ve localStorage'da saklar.
     */
    const handleLikeButton = () => {
        const likeBtn = document.getElementById('likeBtn');
        const likeCountSpan = document.getElementById('likeCount');
        if (!likeBtn || !likeCountSpan) return;

        const pageId = window.location.pathname;
        let likeCount = parseInt(localStorage.getItem(`likes_${pageId}`) || likeCountSpan.textContent.replace(/\D/g, '')) || 89530;
        
        const updateLikeCount = () => {
            likeCountSpan.textContent = `${likeCount.toLocaleString('tr-TR')} beğeni`;
        };

        likeBtn.addEventListener('click', () => {
            likeCount++;
            localStorage.setItem(`likes_${pageId}`, likeCount);
            updateLikeCount();
            likeBtn.disabled = true; // Tekrar tıklamayı engelle
            likeBtn.textContent = "Beğenildi!";
        });

        updateLikeCount(); // Sayfa yüklendiğinde sayıyı güncelle
    };

    /**
     * ------------------------------------------------------------------------
     *  X. TEMA DEĞİŞTİRİCİ (DARK/LIGHT MODE)
     * ------------------------------------------------------------------------
     * Kullanıcının tema tercihini yönetir ve localStorage'da saklar.
     */
    const handleThemeSwitcher = () => {
        const themeSwitcher = document.getElementById('theme-switcher');
        if (!themeSwitcher) return;

        const body = document.body;

        // Sayfa yüklendiğinde kayıtlı temayı uygula
        if (localStorage.getItem('theme') === 'dark') {
            body.classList.add('dark-mode');
        }

        themeSwitcher.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            // Kullanıcının tercihini kaydet
            localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    };

    /**
     * ------------------------------------------------------------------------
     *  Y. SSS AKORDİYON YÖNETİMİ
     * ------------------------------------------------------------------------
     * SSS sayfasında, aynı anda sadece bir sorunun açık kalmasını sağlar.
     */
    const handleFAQ = () => {
        const faqItems = document.querySelectorAll('.faq-item');
        if (!faqItems.length) return;

        faqItems.forEach(item => {
            const summary = item.querySelector('summary');
            summary.addEventListener('click', (e) => {
                e.preventDefault(); // Tarayıcının varsayılan davranışını engelle
                const isOpen = item.hasAttribute('open');
                faqItems.forEach(otherItem => otherItem.removeAttribute('open'));
                if (!isOpen) item.setAttribute('open', '');
            });
        });
    };
    /**
     * ------------------------------------------------------------------------
     *  7. İNTERAKTİF SİMÜLASYONLAR (GELİŞMİŞ)
     * ------------------------------------------------------------------------
     * Her bir simülasyonu kendi içinde interaktif ve "hack" temalı hale getirir.
     */
    const handleSimulations = () => {
        const typeLog = (logElement, messages, onComplete) => {
            let i = 0;
            const interval = setInterval(() => {
                if (i < messages.length) {
                    const li = document.createElement('li');
                    li.className = messages[i].class;
                    li.innerHTML = messages[i].text;
                    logElement.appendChild(li);
                    logElement.scrollTop = logElement.scrollHeight;
                    i++;
                } else {
                    clearInterval(interval);
                    if (onComplete) onComplete();
                }
            }, messages[i]?.delay || 300);
        };

        // --- Simülasyon 1: Programlama & Derleme ---
        const compileBtn = document.getElementById('compile-code-btn');
        if (compileBtn) {
            const runBtn = document.getElementById('run-code-btn');
            const compileLog = document.getElementById('compile-log');
            const codeToType = `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("SYSTEM BREACHED: ACCESS GRANTED")\n}`;
            
            new Typed('#code-simulation-output', { strings: [codeToType.trim()], typeSpeed: 25, showCursor: true, cursorChar: '_' });

            compileBtn.addEventListener('click', () => {
                compileBtn.disabled = true;
                runBtn.disabled = true;
                compileLog.innerHTML = '';
                typeLog(compileLog, [
                    { text: '$ go build -o exploit.bin', class: 'log-command' },
                    { text: 'Parsing source code...', class: 'log-info' },
                    { text: 'Linking dependencies...', class: 'log-info' },
                    { text: '[+] Compilation successful. Binary `exploit.bin` created.', class: 'log-success' }
                ], () => {
                    runBtn.disabled = false;
                });
            });

            runBtn.addEventListener('click', () => {
                runBtn.disabled = true;
                typeLog(compileLog, [
                    { text: '$ ./exploit.bin', class: 'log-command' },
                    { text: '> SYSTEM BREACHED: ACCESS GRANTED', class: 'log-highlight', delay: 1000 }
                ], () => {
                    compileBtn.disabled = false;
                });
            });
        }

        // --- Simülasyon 2: Ağ Zafiyet Taraması ---
        const runScanBtn = document.getElementById('run-scan-btn');
        if (runScanBtn) {
            const scanLog = document.getElementById('scan-log');
            const scanInput = document.getElementById('scan-target-input');

            runScanBtn.addEventListener('click', () => {
                runScanBtn.disabled = true;
                scanLog.innerHTML = '';
                typeLog(scanLog, [
                    { text: `$ nmap -p- -sV ${scanInput.value}`, class: 'log-command' },
                    { text: 'Starting SecurCore Network Scanner...', class: 'log-info' },
                    { text: 'Scanning 192.168.1.1...', class: 'log-info' },
                    { text: 'Scanning 192.168.1.2...', class: 'log-info' },
                    { text: 'Host: 192.168.1.32', class: 'log-info' },
                    { text: '  PORT 22/tcp   open  ssh      OpenSSH 8.2p1', class: 'log-success' },
                    { text: '  PORT 80/tcp   closed http', class: 'log-fail' },
                    { text: '  PORT 443/tcp  closed https', class: 'log-fail' },
                    { text: 'Host: 192.168.1.55', class: 'log-info' },
                    { text: '  PORT 8080/tcp open  http-proxy', class: 'log-success' },
                    { text: '  [!] VULNERABILITY DETECTED: Apache Log4j (CVE-2021-44228)', class: 'log-highlight', delay: 500 },
                    { text: 'Scan complete. 1 critical vulnerability found.', class: 'log-info' }
                ], () => {
                    runScanBtn.disabled = false;
                });
            });
        }

        // --- Simülasyon 3: Kriptografi & Veri Sızıntısı ---
        const decryptBtn = document.getElementById('decrypt-btn');
        if (decryptBtn) {
            const encryptedBlock = document.getElementById('encrypted-data-block');
            const decryptLog = document.getElementById('decrypt-log');
            const secretData = "LAUNCH_CODES=ALPHA-DELTA-9;TARGET=MAIN_SERVER;USER=ADMIN";
            const encryptedData = "5A6F5A584A6C4367523256306157356A623230675957356B5A584A304C6D4E766253493D";
            
            encryptedBlock.textContent = encryptedData;

            decryptBtn.addEventListener('click', () => {
                decryptBtn.disabled = true;
                decryptLog.innerHTML = '';
                typeLog(decryptLog, [
                    { text: 'Initializing AES-256-GCM decryptor...', class: 'log-info' },
                    { text: 'Brute-forcing key space... (Simulated)', class: 'log-info' },
                    { text: 'Attempting key: 0x...a1f3', class: 'log-fail' },
                    { text: 'Attempting key: 0x...c4b8', class: 'log-fail' },
                    { text: '[+] Key Found: `sIlEnT_gUaRdIaN_kEy`', class: 'log-success', delay: 800 },
                    { text: 'Decrypting data packet...', class: 'log-info' },
                    { text: `[+] DECRYPTION SUCCESSFUL: ${secretData}`, class: 'log-highlight', delay: 1000 }
                ], () => {
                    decryptBtn.disabled = false;
                });
            });
        }
    };

    /**
     * ------------------------------------------------------------------------
     *  9. NIRVANA İYİLEŞTİRMELERİ (GELİŞMİŞ UI)
     * ------------------------------------------------------------------------
     * Özel imleç ve sayfa ön yükleyici gibi "High-End" özellikleri yönetir.
     */
    const handleNirvanaFeatures = () => {
        // --- Sayfa Ön Yükleyici (Preloader) ---
        const preloader = document.querySelector('.preloader');
        if (preloader) {
            window.addEventListener('load', () => {
                preloader.classList.add('loaded');
            });
        }

        // --- Özel İmleç (Custom Cursor) ---
        const cursorDot = document.querySelector('.cursor-dot');
        const cursorOutline = document.querySelector('.cursor-outline');

        if (cursorDot && cursorOutline) {
            window.addEventListener('mousemove', (e) => {
                const posX = e.clientX;
                const posY = e.clientY;

                cursorDot.style.left = `${posX}px`;
                cursorDot.style.top = `${posY}px`;

                cursorOutline.animate({
                    left: `${posX}px`,
                    top: `${posY}px`
                }, { duration: 500, fill: 'forwards' });
            });

            const interactiveElements = document.querySelectorAll('a, button, .project-card, .simulation-terminal button, summary, .faq-item');
            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    cursorOutline.classList.add('cursor-grow');
                });
                el.addEventListener('mouseleave', () => {
                    cursorOutline.classList.remove('cursor-grow');
                });
            });
        }
    };

    /**
     * ------------------------------------------------------------------------
     *  UYGULAMA BAŞLATMA
     * ------------------------------------------------------------------------
     */
    const initApp = async () => {
        // Nirvana özelliklerini en başta çalıştır
        handleNirvanaFeatures();

        // Önce component'leri yükle, sonra diğer script'leri çalıştır
        await Promise.all([
            loadComponent('header-placeholder', 'header.html'),
            loadComponent('footer-placeholder', 'footer.html')
        ]);

        // Component'ler yüklendikten sonra çalışacak fonksiyonlar
        handleMobileNavigation();
        setActiveNavLink();
        handleThemeSwitcher();

        handleScrollAnimations();
        handleContactForm();
        handleProjectFiltering(); // Proje ve Blog filtreleme
        handleBlogPostFeatures();
        handleSimulations();
        handleLikeButton(); // Beğeni butonunu aktifleştir
        handleFAQ(); // SSS akordiyonunu burada başlat
    };

    initApp();
});