// Bu dosya artık sadece bir orkestratör. Gerçek mantık diğer modüllere taşındı.
// Örnek: import { handleLogin } from './auth.js'; (Gerçek bir modül sisteminde böyle olurdu)

document.addEventListener('DOMContentLoaded', () => {

    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }
    
    // --- GİRİŞ SAYFASI MANTIĞI (admin-login.html) --- (auth.js'e taşınabilir)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const passwordInput = document.getElementById('password');
        const statusDiv = document.getElementById('login-status');
        const togglePassword = document.getElementById('toggle-password');
        const loginPanel = document.getElementById('login-panel');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            statusDiv.textContent = ''; // Önceki hata mesajını temizle
            loginPanel.classList.remove('shake'); // Önceki animasyonu temizle

            const submitButton = loginForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.classList.add('loading');
            submitButton.innerHTML = '<div class="spinner-sm"></div> Giriş Yapılıyor...';

            // Parolanın SHA-256 hash'i. Parola: "Ysfavsr44.."
            const correctPasswordHash = '07b8b51e0d1c5b949f3595431e782ea4a14f9c4c143c7fa5758525206a7f8946';
            
            // localStorage'da saklanacak basit bir yetki anahtarı.
            const authToken = 'ysf-secret-session-token-2024';

            const enteredPassword = passwordInput.value.trim(); // Girilen parolanın başındaki/sonundaki boşlukları temizle
            const enteredPasswordHash = await sha256(enteredPassword);

            // Gerçekçi bir gecikme ekleyelim
            setTimeout(() => {
                if (enteredPasswordHash === correctPasswordHash) {
                    // Parola doğruysa, yetki anahtarını localStorage'a kaydet ve admin paneline yönlendir.
                    localStorage.setItem('adminAuthToken', authToken);
                    window.location.href = 'admin.html';
                } else {
                    // Parola yanlışsa, hata mesajı göster ve butonu eski haline getir.
                    statusDiv.textContent = 'Parola yanlış. Erişim reddedildi.';
                    loginPanel.classList.add('shake');
                    submitButton.disabled = false;
                    submitButton.classList.remove('loading');
                    submitButton.innerHTML = submitButton.dataset.originalText;
                }
            }, 1000); // 1 saniye bekle
        });

        // Parolayı göster/gizle butonu
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const icon = togglePassword.querySelector('i');
                const isPassword = passwordInput.getAttribute('type') === 'password';

                if (isPassword) {
                    passwordInput.setAttribute('type', 'text');
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                    togglePassword.setAttribute('aria-label', 'Parolayı gizle');
                } else {
                    passwordInput.setAttribute('type', 'password');
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                    togglePassword.setAttribute('aria-label', 'Parolayı göster');
                }
            });
        }
    }

    // --- YÖNETİM PANELİ MANTIĞI (admin.html) --- (auth.js, ui.js, api.js'e taşınabilir)
    const adminPanel = document.getElementById('logout-btn'); // Admin panelinde olduğumuzu anlamak için bir element
    // `logoutBtn`'in varlığı, admin.html sayfasında olduğumuzu gösterir.
    if (adminPanel) { 
        adminPanel.addEventListener('click', () => {
            // Çıkış yapıldığında yetki anahtarını localStorage'dan sil.
            localStorage.removeItem('adminAuthToken');
            // Kullanıcıyı giriş sayfasına geri yönlendir.
            window.location.href = 'admin-login.html';
        });

        // Bakım Modu anahtarını yönet
        const maintenanceToggle = document.getElementById('maintenance-mode');
        if (maintenanceToggle) {
            // Sayfa yüklendiğinde anahtarın durumunu localStorage'dan oku
            if (localStorage.getItem('maintenanceMode') === 'on') {
                maintenanceToggle.checked = true;
            }

            // Anahtarın durumu değiştiğinde localStorage'ı güncelle
            maintenanceToggle.addEventListener('change', () => {
                const confirmation = confirm(`Bakım modunu ${maintenanceToggle.checked ? 'AÇMAK' : 'KAPATMAK'} istediğinizden emin misiniz?`);
                if (confirmation) {
                    localStorage.setItem('maintenanceMode', maintenanceToggle.checked ? 'on' : 'off');
                    alert(`Bakım modu başarıyla ${maintenanceToggle.checked ? 'aktif edildi' : 'devre dışı bırakıldı'}.`);
                } else {
                    maintenanceToggle.checked = !maintenanceToggle.checked; // İşlemi geri al
                }
            });
        }

        // Önbelleği Temizle butonunu yönet
        const clearCacheBtn = document.getElementById('clear-cache-btn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                const confirmationText = "TEMİZLE";
                const userInput = prompt(`DİKKAT! Bu işlem, site ziyaretçilerinin tarayıcısında saklanan tema seçimi, bakım modu durumu gibi tüm verileri temizleyecektir.\n\nBu işlemi onaylamak için "${confirmationText}" yazın.`);

                if (userInput === confirmationText) {
                    try {
                        const adminTokenKey = 'adminAuthToken';
                        let itemsToRemove = [];
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key !== adminTokenKey) {
                                itemsToRemove.push(key);
                            }
                        }
                        itemsToRemove.forEach(key => localStorage.removeItem(key));
                        alert('Site önbelleği başarıyla temizlendi. Yönetici oturumunuz devam ediyor.');
                        // Sayfayı yenileyerek temizlenmiş durumu görebiliriz.
                        window.location.reload();
                    } catch (error) {
                        alert('Önbellek temizlenirken bir hata oluştu: ' + error.message);
                    }
                }
            });
        }

        // Renk Paleti Değiştiriciyi yönet
        const paletteSwitcher = document.getElementById('color-palette-switcher');
        if (paletteSwitcher) {
            const themeButtons = paletteSwitcher.querySelectorAll('.palette-btn');
            let currentSavedTheme = localStorage.getItem('siteTheme') || 'default';

            // Aktif butonu işaretle
            const updateActiveButton = (theme) => {
                paletteSwitcher.querySelector('.active')?.classList.remove('active');
                paletteSwitcher.querySelector(`[data-theme="${theme}"]`)?.classList.add('active');
            };

            updateActiveButton(currentSavedTheme);

            themeButtons.forEach(button => {
                const theme = button.dataset.theme;

                // Fare üzerine gelince canlı önizleme yap
                button.addEventListener('mouseenter', () => {
                    document.documentElement.setAttribute('data-theme', theme);
                });

                // Fare ayrılınca kayıtlı temaya geri dön
                button.addEventListener('mouseleave', () => {
                    document.documentElement.setAttribute('data-theme', currentSavedTheme);
                });

                // Tıklayınca temayı kalıcı olarak kaydet
                button.addEventListener('click', () => {
                    currentSavedTheme = theme; // Kayıtlı temayı güncelle
                    document.documentElement.setAttribute('data-theme', theme);
                    localStorage.setItem('siteTheme', theme);
                    updateActiveButton(theme);
                });
            });
        }

        // --- BLOG YÖNETİMİ MANTIĞI ---
        const blogEditor = document.getElementById('blog-editor');
        if (blogEditor) {
            let easyMDE; // EasyMDE editör örneğini tutmak için

            // Bu değişken artık tüm site içeriğini tutacak
            let siteContent = { 
                posts: [], 
                pages: {},
                projects: []
            }; 

            let allPosts = [];
            const postListEl = document.getElementById('blog-post-list');
            const editorEl = document.getElementById('blog-editor');
            const postIdInput = document.getElementById('post-id');
            const postTitleInput = document.getElementById('post-title');
            // Yeni ve geliştirilmiş form alanları
            const postSlugInput = document.getElementById('post-slug');
            const postDateInput = document.getElementById('post-date');
            const postSummaryInput = document.getElementById('post-summary');
            const postImageInput = document.getElementById('post-image');
            const postContentInput = document.getElementById('post-content'); // Bu artık EasyMDE tarafından yönetilecek
            const postCategoryInput = document.getElementById('post-category');
            const postTagsInput = document.getElementById('post-tags');

            const newPostBtn = document.getElementById('new-post-btn');
            const savePostBtn = document.getElementById('save-post-btn');
            const deletePostBtn = document.getElementById('delete-post-btn');
            const cancelEditBtn = document.getElementById('cancel-edit-btn');
            const importInput = document.getElementById('import-json-input');
            const downloadAllBtn = document.getElementById('download-all-btn');

            // Başlıktan otomatik slug oluşturma
            postTitleInput.addEventListener('keyup', () => {
                const slug = postTitleInput.value.toLowerCase()
                    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                postSlugInput.value = slug;
            });

            // EasyMDE editörünü başlat
            const initializeEditor = () => {
                if (easyMDE) easyMDE.toTextArea(); // Önceki örneği temizle
                easyMDE = new EasyMDE({element: postContentInput, spellChecker: false, status: ["lines", "words"]});
            };


            // Yazıları JSON dosyasından yükle
            const loadContent = async () => {
                try {
                    // Artık tek bir content.json dosyası var
                    const response = await fetch('content.json?cachebust=' + new Date().getTime()); 
                    if (!response.ok) {
                        console.warn('content.json bulunamadı, varsayılan yapı kullanılıyor.');
                    } else {
                        siteContent = await response.json();
                    }
                    
                    allPosts = siteContent.posts || []; // Geriye dönük uyumluluk
                    if (!siteContent.projects) siteContent.projects = []; // Projeler dizisi yoksa oluştur
                    renderProjectList();
                    renderPostList();

                    // Sayfa verilerinin var olduğundan emin ol
                    if (!siteContent.pages) siteContent.pages = {};
                    if (!siteContent.pages.home) siteContent.pages.home = {
                        title: "Varsayılan Ana Başlık",
                        subtitle: "Varsayılan alt başlık."
                    };
                    if (!siteContent.pages.about) siteContent.pages.about = {
                        mainTitle: "Hakkımda",
                        introParagraph: "Hakkımda yazısı buraya gelecek."
                    };
                    if (!siteContent.pages.projects) siteContent.pages.projects = {
                        mainTitle: "Projelerim ve Vaka Çalışmaları",
                        subtitle: "Güvenlik, performans ve ölçeklenebilirlik odaklı çözümler."
                    };
                    // Uzmanlık alanı verilerinin var olduğundan emin ol
                    if (!siteContent.pages.home.expertiseAreas) siteContent.pages.home.expertiseAreas = [
                        { id: 1, icon: "fa-solid fa-shield-virus", title: "Örnek Uzmanlık", description: "Bu bir örnek uzmanlık alanıdır." }
                    ];
                    // Proje verilerinin var olduğundan emin ol
                    if (!siteContent.projects) siteContent.projects = [
                        { id: 1, title: "Örnek Proje", description: "Bu bir örnek projedir.", category: "python", link: "#", linkText: "İncele" }
                    ];
                    };

                    updateStats(); // İstatistikleri güncelle
                    renderExpertiseList(); // Uzmanlık alanlarını listele
                } catch (error) {
                    postListEl.innerHTML = `<tr><td colspan="3" style="color: #ff4d4d;">Hata: ${error.message}</td></tr>`;
                }
            };

            // Yazı listesini ekranda göster
            const renderPostList = () => {
                postListEl.innerHTML = '';
                const posts = siteContent.posts || [];
                if (posts.length === 0) {
                    postListEl.innerHTML = '<tr><td colspan="3" style="text-align: center;">Henüz yazı bulunmuyor.</td></tr>';
                    return;
                }
                let tableRowsHTML = '';
                posts.forEach(post => {
                    tableRowsHTML += `
                        <tr>
                            <td>${post.title}</td>
                            <td>${post.category}</td>
                            <td style="text-align: right;"><button class="btn-edit" data-id="${post.id}">Düzenle</button></td>
                        </tr>
                    `;
                });
                postListEl.innerHTML = tableRowsHTML;
            };

            // İstatistikleri güncelle
            const updateStats = () => {
                const totalArticlesStat = document.getElementById('total-articles-stat');
                const totalSimulationsStat = document.getElementById('total-simulations-stat');
                const totalProjectsStat = document.getElementById('total-projects-stat');
                const todayVisitorsStat = document.getElementById('today-visitors-stat');
                const postsWithImagesStat = document.getElementById('posts-with-images-stat');
                const postsWithImagesBar = document.getElementById('posts-with-images-bar');

                if (totalArticlesStat) {
                    totalArticlesStat.textContent = siteContent.posts?.length || 0;
                }
                if (totalSimulationsStat) {
                    // Simülasyon sayısını localStorage'dan oku
                    totalSimulationsStat.textContent = localStorage.getItem('totalSimulations') || '0';
                }
                if (totalProjectsStat) {
                    totalProjectsStat.textContent = siteContent.projects?.length || 0;
                }
                if (todayVisitorsStat) {
                    // Oturum boyunca tutarlı kalan, daha "gerçekçi" bir sahte ziyaretçi sayısı
                    let visitorCount = sessionStorage.getItem('visitorCount');
                    if (!visitorCount) {
                        visitorCount = Math.floor(Math.random() * (2500 - 800 + 1)) + 800;
                        sessionStorage.setItem('visitorCount', visitorCount);
                    }
                    // Sayıyı hafifçe dalgalandır
                    const fluctuation = Math.floor(Math.random() * 11) - 5; // -5 ile +5 arası
                    todayVisitorsStat.textContent = (parseInt(visitorCount) + fluctuation).toLocaleString('tr-TR');
                }
                if (postsWithImagesStat && postsWithImagesBar) {
                    const totalPosts = siteContent.posts?.length || 0;
                    if (totalPosts > 0) {
                        const postsWithImage = siteContent.posts.filter(p => p.featuredImage).length;
                        const percentage = Math.round((postsWithImage / totalPosts) * 100);
                        postsWithImagesStat.textContent = `${percentage}%`;
                        postsWithImagesBar.style.width = `${percentage}%`;
                    } else {
                        postsWithImagesStat.textContent = 'N/A';
                        postsWithImagesBar.style.width = '0%';
                    }
                }
            };

            // Düzenleme formunu aç
            const openEditor = (post) => {
                if (!easyMDE) initializeEditor(); // Editör başlatılmadıysa başlat

                postIdInput.value = post ? post.id : '';
                postTitleInput.value = post ? post.title : '';
                postSlugInput.value = post ? post.slug : '';
                postDateInput.value = post ? post.date : new Date().toISOString().split('T')[0];
                postSummaryInput.value = post ? post.summary : '';
                postImageInput.value = post ? post.featuredImage : '';
                postCategoryInput.value = post ? post.category : 'guvenlik'; // Varsayılan olarak 'guvenlik' seçili gelsin
                postTagsInput.value = post && post.tags ? post.tags.join(', ') : '';
                
                easyMDE.value(post ? post.content : ''); // EasyMDE içeriğini ayarla

                deletePostBtn.style.display = post ? 'block' : 'none';
                editorEl.style.display = 'block';
            };

            // Düzenleme formunu kapat
            const closeEditor = () => {
                editorEl.style.display = 'none';
            };

            /**
             * GitHub API'sini kullanarak content.json dosyasını günceller.
             * @param {object} contentToCommit - GitHub'a gönderilecek tüm site içeriği.
             * @param {string} commitMessage - Commit için kullanılacak mesaj.
             * @param {HTMLElement} buttonElement - İşlem sırasında devre dışı bırakılacak buton.
             */
            const updateContentOnGitHub = async (contentToCommit, commitMessage, buttonElement) => {
                const githubToken = prompt("Değişiklikleri GitHub'a göndermek için lütfen GitHub Personal Access Token'ınızı girin:", "");
                if (!githubToken) {
                    alert("GitHub token girilmedi. Değişiklikler sadece yerel olarak kaydedildi. Kalıcı hale getirmek için 'Manuel Yedekleme' bölümünü kullanın.");
                    return;
                }

                const originalButtonText = buttonElement.textContent;
                buttonElement.disabled = true;
                buttonElement.innerHTML = '<div class="spinner-sm"></div> Gönderiliyor...';

                try {
                    const repoOwner = 'yusufavsarofficial';
                    const repoName = 'yusufavsarofficial.github.io-main';
                    const filePath = 'content.json';
                    const branch = 'main';

                    const fileResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`, {
                        headers: { 'Authorization': `token ${githubToken}` }
                    });
                    const fileData = await fileResponse.json();
                    const sha = fileData.sha;

                    const updatedContentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(contentToCommit, null, 4))));

                    const updateResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `token ${githubToken}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: commitMessage, content: updatedContentBase64, sha: sha, branch: branch })
                    });

                    if (!updateResponse.ok) throw new Error(`GitHub API Hatası: ${updateResponse.statusText}`);
                    alert('Değişiklikler başarıyla GitHub\'a gönderildi! Sitenizin güncellenmesi birkaç dakika sürebilir.');
                } catch (error) {
                    alert(`GitHub'a gönderilirken bir hata oluştu: ${error.message}\nDeğişiklikleriniz kaydedildi, 'Manuel Yedekleme' butonu ile manuel olarak indirebilirsiniz.`);
                } finally {
                    buttonElement.disabled = false;
                    buttonElement.innerHTML = originalButtonText;
                }
            };

            // Değişiklikleri kaydet (artık GitHub'a gönderecek)
            const savePost = async () => {
                const id = postIdInput.value ? parseInt(postIdInput.value, 10) : null;
                const content = easyMDE.value(); // İçeriği EasyMDE'den al
                const wordCount = content.split(/\s+/).filter(Boolean).length;
                const readingTime = Math.ceil(wordCount / 200); // Ortalama 200 kelime/dakika
                const tags = postTagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean); // Virgülle ayrılmış etiketleri diziye çevir

                const updatedPost = {
                    id: id || Date.now(),
                    title: postTitleInput.value,
                    slug: postSlugInput.value,
                    author: 'Yusuf Avşar',
                    date: postDateInput.value,
                    category: postCategoryInput.value,
                    summary: postSummaryInput.value,
                    featuredImage: postImageInput.value, // Görsel URL'si
                    tags: tags, // Etiketler dizisi
                    readingTime: readingTime, // Okunma süresi
                    content: content,
                };

                if (id) { // Var olanı güncelle
                    allPosts = allPosts.map(p => p.id === id ? updatedPost : p);
                } else { // Yeni ekle
                    allPosts.push(updatedPost);
                }

                siteContent.posts = allPosts; // Ana içerik nesnesini güncelle
                renderPostList();
                updateStats();
                closeEditor();

                // --- YENİ: GITHUB'A OTOMATİK GÖNDERME ---
                const commitMessage = `CMS: Blog yazısı '${updatedPost.title}' güncellendi.`;
                await updateContentOnGitHub(siteContent, commitMessage, savePostBtn);
            };

            // Tüm içeriği ZIP olarak indir
            const downloadAllContent = () => {
                const zip = new JSZip();
                
                // Güncellenmiş content.json dosyasını ZIP'e ekle
                const jsonString = JSON.stringify(siteContent, null, 4);
                zip.file("content.json", jsonString);

                zip.generateAsync({type:"blob"}).then(function(content) {
                    const url = URL.createObjectURL(content);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `site-guncellemesi-${new Date().toISOString().split('T')[0]}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
            };

            // JSON dosyasını içe aktar
            const importPosts = (event) => {
                const file = event.target.files[0];
                if (!file) return;

                if (file.type !== 'application/json') {
                    alert('Hata: Lütfen geçerli bir .json dosyası seçin.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedContent = JSON.parse(e.target.result);
                        // İçe aktarılan dosyanın yapısını kontrol et
                        if (typeof importedContent.posts === 'undefined' || typeof importedContent.pages === 'undefined') {
                            throw new Error('İçe aktarılan JSON dosyası beklenen yapıda değil (posts ve pages alanları eksik).');
                        }
                        
                        siteContent = importedContent;
                        allPosts = siteContent.posts || [];
                        renderPostList();
                        updateStats();
                        alert(`İçerik başarıyla içe aktarıldı! Değişiklikleri kalıcı hale getirmek için 'Tüm İçeriği İndir' butonunu kullanın.`);
                    } catch (error) {
                        alert(`JSON okuma hatası: ${error.message}`);
                    }
                };
                reader.readAsText(file);
            };

            // Olay dinleyicileri
            postListEl.addEventListener('click', e => {
                if (e.target.classList.contains('btn-edit')) {
                    const post = allPosts.find(p => p.id === parseInt(e.target.dataset.id));
                    openEditor(post);
                }
            });

            newPostBtn.addEventListener('click', () => openEditor(null));
            cancelEditBtn.addEventListener('click', closeEditor);
            savePostBtn.addEventListener('click', savePost);
            deletePostBtn.addEventListener('click', async () => {
                if (confirm('Bu yazıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
                    const id = parseInt(postIdInput.value);
                    const postToDelete = allPosts.find(p => p.id === id);
                    allPosts = allPosts.filter(p => p.id !== id);
                    siteContent.posts = allPosts; // Ana içeriği güncelle
                    renderPostList();
                    updateStats();
                    closeEditor();

                    const commitMessage = `CMS: Blog yazısı '${postToDelete.title}' silindi.`;
                    await updateContentOnGitHub(siteContent, commitMessage, deletePostBtn);
                }
            });

            importInput.addEventListener('change', importPosts);
            downloadAllBtn.addEventListener('click', downloadAllContent);

            // --- SAYFA İÇERİK YÖNETİMİ ---
            const pageSelector = document.getElementById('page-selector');
            const pageEditor = document.getElementById('page-editor');
            const pageEditorActions = document.getElementById('page-editor-actions');
            const savePageBtn = document.getElementById('save-page-btn');

            pageSelector.addEventListener('change', () => {
                const selectedPage = pageSelector.value;
                pageEditor.innerHTML = '';
                pageEditor.style.display = 'none';
                pageEditorActions.style.display = 'none';
                
                if (!selectedPage) return;

                const pageData = siteContent.pages[selectedPage] || {};
                let formHTML = '';

                for (const key in pageData) {
                    const value = pageData[key];
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    
                    if (typeof value === 'string' && value.length > 100) {
                        formHTML += `
                            <div class="form-group">
                                <label for="page-${key}">${label}</label>
                                <textarea id="page-${key}" data-page="${selectedPage}" data-key="${key}" rows="5">${value}</textarea>
                            </div>
                        `;
                    } else {
                        formHTML += `
                            <div class="form-group">
                                <label for="page-${key}">${label}</label>
                                <input type="text" id="page-${key}" data-page="${selectedPage}" data-key="${key}" value="${value}">
                            </div>
                        `;
                    }
                }
                pageEditor.innerHTML = formHTML;
                pageEditor.style.display = 'block';
                pageEditorActions.style.display = 'block';
            });

            pageEditor.addEventListener('input', (e) => {
                if (e.target.matches('input') || e.target.matches('textarea')) {
                    const page = e.target.dataset.page;
                    const key = e.target.dataset.key;
                    siteContent.pages[page][key] = e.target.value;
                    console.log(`Sayfa içeriği güncellendi: ${page}.${key}`);
                }
            });

            savePageBtn.addEventListener('click', async () => {
                const commitMessage = `CMS: Sayfa içeriği '${pageSelector.options[pageSelector.selectedIndex].text}' güncellendi.`;
                await updateContentOnGitHub(siteContent, commitMessage, savePageBtn);
            });

            // Başlangıç
            loadContent();
        }

        // --- UZMANLIK ALANLARI YÖNETİMİ ---
        const expertiseEditorEl = document.getElementById('expertise-editor');
        if (expertiseEditorEl) {
            const expertiseListBody = document.getElementById('expertise-list');
            const newExpertiseBtn = document.getElementById('new-expertise-btn');
            const saveExpertiseBtn = document.getElementById('save-expertise-btn');
            const deleteExpertiseBtn = document.getElementById('delete-expertise-btn');
            const cancelExpertiseBtn = document.getElementById('cancel-expertise-btn');

            const expertiseIdInput = document.getElementById('expertise-id');
            const expertiseTitleInput = document.getElementById('expertise-title');
            const expertiseIconInput = document.getElementById('expertise-icon');
            const expertiseDescriptionInput = document.getElementById('expertise-description');

            const renderExpertiseList = () => {
                expertiseListBody.innerHTML = '';
                const areas = siteContent.pages.home.expertiseAreas || [];
                if (areas.length === 0) {
                    expertiseListBody.innerHTML = '<tr><td colspan="2" style="text-align: center;">Henüz uzmanlık alanı bulunmuyor.</td></tr>';
                    return;
                }
                let tableRowsHTML = '';
                areas.forEach(area => {
                    tableRowsHTML += `
                        <tr>
                            <td><i class="${area.icon}" style="margin-right: 8px; color: var(--color-accent);"></i> ${area.title}</td>
                            <td style="text-align: right;"><button class="btn-edit" data-id="${area.id}">Düzenle</button></td>
                        </tr>
                    `;
                });
                expertiseListBody.innerHTML = tableRowsHTML;
            };

            const openExpertiseEditor = (area) => {
                expertiseIdInput.value = area ? area.id : '';
                expertiseTitleInput.value = area ? area.title : '';
                expertiseIconInput.value = area ? area.icon : 'fa-solid fa-star';
                expertiseDescriptionInput.value = area ? area.description : '';
                deleteExpertiseBtn.style.display = area ? 'block' : 'none';
                expertiseEditorEl.style.display = 'block';
            };

            const closeExpertiseEditor = () => {
                expertiseEditorEl.style.display = 'none';
            };

            const saveExpertise = async () => {
                const id = expertiseIdInput.value ? parseInt(expertiseIdInput.value, 10) : Date.now();
                const updatedArea = {
                    id: id,
                    title: expertiseTitleInput.value,
                    icon: expertiseIconInput.value,
                    description: expertiseDescriptionInput.value,
                };

                const existingIndex = siteContent.pages.home.expertiseAreas.findIndex(a => a.id === id);
                if (existingIndex > -1) {
                    siteContent.pages.home.expertiseAreas[existingIndex] = updatedArea;
                } else {
                    siteContent.pages.home.expertiseAreas.push(updatedArea);
                }
                
                renderExpertiseList();
                closeExpertiseEditor();

                const commitMessage = `CMS: Uzmanlık alanı '${updatedArea.title}' güncellendi.`;
                await updateContentOnGitHub(siteContent, commitMessage, saveExpertiseBtn);
            };

            newExpertiseBtn.addEventListener('click', () => openExpertiseEditor(null));
            cancelExpertiseBtn.addEventListener('click', closeExpertiseEditor);
            saveExpertiseBtn.addEventListener('click', saveExpertise);

            expertiseListBody.addEventListener('click', e => {
                if (e.target.classList.contains('btn-edit')) {
                    const area = siteContent.pages.home.expertiseAreas.find(a => a.id === parseInt(e.target.dataset.id));
                    openExpertiseEditor(area);
                }
            });

            deleteExpertiseBtn.addEventListener('click', async () => {
                if (confirm('Bu uzmanlık alanını silmek istediğinizden emin misiniz?')) {
                    const id = parseInt(expertiseIdInput.value);
                    const areaToDelete = siteContent.pages.home.expertiseAreas.find(a => a.id === id);
                    siteContent.pages.home.expertiseAreas = siteContent.pages.home.expertiseAreas.filter(a => a.id !== id);
                    renderExpertiseList();
                    closeExpertiseEditor();

                    const commitMessage = `CMS: Uzmanlık alanı '${areaToDelete.title}' silindi.`;
                    await updateContentOnGitHub(siteContent, commitMessage, deleteExpertiseBtn);
                }
            });
        }

         // --- PROJE YÖNETİMİ MANTIĞI (blogEditor scope'u içinde olmalı) ---
        const projectEditorEl = document.getElementById('project-editor');
        if (projectEditorEl) {
            const projectListBody = document.getElementById('project-list');
            const newProjectBtn = document.getElementById('new-project-btn');
            const saveProjectBtn = document.getElementById('save-project-btn');
            const deleteProjectBtn = document.getElementById('delete-project-btn');
            const cancelProjectBtn = document.getElementById('cancel-project-btn');

            const projectIdInput = document.getElementById('project-id');
            const projectTitleInput = document.getElementById('project-title');
            const projectDescriptionInput = document.getElementById('project-description');
            const projectCategoryInput = document.getElementById('project-category');
            const projectLinkInput = document.getElementById('project-link');
            const projectLinkTextInput = document.getElementById('project-link-text');

            const renderProjectList = () => {
                projectListBody.innerHTML = '';
                const projects = siteContent.projects || [];
                if (projects.length === 0) {
                    projectListBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Henüz proje bulunmuyor.</td></tr>';
                    return;
                }
                let tableRowsHTML = '';
                projects.forEach(project => {
                    tableRowsHTML += `
                        <tr>
                            <td>${project.title || 'Başlıksız'}</td>
                            <td>${project.category || 'Genel'}</td>
                            <td style="text-align: right;"><button class="btn-edit" data-id="${project.id}">Düzenle</button></td>
                        </tr>
                    `;
                });
                projectListBody.innerHTML = tableRowsHTML;
            };

            const openProjectEditor = (project) => {
                projectIdInput.value = project ? project.id : '';
                projectTitleInput.value = project ? project.title : '';
                projectDescriptionInput.value = project ? project.description : '';
                projectCategoryInput.value = project ? project.category : 'python';
                projectLinkInput.value = project ? project.link : '';
                projectLinkTextInput.value = project ? project.linkText : '';
                deleteProjectBtn.style.display = project ? 'block' : 'none';
                projectEditorEl.style.display = 'block';
            };

            const closeProjectEditor = () => {
                projectEditorEl.style.display = 'none';
            };

            const saveProject = async () => {
                const id = projectIdInput.value ? parseInt(projectIdInput.value, 10) : Date.now();
                const updatedProject = {
                    id: id,
                    title: projectTitleInput.value,
                    description: projectDescriptionInput.value,
                    category: projectCategoryInput.value,
                    link: projectLinkInput.value,
                    linkText: projectLinkTextInput.value
                };

                const existingIndex = siteContent.projects.findIndex(p => p.id === id);
                if (existingIndex > -1) {
                    siteContent.projects[existingIndex] = updatedProject;
                } else {
                    siteContent.projects.push(updatedProject);
                }
                
                renderProjectList();
                closeProjectEditor();

                const commitMessage = `CMS: Proje '${updatedProject.title}' güncellendi.`;
                await updateContentOnGitHub(siteContent, commitMessage, saveProjectBtn);
            };

            newProjectBtn.addEventListener('click', () => openProjectEditor(null));
            cancelProjectBtn.addEventListener('click', closeProjectEditor);
            saveProjectBtn.addEventListener('click', saveProject);
            projectListBody.addEventListener('click', e => {
                if (e.target.classList.contains('btn-edit')) {
                    const project = siteContent.projects.find(p => p.id === parseInt(e.target.dataset.id));
                    openProjectEditor(project);
                }
            });
            deleteProjectBtn.addEventListener('click', async () => {
                if (confirm('Bu projeyi silmek istediğinizden emin misiniz?')) {
                    const id = parseInt(projectIdInput.value);
                    const projectToDelete = siteContent.projects.find(p => p.id === id);
                    siteContent.projects = siteContent.projects.filter(p => p.id !== id);
                    renderProjectList();
                    closeProjectEditor();

                    const commitMessage = `CMS: Proje '${projectToDelete.title}' silindi.`;
                    await updateContentOnGitHub(siteContent, commitMessage, deleteProjectBtn);
                }
            });

            // `loadContent` tamamlandığında bu fonksiyonu çağır
            // Bu olay artık gereksiz, loadContent içinde doğrudan çağrılıyor.
        }
    }

});