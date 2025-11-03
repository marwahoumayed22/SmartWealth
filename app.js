// Configuration de l'API
// On utilise Alpha Vantage (gratuit, 25 requêtes par jour)
const API_KEY = 'NA2DSFA47SYVII1X'; // Tu devras créer ta propre clé sur alphavantage.co
const API_BASE = 'https://www.alphavantage.co/query';

// Stockage local du portefeuille
let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
let comparisonList = [];

// Variables pour le rafraîchissement automatique
let autoRefreshInterval = null;
let isAutoRefreshEnabled = false;

// Variables pour la conversion de devise
let currentCurrency = localStorage.getItem('selectedCurrency') || 'USD';
let exchangeRates = {
    'USD': 1,
    'EUR': 0.92,
    'CAD': 1.36,
    'GBP': 0.79,
    'JPY': 149.50,
    'CHF': 0.88
};

// Symboles de devises
const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'CAD': '$',
    'GBP': '£',
    'JPY': '¥',
    'CHF': 'Fr'
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Application chargée !');
    
    // Charger le thème sauvegardé
    loadTheme();
    
    // Initialiser la devise
    initializeCurrency();
    
    // Initialiser le rafraîchissement automatique
    initializeAutoRefresh();
    
    // Event listeners
    document.getElementById('searchBtn').addEventListener('click', searchStock);
    document.getElementById('stockSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchStock();
        }
    });
    document.getElementById('clearPortfolioBtn').addEventListener('click', clearPortfolio);
    
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Currency selector
    document.getElementById('currencySelect').addEventListener('change', handleCurrencyChange);
    
    // Auto-refresh controls
    document.getElementById('autoRefreshToggle').addEventListener('change', toggleAutoRefresh);
    document.getElementById('refreshInterval').addEventListener('change', updateRefreshInterval);
    
    // Calculator
    document.getElementById('calculateBtn').addEventListener('click', calculateInvestment);
    
    // Charger le portefeuille existant
    displayPortfolio();
    
    // Mettre à jour les taux de change
    updateExchangeRates();
});

// === MODE SOMBRE ===

// Charger le thème depuis localStorage
function loadTheme() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        updateToggleIcon(true);
    }
}

// Basculer entre mode clair et sombre
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    updateToggleIcon(isDarkMode);
    
    // Animation douce
    document.body.style.transition = 'all 0.5s ease';
}

// Mettre à jour l'icône du bouton
function updateToggleIcon(isDarkMode) {
    const toggleIcon = document.querySelector('.toggle-icon');
    toggleIcon.textContent = isDarkMode ? '☀️' : '🌙';
}

// === CONVERSION DE DEVISES ===

// Initialiser le sélecteur de devise
function initializeCurrency() {
    const currencySelect = document.getElementById('currencySelect');
    currencySelect.value = currentCurrency;
}

// Gérer le changement de devise
function handleCurrencyChange(event) {
    currentCurrency = event.target.value;
    localStorage.setItem('selectedCurrency', currentCurrency);
    
    // Rafraîchir l'affichage
    displayPortfolio();
    
    // Rafraîchir les résultats de recherche s'il y en a
    const searchResults = document.getElementById('searchResults');
    if (searchResults.innerHTML && !searchResults.innerHTML.includes('loading')) {
        const symbol = document.getElementById('stockSearch').value.trim().toUpperCase();
        if (symbol) {
            searchStock();
        }
    }
    
    // Rafraîchir le calculateur s'il y a des résultats
    const calcResults = document.getElementById('calculatorResults');
    if (calcResults.innerHTML && !calcResults.innerHTML.includes('loading')) {
        calculateInvestment();
    }
}

// Convertir un montant USD vers la devise sélectionnée
function convertCurrency(amountUSD) {
    return amountUSD * exchangeRates[currentCurrency];
}

// Obtenir le symbole de la devise actuelle
function getCurrencySymbol() {
    return currencySymbols[currentCurrency];
}

// Formater un prix avec la devise
function formatPrice(price) {
    const convertedPrice = convertCurrency(price);
    const symbol = getCurrencySymbol();
    
    // Format selon la devise
    if (currentCurrency === 'JPY') {
        return `${symbol}${Math.round(convertedPrice).toLocaleString('fr-FR')}`;
    } else {
        return `${symbol}${convertedPrice.toFixed(2)}`;
    }
}

// Mettre à jour les taux de change (API gratuite)
async function updateExchangeRates() {
    try {
        // Utiliser une API de taux de change gratuite
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        
        if (data.rates) {
            exchangeRates = {
                'USD': 1,
                'EUR': data.rates.EUR || 0.92,
                'CAD': data.rates.CAD || 1.36,
                'GBP': data.rates.GBP || 0.79,
                'JPY': data.rates.JPY || 149.50,
                'CHF': data.rates.CHF || 0.88
            };
            console.log('✅ Taux de change mis à jour');
        }
    } catch (error) {
        console.log('ℹ️ Utilisation des taux de change par défaut');
    }
}

// === RAFRAÎCHISSEMENT AUTOMATIQUE ===

// Initialiser le rafraîchissement automatique
function initializeAutoRefresh() {
    const autoRefreshToggle = document.getElementById('autoRefreshToggle');
    const refreshInterval = document.getElementById('refreshInterval');
    
    // Charger les préférences sauvegardées
    const savedAutoRefresh = localStorage.getItem('autoRefresh') === 'true';
    const savedInterval = localStorage.getItem('refreshInterval') || '60';
    
    autoRefreshToggle.checked = savedAutoRefresh;
    refreshInterval.value = savedInterval;
    refreshInterval.disabled = !savedAutoRefresh;
    
    if (savedAutoRefresh) {
        startAutoRefresh(parseInt(savedInterval));
    }
}

// Activer/désactiver le rafraîchissement automatique
function toggleAutoRefresh(event) {
    isAutoRefreshEnabled = event.target.checked;
    const refreshInterval = document.getElementById('refreshInterval');
    
    refreshInterval.disabled = !isAutoRefreshEnabled;
    localStorage.setItem('autoRefresh', isAutoRefreshEnabled);
    
    if (isAutoRefreshEnabled) {
        const interval = parseInt(refreshInterval.value);
        startAutoRefresh(interval);
        showNotification('🔄 Rafraîchissement automatique activé', 'success');
    } else {
        stopAutoRefresh();
        showNotification('⏸️ Rafraîchissement automatique désactivé', 'info');
    }
}

// Mettre à jour l'intervalle de rafraîchissement
function updateRefreshInterval(event) {
    const interval = parseInt(event.target.value);
    localStorage.setItem('refreshInterval', interval);
    
    if (isAutoRefreshEnabled) {
        stopAutoRefresh();
        startAutoRefresh(interval);
        showNotification(`🔄 Intervalle mis à jour: ${interval}s`, 'success');
    }
}

// Démarrer le rafraîchissement automatique
function startAutoRefresh(intervalSeconds) {
    stopAutoRefresh(); // Arrêter l'ancien intervalle s'il existe
    
    autoRefreshInterval = setInterval(() => {
        console.log('🔄 Rafraîchissement automatique...');
        refreshData();
    }, intervalSeconds * 1000);
    
    isAutoRefreshEnabled = true;
}

// Arrêter le rafraîchissement automatique
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
    isAutoRefreshEnabled = false;
}

// Rafraîchir les données
async function refreshData() {
    // Rafraîchir le portefeuille si non vide
    if (portfolio.length > 0) {
        await displayPortfolio();
    }
    
    // Rafraîchir les résultats de recherche s'il y en a
    const searchResults = document.getElementById('searchResults');
    if (searchResults.innerHTML && !searchResults.innerHTML.includes('empty-state') && !searchResults.innerHTML.includes('loading')) {
        const symbol = document.getElementById('stockSearch').value.trim().toUpperCase();
        if (symbol) {
            await searchStock();
        }
    }
}

// Afficher une notification
function showNotification(message, type = 'info') {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? 'var(--vert)' : 'var(--lavande)'};
        color: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px var(--shadow-color);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-family: Georgia, serif;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

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
    } catch (error) {
        showError('Erreur lors de la recherche. Vérifiez le symbole et réessayez.');
        console.error(error);
    }
}

// Récupérer les données d'une action
async function fetchStockData(symbol) {
    // Quote endpoint pour les données en temps réel
    const quoteUrl = `${API_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    
    const response = await fetch(quoteUrl);
    const data = await response.json();
    
    if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
        const quote = data['Global Quote'];
        
        return {
            symbol: symbol,
            name: symbol, // L'API gratuite ne donne pas toujours le nom complet
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
                <div class="stock-price">${formatPrice(stock.price)}</div>
            </div>
            
            <div class="stock-change ${isPositive ? 'positive' : 'negative'}">
                ${isPositive ? '↑' : '↓'} ${formatPrice(Math.abs(stock.change))} (${stock.changePercent})
            </div>
            
            <div class="stock-details">
                <div class="detail-item">
                    <div class="detail-label">Plus Haut</div>
                    <div class="detail-value">${formatPrice(stock.high)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Plus Bas</div>
                    <div class="detail-value">${formatPrice(stock.low)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Volume</div>
                    <div class="detail-value">${formatVolume(stock.volume)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Clôture Précédente</div>
                    <div class="detail-value">${formatPrice(stock.previousClose)}</div>
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

// Ajouter au portefeuille
async function addToPortfolio(symbol) {
    if (portfolio.includes(symbol)) {
        showError('Cette action est déjà dans votre portefeuille');
        return;
    }
    
    portfolio.push(symbol);
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    displayPortfolio();
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
            const stockData = await fetchStockData(symbol);
            const isPositive = stockData.change >= 0;
            
            portfolioHTML += `
                <div class="stock-card">
                    <div class="stock-header">
                        <div>
                            <div class="stock-symbol">${stockData.symbol}</div>
                        </div>
                        <div class="stock-price">${formatPrice(stockData.price)}</div>
                    </div>
                    
                    <div class="stock-change ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '↑' : '↓'} ${formatPrice(Math.abs(stockData.change))} (${stockData.changePercent})
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
            console.error(`Erreur pour ${symbol}:`, error);
        }
    }
    
    container.innerHTML = portfolioHTML;
}

// Retirer du portefeuille
function removeFromPortfolio(symbol) {
    portfolio = portfolio.filter(s => s !== symbol);
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    displayPortfolio();
}

// Effacer tout le portefeuille
function clearPortfolio() {
    if (confirm('Êtes-vous sûr de vouloir effacer tout votre portefeuille ?')) {
        portfolio = [];
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
        displayPortfolio();
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
                        <div class="stock-price">${formatPrice(stockData.price)}</div>
                    </div>
                    
                    <div class="stock-change ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '↑' : '↓'} ${formatPrice(Math.abs(stockData.change))} (${stockData.changePercent})
                    </div>
                    
                    <div class="stock-details">
                        <div class="detail-item">
                            <div class="detail-label">Plus Haut</div>
                            <div class="detail-value">${formatPrice(stockData.high)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Plus Bas</div>
                            <div class="detail-value">${formatPrice(stockData.low)}</div>
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
    
    // Afficher un état de chargement
    newsContainer.innerHTML = `
        <div class="loading">✨ Chargement des actualités pour ${symbol}...</div>
    `;
    
    try {
        // Alpha Vantage a un endpoint pour les news
        const newsUrl = `${API_BASE}?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${API_KEY}&limit=6`;
        
        const response = await fetch(newsUrl);
        const data = await response.json();
        
        if (data.feed && data.feed.length > 0) {
            displayNews(symbol, data.feed);
        } else {
            // Si pas de résultats avec Alpha Vantage, utiliser des news génériques
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
        if (index < 6) { // Limiter à 6 articles
            const title = article.title || 'Article sans titre';
            const summary = article.summary || 'Aucun résumé disponible';
            const source = article.source || 'Source inconnue';
            const timePublished = article.time_published || '';
            const url = article.url || '#';
            
            // Analyser le sentiment si disponible
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
            
            // Formater la date
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
    
    // Validation
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
        
        // Calcul du pourcentage de changement
        const changePercent = parseFloat(stockData.changePercent.replace('%', ''));
        const isPositive = changePercent >= 0;
        
        const resultHTML = `
            <div class="result-card">
                <div class="result-header">
                    <div class="result-title">Votre investissement dans ${symbol}</div>
                    <div class="result-total">${formatPrice(totalCost)}</div>
                </div>
                
                <div class="result-details">
                    <div class="result-item">
                        <div class="result-label">Nombre d'actions</div>
                        <div class="result-value">${shares}</div>
                    </div>
                    
                    <div class="result-item">
                        <div class="result-label">Prix par action</div>
                        <div class="result-value">${formatPrice(stockData.price)}</div>
                    </div>
                    
                    <div class="result-item">
                        <div class="result-label">Coût total</div>
                        <div class="result-value">${formatPrice(totalCost)}</div>
                    </div>
                    
                    <div class="result-item">
                        <div class="result-label">Variation du jour</div>
                        <div class="result-value ${isPositive ? 'positive' : 'negative'}" style="color: ${isPositive ? '#a8c9a8' : '#d4a5a5'}">
                            ${isPositive ? '+' : ''}${formatPrice(stockData.change * shares)}
                        </div>
                    </div>
                </div>
                
                <div class="investment-tip">
                    💡 <strong>Note zen :</strong> Avec ${shares} action${shares > 1 ? 's' : ''} de ${symbol}, 
                    votre investissement varie d'environ ${formatPrice(potentialDailyVariation)} par jour. 
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
