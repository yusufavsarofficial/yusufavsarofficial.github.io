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
        const commandButtons = document.querySelectorAll('.btn-command');
        if (!mainLogEl || !mainStatusEl || !commandButtons.length) return;

        const typeLog = async (messages, onComplete, commandName) => {
            const logEl = mainLogEl;
            const statusEl = mainStatusEl;
            const spinner = mainSpinner;
            logEl.innerHTML = '';

            const typeCharacter = (element, text, speed) => {
                return new Promise(resolve => {
                    let i = 0;
                    // HTML etiketlerini atlamak için basit bir kontrol
                    let isTag = false;
                    const typing = () => {
                        if (i < text.length) {
                            const char = text.charAt(i);
                            if (char === '<') isTag = true;
                            if (!isTag) {
                                element.innerHTML += char;
                            } else {
                                // Etiketi doğrudan ekle
                                const tagEnd = text.indexOf('>', i);
                                if (tagEnd !== -1) {
                                    element.innerHTML += text.substring(i, tagEnd + 1);
                                    i = tagEnd;
                                }
                            }
                            if (char === '>') isTag = false;

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
            if(spinner) spinner.style.display = 'none';
            if (onComplete) onComplete();
        };

        const simulations = {
            'run-sqli-btn': {
                name: 'sql_injection_attack',
                scenario: [
                    { text: 'INFO: Hedef URL bağlantısı test ediliyor...', class: 'log-info' },
                    { text: 'INFO: `user` parametresinde SQL Injection test ediliyor...', class: 'log-info' },
                    { text: `SUCCESS: Zafiyetli payload bulundu: <span class="log-highlight">' OR '1'='1' --</span>`, class: 'log-success', delay: 500 },
                    { text: 'INFO: Payload enjekte ediliyor...', class: 'log-info' },
                    { text: 'CRITICAL: Kimlik Doğrulama Atlatıldı!', class: 'log-fail', delay: 800 },
                    { text: 'SUCCESS: <span class="log-highlight">admin</span> olarak erişim sağlandı.', class: 'log-success' }
                ]
            },
            'run-log-analysis-btn': {
                name: 'live_log_analysis',
                scenario: [
                    { text: 'INFO: Başarısız giriş denemeleri dinleniyor...', class: 'log-info' },
                    { text: 'LOG: root için 192.168.1.10 port 22\'den başarısız parola.', class: 'log-info', delay: 1000 },
                    { text: 'LOG: root için 192.168.1.10 port 22\'den başarısız parola.', class: 'log-info', delay: 500 },
                    { text: 'LOG: root için 192.168.1.10 port 22\'den başarısız parola.', class: 'log-info', delay: 300 },
                    { text: 'ALERT: <span class="log-highlight">192.168.1.10</span> IP\'sinden Brute-force saldırısı tespit edildi!', class: 'log-fail', delay: 500 },
                    { text: 'ACTION: IP <span class="log-highlight">192.168.1.10</span> güvenlik duvarı tarafından engellendi.', class: 'log-success' }
                ]
            },
            'run-db-migration-btn': {
                name: 'db_migration',
                scenario: [
                    { text: 'INFO: [alembic.runtime.migration] Context impl PostgreSQLImpl.', class: 'log-info' },
                    { text: 'INFO: [alembic.runtime.migration] İşlemsel DDL varsayılacak.', class: 'log-info' },
                    { text: 'INFO: [alembic.runtime.migration] Yükseltme çalıştırılıyor -> e1a2b3c4d5, `users` tablosu ekleniyor', class: 'log-info', delay: 500 },
                    { text: 'INFO: [alembic.runtime.migration] Yükseltme çalıştırılıyor e1a2b3c4d5 -> f6g7h8i9j0, `users` tablosuna `email_verified` sütunu ekleniyor', class: 'log-info', delay: 800 },
                    { text: 'SUCCESS: Geçiş tamamlandı.', class: 'log-success' }
                ]
            },
            'run-git-merge-btn': {
                name: 'git_version_control',
                scenario: [
                    { text: 'INFO: `main` branch\'ine geçildi.', class: 'log-info' },
                    { text: 'COMMAND: $ git merge feature/new-login', class: 'log-command' },
                    { text: 'INFO: login.js otomatik birleştiriliyor...', class: 'log-info', delay: 500 },
                    { text: 'CONFLICT: login.js dosyasında birleştirme çakışması var.', class: 'log-fail', delay: 800 },
                    { text: 'HINT: Otomatik birleştirme başarısız; çakışmaları çözüp sonucu commit edin.', class: 'log-highlight' }
                ]
            },
            'run-goroutine-btn': {
                name: 'go_concurrency_test',
                scenario: [
                    { text: 'INFO: 10,000 Goroutine başlatılıyor...', class: 'log-info' },
                    { text: 'WORKER: İşçi 1 başladı...', class: 'log-info', delay: 50 },
                    { text: 'WORKER: İşçi 5,231 başladı...', class: 'log-info', delay: 50 },
                    { text: 'WORKER: İşçi 9,999 başladı...', class: 'log-info', delay: 50 },
                    { text: 'SUCCESS: 10,000 görevin tamamı <span class="log-highlight">89ms</span> içinde tamamlandı.', class: 'log-success', delay: 1000 }
                ]
            },
            'run-cicd-btn': {
                name: 'secure_cicd_pipeline',
                scenario: [
                    { text: 'INFO: SentinelPipe v2.1 başlatılıyor...', class: 'log-info' },
                    { text: 'GATE 1/4: SAST Taraması çalıştırılıyor...', class: 'log-info' },
                    { text: 'SUCCESS: SAST Taraması: GEÇTİ', class: 'log-success', delay: 800 },
                    { text: 'GATE 2/4: Bağımlılıklar için SCA Taraması çalıştırılıyor...', class: 'log-info' },
                    { text: 'CRITICAL: Zafiyet bulundu: `log4j` (CVE-2021-44228)', class: 'log-fail', delay: 1000 },
                    { text: 'ABORTED: PIPELINE BAŞARISIZ. Dağıtım iptal edildi.', class: 'log-highlight' }
                ]
            }
        };

        commandButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const sim = simulations[btn.id];
                if (!sim) return;

                // Bir simülasyon çalışırken diğerlerini devre dışı bırak
                commandButtons.forEach(b => b.disabled = true);

                typeLog(sim.scenario, () => {
                    // Simülasyon bittiğinde tüm butonları tekrar aktif et
                    commandButtons.forEach(b => b.disabled = false);
                }, sim.name);
            });
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
            window.addEventListener('mousemove', (e) => {
                const posX = e.clientX;
                const posY = e.clientY;
                watermark.style.left = `${posX}px`;
                watermark.style.top = `${posY}px`;
            });
        }

        // Ekran görüntüsü almayı zorlaştırmak için bulanıklaştırma
        window.addEventListener('blur', () => {
            // Sadece bu sayfada blur efekti uygula
            if (document.querySelector('.secure-content')) {
                document.body.classList.add('content-blurred');
            }
        });
        window.addEventListener('focus', () => {
            if (document.querySelector('.secure-content')) {
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
        handleSecureContent(); // Güvenli içerik korumasını başlat
        handleShareButtons(); // Paylaşım butonlarını başlat
        // handleAntiDebugging(); // Geliştirici araçları engellemesini başlat - Geliştirme sırasında kapalı tutulabilir
    };

    initApp();
});