// Configuration de l'API
// On utilise Alpha Vantage (gratuit, 25 requêtes par jour)
const API_KEY = 'NA2DSFA47SYVII1X'; // Tu devras créer ta propre clé sur alphavantage.co
const API_BASE = 'https://www.alphavantage.co/query';

// Stockage local du portefeuille
let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
let comparisonList = [];

// Variables pour le mode constellation
let constellationMode = false;
let canvas, ctx;
let stars = [];
let mouseX = 0, mouseY = 0;
let animationId = null;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Application chargée !');
    
    // Event listeners
    document.getElementById('searchBtn').addEventListener('click', searchStock);
    document.getElementById('stockSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchStock();
        }
    });
    document.getElementById('clearPortfolioBtn').addEventListener('click', clearPortfolio);
    
    // Calculator
    document.getElementById('calculateBtn').addEventListener('click', calculateInvestment);
    
    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    loadTheme();
    
    // Constellation Toggle
    document.getElementById('constellationToggle').addEventListener('click', toggleConstellation);
    initConstellation();
    
    // Charger le portefeuille existant
    displayPortfolio();
});

// ===== MODE CONSTELLATION =====

function initConstellation() {
    canvas = document.getElementById('constellationCanvas');
    ctx = canvas.getContext('2d');
    
    // Ajuster la taille du canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Suivre la souris
    canvas.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Créer les étoiles initiales
    createStars(150);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function createStars(count) {
    stars = [];
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.5,
            twinkleSpeed: Math.random() * 0.02 + 0.01,
            isStock: false
        });
    }
    
    // Ajouter des étoiles pour le portefeuille
    addPortfolioStars();
}

function addPortfolioStars() {
    // Créer des étoiles spéciales pour chaque action du portefeuille
    portfolio.forEach((symbol, index) => {
        const angle = (index / portfolio.length) * Math.PI * 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.25;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        stars.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            size: 5 + Math.random() * 3,
            speedX: 0,
            speedY: 0,
            opacity: 1,
            twinkleSpeed: 0.02,
            isStock: true,
            symbol: symbol,
            color: `hsl(${(index * 360) / portfolio.length}, 70%, 60%)`,
            targetX: centerX + Math.cos(angle + 0.001) * radius,
            targetY: centerY + Math.sin(angle + 0.001) * radius,
            orbitSpeed: 0.0005
        });
    });
}

function animateConstellation() {
    if (!constellationMode) return;
    
    // Fond sombre avec traînée
    ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Mettre à jour et dessiner les étoiles
    stars.forEach((star, index) => {
        if (star.isStock) {
            // Étoiles du portefeuille - orbite circulaire
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const angle = Math.atan2(star.y - centerY, star.x - centerX);
            const radius = Math.sqrt(Math.pow(star.x - centerX, 2) + Math.pow(star.y - centerY, 2));
            
            const newAngle = angle + star.orbitSpeed;
            star.x = centerX + Math.cos(newAngle) * radius;
            star.y = centerY + Math.sin(newAngle) * radius;
            
            // Effet de souris - attraction
            const dx = mouseX - star.x;
            const dy = mouseY - star.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                star.x += dx * 0.01;
                star.y += dy * 0.01;
            }
            
            // Dessiner l'étoile du portefeuille (plus grande et colorée)
            ctx.save();
            
            // Halo
            const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 4);
            gradient.addColorStop(0, star.color + 'aa');
            gradient.addColorStop(1, star.color + '00');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Étoile principale
            ctx.fillStyle = star.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = star.color;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Symbole de l'action
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'white';
            ctx.font = '12px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText(star.symbol, star.x, star.y - star.size - 10);
            
            ctx.restore();
            
        } else {
            // Étoiles normales
            star.x += star.speedX;
            star.y += star.speedY;
            
            // Rebond sur les bords
            if (star.x < 0 || star.x > canvas.width) star.speedX *= -1;
            if (star.y < 0 || star.y > canvas.height) star.speedY *= -1;
            
            // Effet de scintillement
            star.opacity += star.twinkleSpeed;
            if (star.opacity >= 1 || star.opacity <= 0.3) {
                star.twinkleSpeed *= -1;
            }
            
            // Dessiner l'étoile normale
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Connecter les étoiles du portefeuille entre elles
    const stockStars = stars.filter(s => s.isStock);
    for (let i = 0; i < stockStars.length; i++) {
        for (let j = i + 1; j < stockStars.length; j++) {
            const dx = stockStars[i].x - stockStars[j].x;
            const dy = stockStars[i].y - stockStars[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 400) {
                const opacity = (1 - distance / 400) * 0.3;
                ctx.strokeStyle = `rgba(157, 123, 179, ${opacity})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(stockStars[i].x, stockStars[i].y);
                ctx.lineTo(stockStars[j].x, stockStars[j].y);
                ctx.stroke();
            }
        }
    }
    
    // Connecter les étoiles normales proches
    for (let i = 0; i < stars.length - 1; i++) {
        if (stars[i].isStock) continue;
        
        for (let j = i + 1; j < stars.length; j++) {
            if (stars[j].isStock) continue;
            
            const dx = stars[i].x - stars[j].x;
            const dy = stars[i].y - stars[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const opacity = (1 - distance / 100) * 0.15;
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(stars[i].x, stars[i].y);
                ctx.lineTo(stars[j].x, stars[j].y);
                ctx.stroke();
            }
        }
    }
    
    animationId = requestAnimationFrame(animateConstellation);
}

function toggleConstellation() {
    constellationMode = !constellationMode;
    
    if (constellationMode) {
        document.body.classList.add('constellation-mode');
        createStars(150); // Recréer les étoiles avec le portefeuille actuel
        animateConstellation();
        console.log('🌌 Mode Constellation activé');
    } else {
        document.body.classList.remove('constellation-mode');
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        // Nettoyer le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log('✨ Mode Normal activé');
    }
}

// ===== FIN MODE CONSTELLATION =====

// Fonction principale de recherche
async function searchStock() {
    const symbol = document.getElementById('stockSearch').value.trim().toUpperCase();
    
    if (!symbol) {
        showError('Veuillez entrer un symbole d\'action');
        return;
    }
    
    showLoading('searchResults');
    
    try {
        const stockData = await fetchStockData(symbol);
        displayStockCard(stockData, 'searchResults');
        
        // Charger les news pour cette action
        fetchStockNews(symbol);
        
        // Charger le graphique
        fetchAndDisplayChart(symbol);
    } catch (error) {
        // Si l'API ne marche pas, afficher quand même des données de démo
        console.error('Erreur API:', error);
        displayDemoStock(symbol);
    }
}

// Récupérer les données d'une action
async function fetchStockData(symbol) {
    const quoteUrl = `${API_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    
    const response = await fetch(quoteUrl);
    const data = await response.json();
    
    if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
        const quote = data['Global Quote'];
        
        return {
            symbol: symbol,
            name: symbol,
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: quote['10. change percent'],
            high: parseFloat(quote['03. high']),
            low: parseFloat(quote['04. low']),
            volume: parseInt(quote['06. volume']),
            previousClose: parseFloat(quote['08. previous close'])
        };
    } else {
        throw new Error('Action non trouvée');
    }
}

// Afficher une carte d'action
function displayStockCard(stock, containerId) {
    const container = document.getElementById(containerId);
    const isPositive = stock.change >= 0;
    
    const card = `
        <div class="stock-card">
            <div class="stock-header">
                <div>
                    <div class="stock-symbol">${stock.symbol}</div>
                    <div class="stock-name">${stock.name}</div>
                </div>
                <div class="stock-price">$${stock.price.toFixed(2)}</div>
            </div>
            
            <div class="stock-change ${isPositive ? 'positive' : 'negative'}">
                ${isPositive ? '↑' : '↓'} ${Math.abs(stock.change).toFixed(2)} (${stock.changePercent})
            </div>
            
            <div class="stock-details">
                <div class="detail-item">
                    <div class="detail-label">Plus Haut</div>
                    <div class="detail-value">$${stock.high.toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Plus Bas</div>
                    <div class="detail-value">$${stock.low.toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Volume</div>
                    <div class="detail-value">${formatVolume(stock.volume)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Clôture Précédente</div>
                    <div class="detail-value">$${stock.previousClose.toFixed(2)}</div>
                </div>
            </div>
            
            <div class="action-buttons">
                <button class="add-btn" onclick="addToPortfolio('${stock.symbol}')">
                    ➕ Ajouter au portefeuille
                </button>
                <button class="compare-btn" onclick="addToComparison('${stock.symbol}')">
                    🔍 Comparer
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = card;
}

// Afficher une action de démo si l'API ne marche pas
function displayDemoStock(symbol) {
    const container = document.getElementById('searchResults');
    
    const basePrice = 150 + Math.random() * 100;
    const change = (Math.random() - 0.5) * 5;
    const changePercent = ((change / basePrice) * 100).toFixed(2) + '%';
    const isPositive = change >= 0;
    
    const stock = {
        symbol: symbol,
        name: symbol,
        price: basePrice,
        change: change,
        changePercent: changePercent,
        high: basePrice + Math.abs(change) + 2,
        low: basePrice - Math.abs(change) - 2,
        volume: Math.floor(50000000 + Math.random() * 50000000),
        previousClose: basePrice - change
    };
    
    displayStockCard(stock, 'searchResults');
    
    const note = document.createElement('div');
    note.style.cssText = 'background: rgba(201, 160, 220, 0.1); padding: 15px; border-radius: 12px; margin-top: 15px; border-left: 3px solid #c9a0dc;';
    note.innerHTML = '<small style="color: #8b7d8b;">💡 <em>Données de démonstration (API limitée). Obtenez votre clé gratuite sur alphavantage.co</em></small>';
    container.appendChild(note);
    
    displayGenericNews(symbol);
    createDemoChart(symbol);
    document.getElementById('chartContainer').style.display = 'block';
}

// Ajouter au portefeuille
async function addToPortfolio(symbol) {
    if (portfolio.includes(symbol)) {
        showError('Cette action est déjà dans votre portefeuille');
        return;
    }
    
    portfolio.push(symbol);
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    displayPortfolio();
    
    // Mettre à jour les étoiles du mode constellation
    if (constellationMode) {
        createStars(150);
    }
    
    alert(`✅ ${symbol} ajouté au portefeuille !`);
}

// Afficher le portefeuille
async function displayPortfolio() {
    const container = document.getElementById('portfolioList');
    
    if (portfolio.length === 0) {
        container.innerHTML = '<p class="empty-state">Votre portefeuille est vide. Ajoutez des actions !</p>';
        return;
    }
    
    container.innerHTML = '<div class="loading">Chargement du portefeuille...</div>';
    
    let portfolioHTML = '';
    
    for (const symbol of portfolio) {
        try {
            // Essayer de récupérer les vraies données
            const stockData = await fetchStockData(symbol);
            const isPositive = stockData.change >= 0;
            
            portfolioHTML += `
                <div class="stock-card">
                    <div class="stock-header">
                        <div>
                            <div class="stock-symbol">${stockData.symbol}</div>
                        </div>
                        <div class="stock-price">$${stockData.price.toFixed(2)}</div>
                    </div>
                    
                    <div class="stock-change ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '↑' : '↓'} ${Math.abs(stockData.change).toFixed(2)} (${stockData.changePercent})
                    </div>
                    
                    <div class="action-buttons">
                        <button class="remove-btn" onclick="removeFromPortfolio('${symbol}')">
                            ❌ Retirer
                        </button>
                        <button class="compare-btn" onclick="addToComparison('${symbol}')">
                            🔍 Comparer
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            // Si l'API ne marche pas, afficher avec des données de démo
            console.error(`Erreur pour ${symbol}, utilisation des données de démo:`, error);
            
            const basePrice = 150 + Math.random() * 100;
            const change = (Math.random() - 0.5) * 5;
            const changePercent = ((change / basePrice) * 100).toFixed(2) + '%';
            const isPositive = change >= 0;
            
            portfolioHTML += `
                <div class="stock-card">
                    <div class="stock-header">
                        <div>
                            <div class="stock-symbol">${symbol}</div>
                            <div class="stock-name" style="font-size: 0.75em; color: #c9a0dc;">💡 Données démo</div>
                        </div>
                        <div class="stock-price">$${basePrice.toFixed(2)}</div>
                    </div>
                    
                    <div class="stock-change ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '↑' : '↓'} ${Math.abs(change).toFixed(2)} (${changePercent})
                    </div>
                    
                    <div class="action-buttons">
                        <button class="remove-btn" onclick="removeFromPortfolio('${symbol}')">
                            ❌ Retirer
                        </button>
                        <button class="compare-btn" onclick="addToComparison('${symbol}')">
                            🔍 Comparer
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = portfolioHTML;
}

// Retirer du portefeuille
function removeFromPortfolio(symbol) {
    portfolio = portfolio.filter(s => s !== symbol);
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    displayPortfolio();
    
    // Mettre à jour les étoiles du mode constellation
    if (constellationMode) {
        createStars(150);
    }
}

// Effacer tout le portefeuille
function clearPortfolio() {
    if (confirm('Êtes-vous sûr de vouloir effacer tout votre portefeuille ?')) {
        portfolio = [];
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
        displayPortfolio();
        
        // Mettre à jour les étoiles du mode constellation
        if (constellationMode) {
            createStars(150);
        }
    }
}

// Ajouter à la comparaison
async function addToComparison(symbol) {
    if (comparisonList.length >= 3) {
        showError('Vous pouvez comparer maximum 3 actions à la fois');
        return;
    }
    
    if (comparisonList.includes(symbol)) {
        showError('Cette action est déjà dans la comparaison');
        return;
    }
    
    comparisonList.push(symbol);
    displayComparison();
}

// Afficher la comparaison
async function displayComparison() {
    const container = document.getElementById('comparisonArea');
    
    if (comparisonList.length === 0) {
        container.innerHTML = '<p class="empty-state">Recherchez des actions pour commencer à les comparer</p>';
        return;
    }
    
    container.innerHTML = '<div class="loading">Chargement de la comparaison...</div>';
    
    let comparisonHTML = '<div class="comparison-grid">';
    
    for (const symbol of comparisonList) {
        try {
            const stockData = await fetchStockData(symbol);
            const isPositive = stockData.change >= 0;
            
            comparisonHTML += `
                <div class="stock-card">
                    <div class="stock-header">
                        <div>
                            <div class="stock-symbol">${stockData.symbol}</div>
                        </div>
                        <div class="stock-price">$${stockData.price.toFixed(2)}</div>
                    </div>
                    
                    <div class="stock-change ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '↑' : '↓'} ${Math.abs(stockData.change).toFixed(2)} (${stockData.changePercent})
                    </div>
                    
                    <div class="stock-details">
                        <div class="detail-item">
                            <div class="detail-label">Plus Haut</div>
                            <div class="detail-value">$${stockData.high.toFixed(2)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Plus Bas</div>
                            <div class="detail-value">$${stockData.low.toFixed(2)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Volume</div>
                            <div class="detail-value">${formatVolume(stockData.volume)}</div>
                        </div>
                    </div>
                    
                    <button class="remove-btn" onclick="removeFromComparison('${symbol}')">
                        ❌ Retirer de la comparaison
                    </button>
                </div>
            `;
        } catch (error) {
            console.error(`Erreur pour ${symbol}:`, error);
        }
    }
    
    comparisonHTML += '</div>';
    container.innerHTML = comparisonHTML;
}

// Retirer de la comparaison
function removeFromComparison(symbol) {
    comparisonList = comparisonList.filter(s => s !== symbol);
    displayComparison();
}

// Récupérer les actualités financières
async function fetchStockNews(symbol) {
    const newsContainer = document.querySelector('.news-container');
    
    newsContainer.innerHTML = `
        <div class="loading">✨ Chargement des actualités pour ${symbol}...</div>
    `;
    
    try {
        const newsUrl = `${API_BASE}?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${API_KEY}&limit=6`;
        
        const response = await fetch(newsUrl);
        const data = await response.json();
        
        if (data.feed && data.feed.length > 0) {
            displayNews(symbol, data.feed);
        } else {
            displayGenericNews(symbol);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des news:', error);
        displayGenericNews(symbol);
    }
}

// Afficher les actualités
function displayNews(symbol, newsItems) {
    const newsContainer = document.querySelector('.news-container');
    
    let newsHTML = `
        <div class="news-header">
            <div class="news-stock-symbol">📰 Actualités pour ${symbol}</div>
            <div class="news-count">${newsItems.length} article${newsItems.length > 1 ? 's' : ''}</div>
        </div>
    `;
    
    newsItems.forEach((article, index) => {
        if (index < 6) {
            const title = article.title || 'Article sans titre';
            const summary = article.summary || 'Aucun résumé disponible';
            const source = article.source || 'Source inconnue';
            const timePublished = article.time_published || '';
            const url = article.url || '#';
            
            let sentimentClass = 'sentiment-neutral';
            let sentimentText = 'Neutre';
            
            if (article.overall_sentiment_label) {
                const sentiment = article.overall_sentiment_label.toLowerCase();
                if (sentiment.includes('positive') || sentiment.includes('bullish')) {
                    sentimentClass = 'sentiment-positive';
                    sentimentText = 'Positif 📈';
                } else if (sentiment.includes('negative') || sentiment.includes('bearish')) {
                    sentimentClass = 'sentiment-negative';
                    sentimentText = 'Négatif 📉';
                }
            }
            
            let timeAgo = 'Récent';
            if (timePublished) {
                const date = new Date(
                    timePublished.substring(0, 4),
                    parseInt(timePublished.substring(4, 6)) - 1,
                    timePublished.substring(6, 8),
                    timePublished.substring(9, 11),
                    timePublished.substring(11, 13)
                );
                timeAgo = getTimeAgo(date);
            }
            
            newsHTML += `
                <div class="news-article" onclick="window.open('${url}', '_blank')">
                    <div class="news-title">${title}</div>
                    <div class="news-summary">${summary.substring(0, 200)}${summary.length > 200 ? '...' : ''}</div>
                    <div class="news-meta">
                        <span class="news-source">📡 ${source}</span>
                        <span class="news-sentiment ${sentimentClass}">${sentimentText}</span>
                        <span class="news-time">${timeAgo}</span>
                    </div>
                </div>
            `;
        }
    });
    
    newsContainer.innerHTML = newsHTML;
}

// Afficher des news génériques si l'API ne fonctionne pas
function displayGenericNews(symbol) {
    const newsContainer = document.querySelector('.news-container');
    
    const genericNews = [
        {
            title: `${symbol} : Analyse des perspectives de croissance`,
            summary: "Les analystes examinent les dernières performances et les prévisions futures pour cette action. Les fondamentaux restent solides selon plusieurs experts du marché.",
            source: "Market Watch",
            time: "Il y a 2 heures",
            sentiment: "neutral"
        },
        {
            title: `Mise à jour du marché concernant ${symbol}`,
            summary: "Le titre continue d'attirer l'attention des investisseurs avec des volumes de transactions en hausse cette semaine.",
            source: "Financial Times",
            time: "Il y a 5 heures",
            sentiment: "positive"
        },
        {
            title: `${symbol} : Ce que les investisseurs doivent savoir`,
            summary: "Point sur la situation actuelle de l'entreprise et les facteurs clés qui pourraient influencer son cours à court terme.",
            source: "Bloomberg",
            time: "Il y a 1 jour",
            sentiment: "neutral"
        }
    ];
    
    let newsHTML = `
        <div class="news-header">
            <div class="news-stock-symbol">📰 Actualités pour ${symbol}</div>
            <div class="news-count">${genericNews.length} articles</div>
        </div>
        <div style="background: rgba(201, 160, 220, 0.1); padding: 15px; border-radius: 12px; margin-bottom: 20px; border-left: 3px solid #c9a0dc;">
            <small style="color: #8b7d8b;">💡 <em>Actualités illustratives. Pour des news en temps réel, consultez des sources financières spécialisées.</em></small>
        </div>
    `;
    
    genericNews.forEach(article => {
        const sentimentClass = article.sentiment === 'positive' ? 'sentiment-positive' : 
                             article.sentiment === 'negative' ? 'sentiment-negative' : 
                             'sentiment-neutral';
        const sentimentText = article.sentiment === 'positive' ? 'Positif 📈' : 
                            article.sentiment === 'negative' ? 'Négatif 📉' : 
                            'Neutre 📊';
        
        newsHTML += `
            <div class="news-article">
                <div class="news-title">${article.title}</div>
                <div class="news-summary">${article.summary}</div>
                <div class="news-meta">
                    <span class="news-source">📡 ${article.source}</span>
                    <span class="news-sentiment ${sentimentClass}">${sentimentText}</span>
                    <span class="news-time">${article.time}</span>
                </div>
            </div>
        `;
    });
    
    newsContainer.innerHTML = newsHTML;
}

// Calculer le temps écoulé
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
        return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
        return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
        return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
        return date.toLocaleDateString('fr-FR');
    }
}

// Calculateur d'investissement
async function calculateInvestment() {
    const symbol = document.getElementById('calcSymbol').value.trim().toUpperCase();
    const shares = parseInt(document.getElementById('calcShares').value);
    const resultsContainer = document.getElementById('calculatorResults');
    
    if (!symbol) {
        resultsContainer.innerHTML = '<div class="error-message">💭 Veuillez entrer un symbole d\'action</div>';
        return;
    }
    
    if (!shares || shares < 1) {
        resultsContainer.innerHTML = '<div class="error-message">💭 Veuillez entrer un nombre d\'actions valide</div>';
        return;
    }
    
    resultsContainer.innerHTML = '<div class="loading">✨ Calcul en cours...</div>';
    
    try {
        const stockData = await fetchStockData(symbol);
        
        const totalCost = stockData.price * shares;
        const potentialValue = stockData.price * shares;
        const avgDailyChange = Math.abs(stockData.change);
        const potentialDailyVariation = avgDailyChange * shares;
        
        const changePercent = parseFloat(stockData.changePercent.replace('%', ''));
        const isPositive = changePercent >= 0;
        
        const resultHTML = `
            <div class="result-card">
                <div class="result-header">
                    <div class="result-title">Votre investissement dans ${symbol}</div>
                    <div class="result-total">$${totalCost.toFixed(2)}</div>
                </div>
                
                <div class="result-details">
                    <div class="result-item">
                        <div class="result-label">Nombre d'actions</div>
                        <div class="result-value">${shares}</div>
                    </div>
                    
                    <div class="result-item">
                        <div class="result-label">Prix par action</div>
                        <div class="result-value">$${stockData.price.toFixed(2)}</div>
                    </div>
                    
                    <div class="result-item">
                        <div class="result-label">Coût total</div>
                        <div class="result-value">$${totalCost.toFixed(2)}</div>
                    </div>
                    
                    <div class="result-item">
                        <div class="result-label">Variation du jour</div>
                        <div class="result-value ${isPositive ? 'positive' : 'negative'}" style="color: ${isPositive ? '#a8c9a8' : '#d4a5a5'}">
                            ${isPositive ? '+' : ''}$${(stockData.change * shares).toFixed(2)}
                        </div>
                    </div>
                </div>
                
                <div class="investment-tip">
                    💡 <strong>Note zen :</strong> Avec ${shares} action${shares > 1 ? 's' : ''} de ${symbol}, 
                    votre investissement varie d'environ $${potentialDailyVariation.toFixed(2)} par jour. 
                    ${isPositive ? '✨ Belle journée pour vos actions !' : '🌸 Restez sereine, les marchés fluctuent naturellement.'}
                </div>
            </div>
        `;
        
        resultsContainer.innerHTML = resultHTML;
        
    } catch (error) {
        resultsContainer.innerHTML = '<div class="error-message">💭 Impossible de calculer. Vérifiez le symbole et réessayez.</div>';
        console.error(error);
    }
}

// Fonctions utilitaires
function formatVolume(volume) {
    if (volume >= 1000000) {
        return (volume / 1000000).toFixed(2) + 'M';
    } else if (volume >= 1000) {
        return (volume / 1000).toFixed(2) + 'K';
    }
    return volume.toString();
}

function showLoading(containerId) {
    document.getElementById(containerId).innerHTML = '<div class="loading">Chargement...</div>';
}

function showError(message) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = `<div class="error-message">❌ ${message}</div>`;
    setTimeout(() => {
        searchResults.innerHTML = '';
    }, 3000);
}

// ===== GRAPHIQUE =====
let stockChart = null;

async function fetchAndDisplayChart(symbol) {
    const chartContainer = document.getElementById('chartContainer');
    chartContainer.style.display = 'block';
    
    try {
        const chartUrl = `${API_BASE}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
        const response = await fetch(chartUrl);
        const data = await response.json();
        
        const timeSeries = data['Time Series (Daily)'];
        
        if (!timeSeries) {
            createDemoChart(symbol);
            return;
        }
        
        const dates = Object.keys(timeSeries).slice(0, 30).reverse();
        const prices = dates.map(date => parseFloat(timeSeries[date]['4. close']));
        
        createChart(symbol, dates, prices);
        
    } catch (error) {
        console.error('Erreur graphique:', error);
        createDemoChart(symbol);
    }
}

function createChart(symbol, dates, prices) {
    const ctx = document.getElementById('stockChart').getContext('2d');
    
    if (stockChart) {
        stockChart.destroy();
    }
    
    const isPositive = prices[prices.length - 1] > prices[0];
    const lineColor = isPositive ? '#a8c9a8' : '#e8c1c1';
    const gradientColor = isPositive ? 
        'rgba(168, 201, 168, 0.2)' : 
        'rgba(232, 193, 193, 0.2)';
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, gradientColor);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    const formattedDates = dates.map(date => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    
    stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedDates,
            datasets: [{
                label: `Prix ${symbol}`,
                data: prices,
                borderColor: lineColor,
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: lineColor,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: lineColor,
                    borderWidth: 2,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '$' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#8b7d8b',
                        maxRotation: 0,
                        autoSkipPadding: 20
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(212, 165, 165, 0.1)'
                    },
                    ticks: {
                        color: '#8b7d8b',
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function createDemoChart(symbol) {
    const today = new Date();
    const dates = [];
    const basePrice = 150 + Math.random() * 100;
    const prices = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
        
        const variation = (Math.random() - 0.5) * 10;
        const price = i === 29 ? basePrice : prices[prices.length - 1] + variation;
        prices.push(Math.max(price, basePrice * 0.8));
    }
    
    createChart(symbol, dates, prices);
    
    const note = document.createElement('p');
    note.style.cssText = 'text-align: center; color: #8b7d8b; font-size: 0.85em; margin-top: 10px; font-style: italic;';
    note.textContent = '💡 Données illustratives pour démonstration';
    document.getElementById('chartContainer').appendChild(note);
}

// ===== THEME TOGGLE =====
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    const toggleBtn = document.getElementById('themeToggle');
    toggleBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        toggleBtn.style.transform = 'rotate(0deg)';
    }, 400);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}
    
    createChart(symbol, dates, prices);
    
    const note = document.createElement('p');
    note.style.cssText = 'text-align: center; color: #8b7d8b; font-size: 0.85em; margin-top: 10px; font-style: italic;';
    note.textContent = '💡 Données illustratives pour démonstration';
    document.getElementById('chartContainer').appendChild(note);
}

// ===== THEME TOGGLE =====
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    const toggleBtn = document.getElementById('themeToggle');
    toggleBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        toggleBtn.style.transform = 'rotate(0deg)';
    }, 400);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}
