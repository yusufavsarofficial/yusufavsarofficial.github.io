document.addEventListener('DOMContentLoaded', () => {

    // Bu fonksiyon, girilen metni SHA-256 ile hash'ler.
    // Gerçek parolayı koda yazmak yerine hash'ini saklamak daha güvenlidir.
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    // --- GİRİŞ SAYFASI MANTIĞI (admin-login.html) ---
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
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                togglePassword.classList.toggle('fa-eye');
                togglePassword.classList.toggle('fa-eye-slash');
            });
        }
    }

    // --- YÖNETİM PANELİ MANTIĞI (admin.html) ---
    const logoutBtn = document.getElementById('logout-btn');
    // `logoutBtn`'in varlığı, admin.html sayfasında olduğumuzu gösterir.
    if (logoutBtn) { 
        logoutBtn.addEventListener('click', () => {
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

        // --- BLOG YÖNETİMİ MANTIĞI ---
        const blogEditor = document.getElementById('blog-editor');
        if (blogEditor) {
            let allPosts = [];
            const postListEl = document.getElementById('blog-post-list');
            const editorEl = document.getElementById('blog-editor');
            const postIdInput = document.getElementById('post-id');
            const postTitleInput = document.getElementById('post-title');
            const postContentInput = document.getElementById('post-content');
            const postImageInput = document.getElementById('post-image');
            const postCategoryInput = document.getElementById('post-category');

            const newPostBtn = document.getElementById('new-post-btn');
            const savePostBtn = document.getElementById('save-post-btn');
            const deletePostBtn = document.getElementById('delete-post-btn');
            const cancelEditBtn = document.getElementById('cancel-edit-btn');
            const importInput = document.getElementById('import-json-input');

            // Yazıları JSON dosyasından yükle
            const loadPosts = async () => {
                try {
                    const response = await fetch('blog-posts.json?cachebust=' + new Date().getTime()); // Önbelleği atlat
                    if (!response.ok) throw new Error('Yazılar yüklenemedi.');
                    allPosts = await response.json();
                    renderPostList();
                    updateStats(); // İstatistikleri güncelle
                } catch (error) {
                    postListEl.innerHTML = `<li><span style="color: #ff4d4d;">Hata: ${error.message}</span></li>`;
                }
            };

            // Yazı listesini ekranda göster
            const renderPostList = () => {
                postListEl.innerHTML = '';
                if (allPosts.length === 0) {
                    postListEl.innerHTML = '<li>Henüz yazı bulunmuyor.</li>';
                    return;
                }
                allPosts.forEach(post => {
                    const li = document.createElement('li');
                    li.innerHTML = `${post.title} <button class="btn-edit" data-id="${post.id}">Düzenle</button>`;
                    postListEl.appendChild(li);
                });
            };

            // İstatistikleri güncelle
            const updateStats = () => {
                const totalArticlesStat = document.getElementById('total-articles-stat');
                const totalSimulationsStat = document.getElementById('total-simulations-stat');

                if (totalArticlesStat) {
                    totalArticlesStat.textContent = allPosts.length;
                }
                if (totalSimulationsStat) {
                    // Simülasyon sayısını localStorage'dan oku
                    totalSimulationsStat.textContent = localStorage.getItem('totalSimulations') || '0';
                });
            };

            // Düzenleme formunu aç
            const openEditor = (post) => {
                postIdInput.value = post ? post.id : '';
                postTitleInput.value = post ? post.title : '';
                postContentInput.value = post ? post.content : '';
                postImageInput.value = post ? post.featuredImage : '';
                postCategoryInput.value = post ? post.category : 'guvenlik'; // Varsayılan olarak 'guvenlik' seçili gelsin
                deletePostBtn.style.display = post ? 'block' : 'none';
                editorEl.style.display = 'block';
            };

            // Düzenleme formunu kapat
            const closeEditor = () => {
                editorEl.style.display = 'none';
            };

            // Değişiklikleri kaydet ve JSON dosyasını indir
            const saveAndDownload = () => {
                const id = postIdInput.value ? parseInt(postIdInput.value) : null;
                const content = postContentInput.value;
                const wordCount = content.split(/\s+/).filter(Boolean).length;
                const readingTime = Math.ceil(wordCount / 200); // Ortalama 200 kelime/dakika

                const updatedPost = {
                    id: id || Date.now(),
                    title: postTitleInput.value,
                    author: 'Yusuf Avşar',
                    date: new Date().toISOString().split('T')[0],
                    slug: postTitleInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                    category: postCategoryInput.value,
                    summary: content.substring(0, 150) + "...", // İçerikten özet oluştur
                    featuredImage: postImageInput.value, // Görsel URL'si
                    readingTime: readingTime, // Okunma süresi
                    content: content,
                };

                if (id) { // Eğer var olan bir yazıyı güncelliyorsak, eski kategoriyi koru
                    // Bu artık gerekli değil, çünkü formdan direkt alıyoruz.
                }

                if (id) { // Var olanı güncelle
                    allPosts = allPosts.map(p => p.id === id ? updatedPost : p);
                } else { // Yeni ekle
                    allPosts.push(updatedPost);
                }

                const jsonString = JSON.stringify(allPosts, null, 4); // Okunabilir formatta
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'blog-posts.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                renderPostList();
                updateStats(); // İstatistikleri güncelle
                closeEditor();
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
                        const importedPosts = JSON.parse(e.target.result);
                        if (!Array.isArray(importedPosts)) throw new Error('JSON dosyası bir dizi (array) içermelidir.');
                        
                        allPosts = importedPosts;
                        renderPostList();
                        updateStats(); // İstatistikleri güncelle
                        alert(`${importedPosts.length} yazı başarıyla içe aktarıldı! Değişiklikleri kalıcı hale getirmek için "Kaydet" butonuna basarak yeni dosyayı indirmeyi unutmayın.`);
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
            savePostBtn.addEventListener('click', saveAndDownload);
            deletePostBtn.addEventListener('click', () => {
                if (confirm('Bu yazıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
                    const id = parseInt(postIdInput.value);
                    allPosts = allPosts.filter(p => p.id !== id);
                    saveAndDownload();
                }
            });

            importInput.addEventListener('change', importPosts);
            // Başlangıç
            loadPosts();
        }
    }

});