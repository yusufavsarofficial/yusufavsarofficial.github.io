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
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            // Erişilebilirlik için ARIA durumunu güncelle
            hamburger.setAttribute('aria-expanded', !isExpanded);
            
            // --- MODERN KAYDIRMA ENGELLEME YÖNTEMİ ---
            // Menü aktif olduğunda hem <html> hem de <body> etiketlerine bir sınıf ekleyerek kaydırmayı engelle
            document.documentElement.classList.toggle('no-scroll', navLinks.classList.contains('active'));
            document.body.classList.toggle('no-scroll', navLinks.classList.contains('active'));
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
                    // Güvenli DOM oluşturma
                    statusDiv.innerHTML = ''; // Önce temizle
                    const successDiv = document.createElement('div');
                    successDiv.className = 'form-success';
                    successDiv.innerHTML = `<h3 style="color: var(--color-success-green);">Teşekkürler!</h3><p>Mesajınız başarıyla gönderildi. En kısa sürede size geri dönüş yapacağım.</p>`;
                    statusDiv.appendChild(successDiv);
                } else {
                    const responseData = await response.json();
                    const errorMessage = responseData.errors ? responseData.errors.map(error => error.message).join(', ') : 'Bilinmeyen bir hata oluştu.';
                    statusDiv.innerHTML = ''; // Temizle
                    const errorP = document.createElement('p');
                    errorP.style.color = '#ff4d4d';
                    errorP.textContent = `Hata: ${errorMessage} Lütfen daha sonra tekrar deneyin.`;
                    statusDiv.appendChild(errorP);
                }
            } catch (error) {
                statusDiv.innerHTML = ''; // Temizle
                statusDiv.innerHTML = `<p style="color: #ff4d4d;">Bir ağ hatası oluştu. Lütfen daha sonra tekrar deneyin.</p>`; // Bu statik olduğu için güvenli
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

        let currentPage = window.location.pathname.split('/').pop();
        if (currentPage === '' || currentPage === 'index.html') currentPage = 'index.html';

        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href').split('/').pop();
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
        // Hem sss.html hem de faaliyetlerim.html'deki akordiyonları hedefle
        const accordions = document.querySelectorAll('.faq-item details');
        if (!accordions.length) return;

        accordions.forEach(accordion => {
            accordion.addEventListener('toggle', (event) => {
                // Sadece bir akordiyon açıldığında diğerlerini kapat
                if (accordion.open) {
                    accordions.forEach(otherAccordion => {
                        if (otherAccordion !== accordion) {
                            otherAccordion.open = false;
                        }
                    });
                }
            });

            // Tarayıcının varsayılan animasyonunu korumak için summary'e tıklamayı yönet
            const summary = accordion.querySelector('summary');
            summary?.addEventListener('click', (e) => {
                // Eğer zaten açıksa ve tekrar tıklanıyorsa, toggle olayı tetiklenmez. Manuel kapat.
                if (accordion.open && document.activeElement === summary) {
                    setTimeout(() => { accordion.open = false; }, 0);
                }
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
        const mainLogEl = document.getElementById('main-simulation-log');
        const mainStatusEl = document.getElementById('main-simulation-status');
        const mainSpinner = document.getElementById('main-spinner');
        const terminalTitleEl = document.getElementById('terminal-title');
        const commandButtons = document.querySelectorAll('.btn-command');
        if (!mainLogEl || !mainStatusEl || !commandButtons.length) return;

        const runSimulation = async (messages, onComplete, commandName) => {
            const logEl = mainLogEl;
            const statusEl = mainStatusEl;
            const spinner = mainSpinner;
            logEl.innerHTML = '';

            const typeCharacter = (element, text, speed) => {
                 return new Promise(resolve => {
                     let i = 0;
                     const typing = () => {
                         if (i < text.length) {
                             const char = text.charAt(i);
                             let part;
 
                             if (char === '<') {
                                 // HTML etiketini bul ve atla
                                 const tagEnd = text.indexOf('>', i);
                                 if (tagEnd !== -1) {
                                     part = text.substring(i, tagEnd + 1);
                                     i = tagEnd;
                                 } else {
                                     // Kapanmayan etiket, metin olarak işle
                                     part = document.createTextNode(char);
                                 }
                             } else {
                                 // Normal metin karakteri, güvenli hale getir
                                 part = document.createTextNode(char);
                             }
 
                             // Oluşturulan bölümü (HTML etiketi veya güvenli metin) ekle
                             if (typeof part === 'string') {
                                 // Bu, HTML etiketi olduğu anlamına gelir
                                 element.innerHTML += part;
                             } else {
                                 // Bu, bir TextNode olduğu anlamına gelir
                                 element.appendChild(part);
                             }
 
                             i++;
                             setTimeout(typing, speed);
                         } else {
                             resolve();
                         }
                     };
                     typing();
                 });
             };

            // Simülasyon başlangıcı
            statusEl.textContent = 'ÇALIŞIYOR...';
            statusEl.className = 'simulation-result log-info';
            if(spinner) spinner.style.display = 'block';
            if(terminalTitleEl) terminalTitleEl.textContent = `İŞLEM: ${commandName}`;
            const commandMessage = { text: `$ ./run-op ${commandName}`, class: 'log-command', delay: 100 };
            messages.unshift(commandMessage);

            for (const message of messages) {
                const li = document.createElement('li');
                logEl.appendChild(li);
                await typeCharacter(li, message.text, 15); // Yazma hızı
                li.className = message.class; // Stili en son uygula

                logEl.scrollTop = logEl.scrollHeight;
                await new Promise(resolve => setTimeout(resolve, message.delay || 50));
            }

            // Simülasyon sonu
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.class.includes('log-fail') || lastMessage.class.includes('log-highlight')) {
                statusEl.textContent = 'BAŞARISIZ/UYARI';
                statusEl.className = 'simulation-result log-fail';
            } else {
                statusEl.textContent = 'TAMAMLANDI';
                statusEl.className = 'simulation-result log-success';
            }
            if(terminalTitleEl) terminalTitleEl.textContent = 'ANA OPERASYON KONSOLU';
            if(spinner) spinner.style.display = 'none';
            if (onComplete) onComplete();
        };

        const simulations = {
            'run-sqli-btn': {
                name: 'sql_injection_attack',
                scenario: [
                    { text: 'INFO: Hedef sisteme bağlanılıyor: 10.0.2.15:80...', class: 'log-info' },
                    { text: 'SUCCESS: Bağlantı kuruldu. HTTP 200 OK.', class: 'log-success', delay: 300 },
                    { text: 'INFO: `login.php` üzerinde zafiyet taraması başlatılıyor...', class: 'log-info' },
                    { text: 'INFO: Test payload\'u gönderiliyor: `user=\' AND 1=1 --`', class: 'log-info', delay: 800 },
                    { text: 'SUCCESS: Sistemden geçerli yanıt alındı. Zafiyet doğrulandı!', class: 'log-success' },
                    { text: 'INFO: Veritabanı sürümü çekiliyor: `UNION SELECT @@VERSION, NULL --`', class: 'log-info', delay: 500 },
                    { text: 'SUCCESS: Veritabanı: <span class="log-highlight">MySQL 8.0.2</span>', class: 'log-success' },
                    { text: 'INFO: Kullanıcı tablosu çekiliyor: `UNION SELECT table_name, NULL FROM information_schema.tables --`', class: 'log-info', delay: 1000 },
                    { text: 'CRITICAL: Yetkisiz veri sızdırıldı: <span class="log-highlight">[users, passwords, sessions]</span>', class: 'log-fail', delay: 500 },
                    { text: 'SUCCESS: Operasyon tamamlandı. <span class="log-highlight">admin</span> kimlik bilgileri ele geçirildi.', class: 'log-success' }
                ]
            },
            'run-log-analysis-btn': {
                name: 'live_log_analysis',
                scenario: [
                    { text: 'INFO: Canlı log akışı başlatıldı: `/var/log/auth.log`', class: 'log-info' },
                    { text: 'LOG: [sshd:2154] Failed password for root from <span class="log-highlight">185.191.171.13</span> port 48122 ssh2', class: 'log-info', delay: 1000 },
                    { text: 'LOG: [sshd:2156] Failed password for root from <span class="log-highlight">185.191.171.13</span> port 48128 ssh2', class: 'log-info', delay: 500 },
                    { text: 'LOG: [sshd:2158] Failed password for root from <span class="log-highlight">185.191.171.13</span> port 48134 ssh2', class: 'log-info', delay: 300 },
                    { text: 'LOG: [sshd:2160] Failed password for root from <span class="log-highlight">185.191.171.13</span> port 48140 ssh2', class: 'log-info', delay: 200 },
                    { text: 'ALERT: [IDS] Tek bir IP\'den çok sayıda başarısız deneme tespit edildi. Potansiyel Brute-Force saldırısı!', class: 'log-fail', delay: 500 },
                    { text: 'ACTION: [Fail2Ban] IP <span class="log-highlight">185.191.171.13</span> için `sshd` jail kuralı tetiklendi.', class: 'log-info' },
                    { text: 'SUCCESS: [Firewall] IP <span class="log-highlight">185.191.171.13</span> kalıcı olarak engellendi.', class: 'log-success' }
                ]
            },
            'run-db-migration-btn': {
                name: 'db_migration',
                scenario: [
                    { text: 'INFO: [Alembic] Veritabanı bağlantısı kuruluyor: `postgresql://user:***@prod-db`', class: 'log-info' },
                    { text: 'INFO: [Alembic] Mevcut revizyon: `e1a2b3c4d5`', class: 'log-info' },
                    { text: 'INFO: [Alembic] Hedef revizyon: `f6g7h8i9j0`', class: 'log-info', delay: 500 },
                    { text: 'INFO: [Alembic] Yükseltme `e1a2b3c4d5` -> `f6g7h8i9j0` başlatılıyor...', class: 'log-info' },
                    { text: 'SQL:   ALTER TABLE users ADD COLUMN email_verified BOOLEAN', class: 'log-info', delay: 800 },
                    { text: 'SQL:   UPDATE users SET email_verified = false', class: 'log-info', delay: 400 },
                    { text: 'SQL:   ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL', class: 'log-info', delay: 400 },
                    { text: 'INFO: [Alembic] Geçiş tamamlandı. Veritabanı şeması güncel.', class: 'log-success' }
                ]
            },
            'run-git-merge-btn': {
                name: 'git_version_control',
                scenario: [
                    { text: 'COMMAND: $ git checkout main', class: 'log-command' },
                    { text: 'INFO: Switched to branch \'main\'. Your branch is up to date with \'origin/main\'.', class: 'log-info', delay: 300 },
                    { text: 'COMMAND: $ git merge feature/new-auth', class: 'log-command' },
                    { text: 'INFO: Auto-merging src/auth.js', class: 'log-info', delay: 800 },
                    { text: 'CONFLICT: (content): Merge conflict in <span class="log-highlight">src/auth.js</span>', class: 'log-fail', delay: 500 },
                    { text: 'ERROR: Automatic merge failed; fix conflicts and then commit the result.', class: 'log-fail' },
                    { text: 'HINT: Çakışmayı çözmek için `src/auth.js` dosyasını manuel olarak düzenleyin.', class: 'log-highlight' }
                ]
            },
            'run-goroutine-btn': {
                name: 'go_concurrency_test',
                scenario: [
                    { text: 'COMMAND: $ go run main.go --workers=10000', class: 'log-command' },
                    { text: 'INFO: Eşzamanlılık testi başlatılıyor...', class: 'log-info', delay: 200 },
                    { text: 'INFO: 10,000 adet goroutine oluşturuluyor ve görev kuyruğuna ekleniyor...', class: 'log-info', delay: 500 },
                    { text: 'WORKER: [Worker 345] Görev #8912 işleniyor...', class: 'log-info', delay: 50 },
                    { text: 'WORKER: [Worker 8123] Görev #1234 işleniyor...', class: 'log-info', delay: 50 },
                    { text: 'WORKER: [Worker 567] Görev #5678 işleniyor...', class: 'log-info', delay: 50 },
                    { text: 'INFO: Tüm görevler tamamlandı. Sonuçlar toplanıyor...', class: 'log-info', delay: 1000 },
                    { text: 'SUCCESS: 10,000 görevin tamamı <span class="log-highlight">89ms</span> gibi rekor bir sürede tamamlandı.', class: 'log-success' }
                ]
            },
            'run-cicd-btn': {
                name: 'secure_cicd_pipeline',
                scenario: [
                    { text: 'INFO: [CI/CD] Pipeline `commit: a3f4d5e` için tetiklendi.', class: 'log-info' },
                    { text: 'STAGE: [Build] Docker imajı oluşturuluyor... <span class="log-success">OK</span>', class: 'log-info', delay: 800 },
                    { text: 'STAGE: [Test] Birim testleri çalıştırılıyor... %100 Kapsam. <span class="log-success">OK</span>', class: 'log-info', delay: 600 },
                    { text: 'STAGE: [SAST] Statik kod analizi (SonarQube)...', class: 'log-info', delay: 1000 },
                    { text: 'SUCCESS: [SAST] 0 Kritik, 2 Major, 5 Minor bulgu. Kalite eşiği: GEÇTİ.', class: 'log-success' },
                    { text: 'STAGE: [SCA] Bağımlılık analizi (Snyk)...', class: 'log-info', delay: 1200 },
                    { text: 'CRITICAL: [SCA] Yüksek riskli zafiyet bulundu: <span class="log-highlight">log4j:2.14.1 (CVE-2021-44228)</span>', class: 'log-fail' },
                    { text: 'ABORTED: [CI/CD] GÜVENLİK EŞİĞİ AŞILDI. PIPELINE DURDURULDU.', class: 'log-fail', delay: 500 },
                    { text: 'ACTION: Dağıtım iptal edildi. Geliştirici ekibine bildirim gönderildi.', class: 'log-highlight' }
                ]
            },
            'run-dns-poisoning-btn': {
                name: 'dns_cache_poisoning',
                scenario: [
                    { text: 'INFO: [Ettercap] DNS zehirleme modülü başlatılıyor...', class: 'log-info' },
                    { text: 'INFO: Hedef taranıyor: 192.168.1.105', class: 'log-info', delay: 500 },
                    { text: 'INFO: Ağ geçidi (Gateway) tespit edildi: 192.168.1.1', class: 'log-info' },
                    { text: 'ACTION: ARP spoofing başlatıldı. Hedef ile ağ geçidi arasına giriliyor...', class: 'log-highlight', delay: 1000 },
                    { text: 'SUCCESS: Man-in-the-middle pozisyonu başarıyla alındı.', class: 'log-success' },
                    { text: 'INFO: DNS sorguları dinleniyor...', class: 'log-info', delay: 1500 },
                    { text: 'LOG: Hedef (192.168.1.105) -> DNS Sorgusu: A? banka.com', class: 'log-info', delay: 800 },
                    { text: 'CRITICAL: Sorgu yakalandı! Sahte DNS yanıtı gönderiliyor...', class: 'log-fail' },
                    { text: 'ACTION: DNS Yanıtı: banka.com -> <span class="log-highlight">10.0.8.45</span> (Sahte Sunucu)', class: 'log-highlight', delay: 1000 },
                    { text: 'SUCCESS: Hedefin DNS önbelleği başarıyla zehirlendi. Yönlendirme aktif.', class: 'log-success' }
                ]
            }
        };

        commandButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const sim = simulations[btn.id];
                if (!sim) return;

                const card = btn.closest('.simulation-card');

                // Bir simülasyon çalışırken diğerlerini devre dışı bırak
                commandButtons.forEach(b => b.disabled = true);

                // Buton metnini ve ikonunu güncelle
                const originalButtonHTML = btn.innerHTML;
                btn.innerHTML = '<div class="spinner-sm"></div> Çalışıyor...';

                // Tıklanan butona ve karta "çalışıyor" stili ekle
                if (card) card.classList.add('running');
                btn.classList.add('running');

                runSimulation(sim.scenario, () => {
                    // Simülasyon bittiğinde tüm butonları tekrar aktif et
                    commandButtons.forEach(b => b.disabled = false);

                    // Butonu orijinal haline döndür
                    btn.innerHTML = originalButtonHTML;

                    // "çalışıyor" stilini karttan ve butondan kaldır
                    if (card) card.classList.remove('running');
                    btn.classList.remove('running');
                }, sim.name);
            });
        });

        // Sayfa yüklendiğinde "boot-up" animasyonunu başlat
        const bootUpSequence = [
            { text: 'Sistem başlatılıyor...', class: 'log-info' },
            { text: 'Çekirdek modülleri yükleniyor... [OK]', class: 'log-info', delay: 300 },
            { text: 'Ağ arayüzleri yapılandırılıyor... [OK]', class: 'log-info', delay: 400 },
            { text: 'Güvenlik protokolleri aktif ediliyor... [OK]', class: 'log-info', delay: 500 },
            { text: 'SentinelPipe v2.1 dinlemede... [OK]', class: 'log-success', delay: 200 },
            { text: 'Tüm sistemler hazır. Operasyon bekleniyor...', class: 'boot-sequence log-success' }
        ];

        const runBootUp = () => {
            const terminalPanel = document.querySelector('.main-log-panel');
            if (terminalPanel) terminalPanel.classList.add('booting');
            commandButtons.forEach(b => b.disabled = true); // Boot sırasında butonlar pasif
            runSimulation(bootUpSequence, () => {
                commandButtons.forEach(b => b.disabled = false);
                if (terminalPanel) terminalPanel.classList.remove('booting');
                mainLogEl.innerHTML = '<li class="log-info">Sistemler hazır. Komut bekleniyor...</li>';
            }, 'system_boot');
        };
        runBootUp();

        // Terminal kontrol butonlarına işlevsellik ekle
        const terminal = document.querySelector('.main-log-panel');
        if (!terminal) return;

        const closeBtn = terminal.querySelector('.control-btn.close');
        closeBtn?.addEventListener('click', () => {
            terminal.classList.add('closing');
            // Animasyon bittikten sonra elementi gizle ama tamamen kaldırma
            // Sayfa yenilenince geri gelecektir.
            setTimeout(() => {
                terminal.style.visibility = 'hidden';
            }, 500);
        });

        // Temizle butonuna işlevsellik ekle
        const clearBtn = document.getElementById('clear-terminal-btn');
        clearBtn?.addEventListener('click', () => {
            mainLogEl.innerHTML = '<li class="log-info">Konsol temizlendi. Yeni komut bekleniyor...</li>';
            mainStatusEl.textContent = 'BEKLEMEDE';
        });
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

        // Sadece fare destekleyen cihazlarda imleç efektini çalıştır
        const isPointerDevice = window.matchMedia('(pointer: fine)').matches;
        if (!isPointerDevice) return;

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

            const interactiveElements = document.querySelectorAll('a, button, .project-card, .simulation-terminal button, summary, .faq-item, .scan-input');
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
     *  11. SOSYAL MEDYA PAYLAŞIM BUTONLARI
     * ------------------------------------------------------------------------
     * Blog yazılarının sonunda yer alan paylaşım butonlarının işlevselliğini
     * yönetir.
     */
    const handleShareButtons = () => {
        const shareSection = document.querySelector('.share-section');
        if (!shareSection) return;

        const pageUrl = window.location.href;
        const pageTitle = document.title;
        const textToShare = `${pageTitle} - Yusuf Avşar`;

        const twitterBtn = document.getElementById('share-twitter');
        const linkedinBtn = document.getElementById('share-linkedin');
        const copyLinkBtn = document.getElementById('copy-link-btn');

        if (twitterBtn) {
            twitterBtn.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(textToShare)}`;
        }

        if (linkedinBtn) {
            linkedinBtn.href = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(pageTitle)}`;
        }

        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(pageUrl).then(() => {
                    const originalIcon = copyLinkBtn.innerHTML;
                    copyLinkBtn.innerHTML = `<i class="fa-solid fa-check"></i>`;
                    setTimeout(() => {
                        copyLinkBtn.innerHTML = originalIcon;
                    }, 2000);
                }).catch(err => {
                    console.error('Bağlantı kopyalanamadı:', err);
                });
            });
        }
    };

    /**
     * ------------------------------------------------------------------------
     *  10. GÜVENLİ İÇERİK KORUMASI
     * ------------------------------------------------------------------------
     * Belirli sayfalardaki içeriğin kopyalanmasını ve ekran görüntüsü
     * alınmasını zorlaştıran özellikleri yönetir.
     */
    const handleSecureContent = () => {
        const secureElement = document.querySelector('.secure-content');
        const watermark = document.querySelector('.secure-watermark');
        if (!secureElement) return;

        // Fare ile kopyalama ve sağ tık menüsünü engelle
        secureElement.addEventListener('copy', (e) => e.preventDefault());
        secureElement.addEventListener('cut', (e) => e.preventDefault());
        secureElement.addEventListener('contextmenu', (e) => e.preventDefault());

        // Klavye kısayollarını (Ctrl+C, Ctrl+A, Ctrl+X vb.) engelle
        document.addEventListener('keydown', (e) => {
            // Eğer olay korumalı alanın içindeyse
            if (secureElement.contains(e.target)) {
                // Ctrl veya Cmd (Mac) tuşlarına basılıyken
                if (e.ctrlKey || e.metaKey) {
                    // C, X, A, U, S, P tuşlarını engelle (Copy, Cut, Select All, View Source, Save, Print)
                    if (['C', 'X', 'A', 'U', 'S', 'P'].includes(e.key.toUpperCase())) {
                        e.preventDefault();
                    }
                }
            }
        });

        // Dinamik Filigranı fareyi takip ettir
        if (watermark) {
            // Sadece fare destekleyen cihazlarda filigranı çalıştır
            const isPointerDevice = window.matchMedia('(pointer: fine)').matches;
            if (!isPointerDevice) return;

            window.addEventListener('mousemove', (e) => {
                const posX = e.clientX;
                const posY = e.clientY;
                watermark.style.left = `${posX}px`;
                watermark.style.top = `${posY}px`;
            });
        }

        // Ekran görüntüsü almayı zorlaştırmak için bulanıklaştırma
        window.addEventListener('blur', () => {
            // Sadece .secure-content elementine sahip sayfalarda blur efekti uygula
            if (secureElement) {
                document.body.classList.add('content-blurred');
            }
        });
        window.addEventListener('focus', () => {
            if (secureElement) {
                document.body.classList.remove('content-blurred');
            }
        });
    };

    /**
     * ------------------------------------------------------------------------
     *  12. GELİŞTİRİCİ ARAÇLARI ENGELLEME (ANTI-DEBUGGING)
     * ------------------------------------------------------------------------
     * Kullanıcının tarayıcı geliştirici araçlarını açmasını zorlaştırır.
     * Not: Bu %100 engellenemez, sadece caydırıcı bir önlemdir.
     */
    const handleAntiDebugging = () => {
        // Sağ tık menüsünü tamamen engelle
        document.addEventListener('contextmenu', (e) => e.preventDefault());

        // Geliştirici araçlarını açan klavye kısayollarını engelle
        document.addEventListener('keydown', (e) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
            }
            // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
            if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
                e.preventDefault();
            }
            // Ctrl+U (View Source)
            if (e.ctrlKey && e.key.toUpperCase() === 'U') {
                e.preventDefault();
            }
        });

        // Geliştirici araçları açıldığında sürekli debugger tetikle
        const checkDevTools = () => {
            // Bu fonksiyonun içine debugger koymak, araçlar açıldığında kodu duraklatır.
            debugger;
        };

        setInterval(checkDevTools, 1000); // Her saniye kontrol et
    };

    /**
     * ------------------------------------------------------------------------
     *  13. ANA SAYFA BAŞLIK ANİMASYONU
     * ------------------------------------------------------------------------
     * Ana sayfadaki "wavy-headline" başlığının harflerine dalga efekti için
     * gecikme (delay) atar.
     */
    const handleWavyHeadline = () => {
        const wavyHeadline = document.querySelector('.wavy-headline');
        if (!wavyHeadline) return; // Element yoksa çık

        // Oturum bazında animasyonun çalışıp çalışmadığını kontrol et
        const animationHasRun = sessionStorage.getItem('wavyAnimationHasRun');

        if (!animationHasRun) {
            // Animasyon bu oturumda daha önce çalışmadıysa, class'ı ekle ve gecikmeleri ayarla
            wavyHeadline.classList.add('initial-animation');
            wavyHeadline.querySelectorAll('span:not(.space)').forEach((span, index) => {
                span.style.animationDelay = `${index * 0.05}s`;
            });
            // Animasyonun çalıştığını oturum için işaretle
            // Bu, kullanıcı sayfalar arası gezinip geri döndüğünde animasyonun tekrar oynamasını engeller.
            sessionStorage.setItem('wavyAnimationHasRun', 'true');
        }
    };
    /**
     * ------------------------------------------------------------------------
     *  14. FOOTER'DA DİNAMİK YIL
     * ------------------------------------------------------------------------
     * Footer'daki telif hakkı yılını otomatik olarak günceller.
     */
    const handleDynamicYear = () => {
        const yearSpan = document.getElementById('current-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
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
        handleDynamicYear(); // Dinamik yılı ayarla
        handleThemeSwitcher();
        handleWavyHeadline(); // Dalga animasyonunu başlat

        handleScrollAnimations();
        handleContactForm();
        handleProjectFiltering(); // Proje ve Blog filtreleme
        handleBlogPostFeatures();
        handleSimulations();
        handleLikeButton(); // Beğeni butonunu aktifleştir
        handleFAQ(); // SSS akordiyonunu burada başlat
        handleSecureContent(); // Güvenli içerik korumasını başlat
        handleShareButtons(); // Paylaşım butonlarını başlat
        // handleAntiDebugging(); // Geliştirici araçları engellemesini başlat - Geliştirme sırasında kapalı tutulabilir
    };

    initApp();
});