document.addEventListener('DOMContentLoaded', () => {
    // --- Hamburger Menü Fonksiyonu (Tüm Sayfalar) ---
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
        });
    }

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

    // Sadece beğeni butonu olan sayfalarda çalışması için kontrol
    if (likeBtn && likeCountSpan) {
        const pageId = window.location.pathname; // Her sayfa için benzersiz bir ID
        const initialLikesText = likeCountSpan.textContent || '0';
        const baseLikes = parseInt(initialLikesText.replace(/[^0-9]/g, ''), 10) || 0;

        let liked = localStorage.getItem(pageId + '_liked') === 'true';
        let currentLikes = baseLikes;

        if (liked) {
            // Sayfa yüklendiğinde, eğer daha önce beğenilmişse ve sayı artırılmamışsa artır.
            // Bu, initialLikes'ın statik değerinden kaynaklanan mantık hatasını düzeltir.
            const storedLikes = localStorage.getItem(pageId + '_likes');
            if (storedLikes) {
                currentLikes = parseInt(storedLikes, 10);
            } else {
                // Eğer local storage'da sayı yoksa, beğenilmişse 1 ekle
                currentLikes = baseLikes + 1;
            }
            likeBtn.classList.add('liked');
            likeBtn.textContent = 'Beğenildi';
        }

        likeCountSpan.textContent = currentLikes.toLocaleString('tr-TR') + ' beğeni';

        likeBtn.addEventListener('click', () => {
            currentLikes += liked ? -1 : 1;
            liked = !liked;
            localStorage.setItem(pageId + '_liked', liked.toString());
            localStorage.setItem(pageId + '_likes', currentLikes.toString()); // Güncel sayıyı da sakla
            likeBtn.classList.toggle('liked');
            likeBtn.textContent = liked ? 'Beğenildi' : 'Beğen';
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
});