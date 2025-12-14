const fs = require('fs');
const path = require('path');

// content.json dosyasının yolu - fonksiyonun konuşlandığı yere göre ayarlanmalı
// Genellikle Netlify fonksiyonları, ana statik dosyalardan ayrı bir ortamda çalışır.
// Bu örnekte, content.json'ın fonksiyonla aynı dizine veya bir üst dizine kopyalandığını varsayıyoruz.
// Eğer production ortamında hata alınırsa, 'fs' yerine 'fetch' kullanılabilir.
const contentPath = path.resolve(__dirname, '../../content.json');

let siteContent = null;

// content.json dosyasını bir kez yükle ve önbelleğe al
const loadSiteContent = () => {
    if (siteContent) {
        return siteContent;
    }
    try {
        const rawData = fs.readFileSync(contentPath, 'utf8');
        siteContent = JSON.parse(rawData);
        return siteContent;
    } catch (error) {
        console.error('Error loading site content:', error);
        return { posts: [], pages: {}, projects: [], expertise: [] };
    }
};

// Basit bot yanıt mantığı
const getDynamicBotResponse = (userMessage, content) => {
    const lowerCaseMessage = userMessage.toLowerCase();

    // Özel durumlar (mevcut bot'taki gibi)
    if (lowerCaseMessage.includes('merhaba') || lowerCaseMessage.includes('selam')) {
        return `Merhaba! Size nasıl yardımcı olabilirim?`;
    } else if (lowerCaseMessage.includes('teşekkürler') || lowerCaseMessage.includes('sağ ol')) {
        return `Rica ederim, başka bir isteğiniz var mıydı?`;
    } else if (lowerCaseMessage.includes('yusuf avşar kimdir')) {
        const aboutPage = content.pages?.about;
        if (aboutPage && aboutPage.introParagraph) {
            return `Yusuf Avşar: ${aboutPage.introParagraph.substring(0, 200)}... Daha fazla bilgi için Hakkımda sayfasına göz atabilirsiniz.`;
        }
        return `Yusuf Avşar, güvenlik odaklı geliştirme lideri ve hibrit bir mimardır. Python, Golang ve bulut teknolojileri konusunda uzmandır.`;
    }

    // Proje arama
    const matchingProjects = (content.projects || []).filter(project => 
        project.title.toLowerCase().includes(lowerCaseMessage) || 
        project.description.toLowerCase().includes(lowerCaseMessage) ||
        project.category.toLowerCase().includes(lowerCaseMessage)
    );
    if (matchingProjects.length > 0) {
        const project = matchingProjects[0]; // İlk eşleşeni döndür
        return `Projelerimden biriyle ilgili bir şey buldum: "${project.title}" (${project.category}). Açıklaması: ${project.description}. Detaylar için: ${project.link || ''}`; 
    }

    // Blog yazısı arama
    const matchingPosts = (content.posts || []).filter(post => 
        post.title.toLowerCase().includes(lowerCaseMessage) || 
        post.summary.toLowerCase().includes(lowerCaseMessage) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowerCaseMessage))) ||
        post.content.toLowerCase().includes(lowerCaseMessage)
    );
    if (matchingPosts.length > 0) {
        const post = matchingPosts[0]; // İlk eşleşeni döndür
        return `Blog yazılarımda bir eşleşme buldum: "${post.title}" (${post.category}). Özeti: ${post.summary}. Okumak için: blog.html#${post.slug}`; 
    }

    // Uzmanlık alanı arama
    const matchingExpertise = (content.expertise || []).filter(item =>
        item.title.toLowerCase().includes(lowerCaseMessage) ||
        item.description.toLowerCase().includes(lowerCaseMessage)
    );
    if (matchingExpertise.length > 0) {
        const item = matchingExpertise[0]; // İlk eşleşeni döndür
        return `Uzmanlık alanlarımdan biriyle ilgili bir bilgi: "${item.title}". Açıklaması: ${item.description}.`;
    }

    // Varsayılan yanıt
    return `Üzgünüm, şu an için bu konuyu anlayamadım. Sitenin içeriğinde aradığınız bilgiye dair bir eşleşme bulamadım. Lütfen farklı bir şekilde sormayı deneyin veya sitenin ilgili bölümlerini inceleyin.`;
};

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { message } = JSON.parse(event.body);
        if (!message) {
            return { statusCode: 400, body: 'Bad Request: Missing message parameter.' };
        }

        const siteData = loadSiteContent();
        const botResponse = getDynamicBotResponse(message, siteData);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response: botResponse }),
        };
    } catch (error) {
        console.error('Chatbot function error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal Server Error', message: error.message }),
        };
    }
};

