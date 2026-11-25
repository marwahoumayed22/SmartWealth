// Configuration de l'API (Alpha Vantage, 25 requêtes par jour)
const API_BASE = 'https://www.alphavantage.co/query';

// Durée du cache des prix
const CACHE_MINUTES = 10;

// Couleurs du graphique de répartition
const ALLOCATION_COLORS = ['#d4a5a5', '#c9a0dc', '#a8c9a8', '#e8c39e', '#a0b8dc', '#dca0c0', '#b8b0a0', '#9fd0cc'];

// État de l'application
let positions = normalizePositions(loadFromStorage('portfolio', []));
let comparisonList = [];
let quoteCache = loadFromStorage('quoteCache', {});
let allocationChart = null;

// Erreurs personnalisées
class ApiLimitError extends Error {}
class MissingKeyError extends Error {}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Clé API
    document.getElementById('apiKeyForm').addEventListener('submit', saveApiKey);
    document.getElementById('demoKeyBtn').addEventListener('click', useDemoKey);
    document.getElementById('apiKeyBtn').addEventListener('click', showApiKeySection);
    if (!getApiKey()) {
        showApiKeySection();
    }

    // Portefeuille
    document.getElementById('positionForm').addEventListener('submit', submitPosition);

    // Recherche
    document.getElementById('searchBtn').addEventListener('click', searchStock);
    document.getElementById('stockSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchStock();
        }
    });
    document.getElementById('clearPortfolioBtn').addEventListener('click', clearPortfolio);

    // Calculateur
    document.getElementById('calculateBtn').addEventListener('click', calculateInvestment);

    // Thème
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    loadTheme();

    // Boutons générés dynamiquement
    document.addEventListener('click', handleActionClick);

    // Charger le portefeuille existant
    displayPortfolio();
});

// Délégation d'événements (data-action / data-symbol)
function handleActionClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const symbol = button.dataset.symbol;
    const actions = {
        'add-portfolio': prefillPositionForm,
        'remove-portfolio': removeFromPortfolio,
        'add-comparison': addToComparison,
        'remove-comparison': removeFromComparison
    };

    if (actions[button.dataset.action]) {
        actions[button.dataset.action](symbol);
    }
}

// ===== CLÉ API =====

function getApiKey() {
    return loadFromStorage('apiKey', '');
}

function showApiKeySection() {
    const section = document.getElementById('apiKeySection');
    section.hidden = false;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('apiKeyInput').focus({ preventScroll: true });
}

function saveApiKey(event) {
    event.preventDefault();
    const key = document.getElementById('apiKeyInput').value.trim();
    if (!key) return;
    applyApiKey(key, 'Clé enregistrée ✨ Vous pouvez rechercher une action.');
}

function useDemoKey() {
    applyApiKey('demo', 'Clé « demo » activée : essayez le symbole IBM.');
    document.getElementById('stockSearch').value = 'IBM';
}

function applyApiKey(key, message) {
    saveToStorage('apiKey', key);
    // Nouvelle clé : vider le cache
    quoteCache = {};
    saveToStorage('quoteCache', quoteCache);
    document.getElementById('apiKeyInput').value = '';
    document.getElementById('apiKeySection').hidden = true;
    showMessage(message, 'success');
    displayPortfolio();
}

// ===== APPELS À L'API =====

// Appel générique à l'API
async function apiFetch(params) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new MissingKeyError('Aucune clé API');
    }

    const url = `${API_BASE}?${new URLSearchParams({ ...params, apikey: apiKey })}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
    }

    const data = await response.json();

    // Limite atteinte : l'API répond 200 avec "Information" ou "Note"
    if (data.Information || data.Note) {
        throw new ApiLimitError(data.Information || data.Note);
    }

    return data;
}

// Message d'erreur selon le type d'erreur
function errorMessage(error, defaultMessage) {
    if (error instanceof ApiLimitError && getApiKey() === 'demo') {
        return 'La clé « demo » ne fonctionne qu\'avec le symbole IBM. Entrez votre propre clé (bouton 🔑) pour les autres actions.';
    }
    if (error instanceof ApiLimitError) {
        return 'Limite de l\'API atteinte (25 requêtes par jour avec la clé gratuite). Réessayez plus tard.';
    }
    if (error instanceof MissingKeyError) {
        return 'Entrez d\'abord votre clé API (bouton 🔑 en haut).';
    }
    return defaultMessage;
}

// Récupérer les données d'une action (avec cache)
async function fetchStockData(symbol) {
    const cached = quoteCache[symbol];
    if (cached && Date.now() - cached.savedAt < CACHE_MINUTES * 60 * 1000) {
        return cached.data;
    }

    const data = await apiFetch({ function: 'GLOBAL_QUOTE', symbol: symbol });
    const quote = data['Global Quote'];

    if (!quote || Object.keys(quote).length === 0) {
        throw new Error('Action non trouvée');
    }

    const stock = {
        symbol: symbol,
        name: symbol,
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'],
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        volume: parseInt(quote['06. volume'], 10),
        previousClose: parseFloat(quote['08. previous close'])
    };

    quoteCache[symbol] = { data: stock, savedAt: Date.now() };
    saveToStorage('quoteCache', quoteCache);
    return stock;
}

// ===== RECHERCHE =====

// Fonction principale de recherche
async function searchStock() {
    const symbol = document.getElementById('stockSearch').value.trim().toUpperCase();

    if (!symbol) {
        showMessage('Veuillez entrer un symbole d\'action');
        return;
    }

    if (!isValidSymbol(symbol)) {
        showMessage('Symbole invalide : utilisez seulement des lettres, chiffres, points ou tirets (ex : AAPL, BRK.B)');
        return;
    }

    clearMessage();
    showLoading('searchResults');

    try {
        const stockData = await fetchStockData(symbol);
        displayStockCard(stockData, 'searchResults');

        // Charger les news et le graphique pour cette action
        fetchStockNews(symbol);
        fetchAndDisplayChart(symbol);
    } catch (error) {
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('chartContainer').style.display = 'none';
        showMessage(errorMessage(error, `Aucune action trouvée pour « ${escapeHtml(symbol)} ». Vérifiez le symbole et réessayez.`));
        console.error(error);
    }
}

// Afficher une carte d'action
function displayStockCard(stock, containerId) {
    const container = document.getElementById(containerId);
    const symbol = escapeHtml(stock.symbol);

    container.innerHTML = `
        <div class="stock-card">
            <div class="stock-header">
                <div>
                    <div class="stock-symbol">${symbol}</div>
                    <div class="stock-name">${escapeHtml(stock.name)}</div>
                </div>
                <div class="stock-price">${formatMoney(stock.price)}</div>
            </div>

            ${changeBadge(stock)}

            <div class="stock-details">
                ${detailItem('Plus Haut', formatMoney(stock.high))}
                ${detailItem('Plus Bas', formatMoney(stock.low))}
                ${detailItem('Volume', formatVolume(stock.volume))}
                ${detailItem('Clôture Précédente', formatMoney(stock.previousClose))}
            </div>

            <div class="action-buttons">
                <button class="add-btn" data-action="add-portfolio" data-symbol="${symbol}">
                    ➕ Ajouter au portefeuille
                </button>
                <button class="compare-btn" data-action="add-comparison" data-symbol="${symbol}">
                    🔍 Comparer
                </button>
            </div>
        </div>
    `;
}

// ===== PORTEFEUILLE =====

// Pré-remplir le formulaire depuis une carte d'action
function prefillPositionForm(symbol) {
    const cached = quoteCache[symbol];
    document.getElementById('posSymbol').value = symbol;
    document.getElementById('posPrice').value = cached ? cached.data.price.toFixed(2) : '';
    document.getElementById('portfolioSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('posShares').focus({ preventScroll: true });
    showPortfolioMessage(`Indiquez la quantité de ${symbol} achetée, puis cliquez sur Ajouter.`, 'success');
}

// Ajouter une position
async function submitPosition(event) {
    event.preventDefault();

    const { position, error } = parsePositionInput(
        document.getElementById('posSymbol').value,
        document.getElementById('posShares').value,
        document.getElementById('posPrice').value
    );

    if (error) {
        showPortfolioMessage(error);
        return;
    }

    const button = event.submitter || document.querySelector('.add-position-btn');
    button.disabled = true;

    try {
        // Vérifie que l'action existe ; prix actuel par défaut
        const stock = await fetchStockData(position.symbol);
        if (position.buyPrice === null) {
            position.buyPrice = stock.price;
        }

        const alreadyOwned = positions.some(p => p.symbol === position.symbol);
        positions = addPosition(positions, position);
        saveToStorage('portfolio', positions);

        document.getElementById('positionForm').reset();
        showPortfolioMessage(
            alreadyOwned
                ? `✅ ${position.symbol} : quantité ajoutée et prix moyen recalculé.`
                : `✅ ${position.symbol} ajouté au portefeuille !`,
            'success'
        );
        displayPortfolio();
    } catch (err) {
        showPortfolioMessage(errorMessage(err, `Aucune action trouvée pour « ${escapeHtml(position.symbol)} ».`));
        console.error(err);
    } finally {
        button.disabled = false;
    }
}

// Afficher le portefeuille
async function displayPortfolio() {
    const list = document.getElementById('portfolioList');
    const summaryBox = document.getElementById('portfolioSummary');

    if (positions.length === 0) {
        list.innerHTML = '<p class="empty-state">Votre espace est vide. Ajoutez vos premières actions ✨</p>';
        summaryBox.innerHTML = '';
        hideAllocationChart();
        return;
    }

    list.innerHTML = '<div class="loading">Chargement du portefeuille...</div>';

    const rows = [];
    const failed = [];

    for (const position of positions) {
        try {
            const stock = await fetchStockData(position.symbol);
            rows.push(computePosition(position, stock.price, stock.change));
        } catch (error) {
            failed.push({ symbol: position.symbol, message: errorMessage(error, 'Données indisponibles pour cette action.') });
            console.error(`Erreur pour ${position.symbol}:`, error);
        }
    }

    const summary = computeSummary(rows);

    summaryBox.innerHTML = rows.length > 0 ? renderSummary(summary) : '';
    list.innerHTML =
        summary.rows.map(renderPositionCard).join('') +
        failed.map(renderFailedPosition).join('');

    if (summary.rows.length > 0) {
        displayAllocationChart(summary.rows);
    } else {
        hideAllocationChart();
    }
}

function renderSummary(summary) {
    const gainText = summary.totalGainPercent === null
        ? '—'
        : `${formatSignedMoney(summary.totalGain)} <small>(${formatSignedPercent(summary.totalGainPercent)})</small>`;

    const note = summary.missingCostCount > 0
        ? `<p class="summary-note">${summary.missingCostCount} position(s) sans prix d'achat ne sont pas comptées dans le gain.</p>`
        : '';

    return `
        <div class="portfolio-summary">
            ${summaryItem('Valeur totale', formatMoney(summary.totalValue))}
            ${summaryItem('Montant investi', formatMoney(summary.totalCost))}
            ${summaryItem('Gain / perte', gainText, gainClass(summary.totalGain))}
            ${summaryItem('Variation du jour', formatSignedMoney(summary.dayChange), gainClass(summary.dayChange))}
        </div>
        ${note}
    `;
}

function summaryItem(label, value, cssClass = '') {
    return `
        <div class="summary-item">
            <div class="summary-label">${label}</div>
            <div class="summary-value ${cssClass}">${value}</div>
        </div>
    `;
}

function renderPositionCard(row) {
    const symbol = escapeHtml(row.symbol);
    const gain = row.gain === null
        ? '—'
        : `${formatSignedMoney(row.gain)}<br><small>${formatSignedPercent(row.gainPercent)}</small>`;

    return `
        <div class="stock-card position-card">
            <div class="stock-header">
                <div>
                    <div class="stock-symbol">${symbol}</div>
                    <div class="stock-name">${formatNumber(row.shares)} action${row.shares > 1 ? 's' : ''} · ${formatPercent(row.weight)} du portefeuille</div>
                </div>
                <div class="stock-price">${formatMoney(row.value)}</div>
            </div>

            <div class="stock-details">
                ${detailItem('Prix d\'achat moyen', row.buyPrice === null ? '—' : formatMoney(row.buyPrice))}
                ${detailItem('Prix actuel', formatMoney(row.price))}
                <div class="detail-item">
                    <div class="detail-label">Gain / perte</div>
                    <div class="detail-value ${gainClass(row.gain)}">${gain}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Variation du jour</div>
                    <div class="detail-value ${gainClass(row.dayChange)}">${formatSignedMoney(row.dayChange)}</div>
                </div>
            </div>

            <div class="action-buttons">
                <button class="remove-btn" data-action="remove-portfolio" data-symbol="${symbol}">❌ Retirer</button>
                <button class="compare-btn" data-action="add-comparison" data-symbol="${symbol}">🔍 Comparer</button>
            </div>
        </div>
    `;
}

// Position dont le prix n'a pas pu être chargé
function renderFailedPosition(item) {
    const symbol = escapeHtml(item.symbol);
    return `
        <div class="stock-card position-card">
            <div class="stock-header">
                <div class="stock-symbol">${symbol}</div>
            </div>
            <div class="error-message">${item.message}</div>
            <div class="action-buttons">
                <button class="remove-btn" data-action="remove-portfolio" data-symbol="${symbol}">❌ Retirer</button>
            </div>
        </div>
    `;
}

// Graphique de répartition
function displayAllocationChart(rows) {
    const container = document.getElementById('allocationContainer');
    container.hidden = false;

    const ctx = document.getElementById('allocationChart').getContext('2d');
    if (allocationChart) {
        allocationChart.destroy();
    }

    allocationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: rows.map(r => r.symbol),
            datasets: [{
                data: rows.map(r => r.value),
                backgroundColor: rows.map((_, i) => ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]),
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#8b7d8b', usePointStyle: true, padding: 15 }
                },
                tooltip: {
                    callbacks: {
                        label: context => {
                            const row = rows[context.dataIndex];
                            return ` ${row.symbol} : ${formatMoney(row.value)} (${formatPercent(row.weight)})`;
                        }
                    }
                }
            }
        }
    });
}

function hideAllocationChart() {
    if (allocationChart) {
        allocationChart.destroy();
        allocationChart = null;
    }
    document.getElementById('allocationContainer').hidden = true;
}

// Retirer du portefeuille
function removeFromPortfolio(symbol) {
    positions = removePosition(positions, symbol);
    saveToStorage('portfolio', positions);
    displayPortfolio();
}

// Effacer tout le portefeuille
function clearPortfolio() {
    if (positions.length === 0) return;

    if (confirm('Êtes-vous sûr de vouloir effacer tout votre portefeuille ?')) {
        positions = [];
        saveToStorage('portfolio', positions);
        displayPortfolio();
    }
}

function showPortfolioMessage(message, type = 'error') {
    showMessage(message, type, 'portfolioMessage');
}

// ===== COMPARAISON =====

// Ajouter à la comparaison
function addToComparison(symbol) {
    if (comparisonList.includes(symbol)) {
        showMessage(`${symbol} est déjà dans la comparaison`);
        return;
    }

    if (comparisonList.length >= 3) {
        showMessage('Vous pouvez comparer maximum 3 actions à la fois');
        return;
    }

    comparisonList.push(symbol);
    displayComparison();
    showMessage(`${symbol} ajouté à la comparaison`, 'success');
}

// Afficher la comparaison
async function displayComparison() {
    const container = document.getElementById('comparisonArea');

    if (comparisonList.length === 0) {
        container.innerHTML = '<p class="empty-state">Sélectionnez des actions pour les comparer en douceur</p>';
        return;
    }

    container.innerHTML = '<div class="loading">Chargement de la comparaison...</div>';

    let comparisonHTML = '<div class="comparison-grid">';

    for (const symbol of comparisonList) {
        const safeSymbol = escapeHtml(symbol);
        try {
            const stockData = await fetchStockData(symbol);

            comparisonHTML += `
                <div class="stock-card">
                    <div class="stock-header">
                        <div class="stock-symbol">${safeSymbol}</div>
                        <div class="stock-price">${formatMoney(stockData.price)}</div>
                    </div>

                    ${changeBadge(stockData)}

                    <div class="stock-details">
                        ${detailItem('Plus Haut', formatMoney(stockData.high))}
                        ${detailItem('Plus Bas', formatMoney(stockData.low))}
                        ${detailItem('Volume', formatVolume(stockData.volume))}
                    </div>

                    <div class="action-buttons">
                        <button class="remove-btn" data-action="remove-comparison" data-symbol="${safeSymbol}">
                            ❌ Retirer de la comparaison
                        </button>
                    </div>
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

// ===== ACTUALITÉS =====

// Récupérer les actualités financières
async function fetchStockNews(symbol) {
    const newsContainer = document.querySelector('.news-container');
    const safeSymbol = escapeHtml(symbol);

    newsContainer.innerHTML = `<div class="loading">✨ Chargement des actualités pour ${safeSymbol}...</div>`;

    try {
        const data = await apiFetch({ function: 'NEWS_SENTIMENT', tickers: symbol, limit: 6 });

        if (data.feed && data.feed.length > 0) {
            displayNews(symbol, data.feed);
        } else {
            newsContainer.innerHTML = `<p class="no-news">Aucune actualité récente trouvée pour ${safeSymbol}.</p>`;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des news:', error);
        newsContainer.innerHTML = `<p class="no-news">${errorMessage(error, 'Actualités indisponibles pour le moment.')}</p>`;
    }
}

// Afficher les actualités
function displayNews(symbol, newsItems) {
    const newsContainer = document.querySelector('.news-container');
    const articles = newsItems.slice(0, 6); // Limiter à 6 articles

    let newsHTML = `
        <div class="news-header">
            <div class="news-stock-symbol">📰 Actualités pour ${escapeHtml(symbol)}</div>
            <div class="news-count">${articles.length} article${articles.length > 1 ? 's' : ''}</div>
        </div>
    `;

    articles.forEach(article => {
        const title = escapeHtml(article.title || 'Article sans titre');
        const fullSummary = article.summary || 'Aucun résumé disponible';
        const summary = escapeHtml(fullSummary.substring(0, 200)) + (fullSummary.length > 200 ? '...' : '');
        const source = escapeHtml(article.source || 'Source inconnue');
        const url = safeUrl(article.url);

        // Analyser le sentiment si disponible
        let sentimentClass = 'sentiment-neutral';
        let sentimentText = 'Neutre 📊';

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

        const timeAgo = article.time_published ? getTimeAgo(parseNewsDate(article.time_published)) : 'Récent';

        newsHTML += `
            <article class="news-article">
                <div class="news-title">${title}</div>
                <div class="news-summary">${summary}</div>
                <div class="news-meta">
                    <span class="news-source">📡 ${source}</span>
                    <span class="news-sentiment ${sentimentClass}">${sentimentText}</span>
                    <span class="news-time">${timeAgo}</span>
                </div>
                ${url ? `<a class="news-link" href="${url}" target="_blank" rel="noopener noreferrer">Lire l'article →</a>` : ''}
            </article>
        `;
    });

    newsContainer.innerHTML = newsHTML;
}

// Format de l'API : "20261125T140000"
function parseNewsDate(value) {
    return new Date(
        parseInt(value.substring(0, 4), 10),
        parseInt(value.substring(4, 6), 10) - 1,
        parseInt(value.substring(6, 8), 10),
        parseInt(value.substring(9, 11), 10),
        parseInt(value.substring(11, 13), 10)
    );
}

// Calculer le temps écoulé
function getTimeAgo(date) {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
        return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
        return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
        return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
    return date.toLocaleDateString('fr-CA');
}

// ===== CALCULATEUR =====

// Calculateur d'investissement
async function calculateInvestment() {
    const symbol = document.getElementById('calcSymbol').value.trim().toUpperCase();
    const shares = parseInt(document.getElementById('calcShares').value, 10);
    const resultsContainer = document.getElementById('calculatorResults');

    // Validation
    if (!symbol || !isValidSymbol(symbol)) {
        resultsContainer.innerHTML = '<div class="error-message">💭 Veuillez entrer un symbole d\'action valide</div>';
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
        const dailyVariation = stockData.change * shares;
        const isPositive = dailyVariation >= 0;

        resultsContainer.innerHTML = `
            <div class="result-card">
                <div class="result-header">
                    <div class="result-title">Votre investissement dans ${escapeHtml(symbol)}</div>
                    <div class="result-total">${formatMoney(totalCost)}</div>
                </div>

                <div class="result-details">
                    ${resultItem('Nombre d\'actions', shares)}
                    ${resultItem('Prix par action', formatMoney(stockData.price))}
                    ${resultItem('Coût total', formatMoney(totalCost))}
                    <div class="result-item">
                        <div class="result-label">Variation du jour</div>
                        <div class="result-value ${isPositive ? 'text-positive' : 'text-negative'}">
                            ${formatSignedMoney(dailyVariation)}
                        </div>
                    </div>
                </div>

                <div class="investment-tip">
                    💡 <strong>Note zen :</strong> Avec ${shares} action${shares > 1 ? 's' : ''} de ${escapeHtml(symbol)},
                    votre investissement a varié de ${formatSignedMoney(dailyVariation)} aujourd'hui.
                    ${isPositive ? '✨ Belle journée pour vos actions !' : '🌸 Restez sereine, les marchés fluctuent naturellement.'}
                </div>
            </div>
        `;
    } catch (error) {
        resultsContainer.innerHTML = `<div class="error-message">💭 ${errorMessage(error, 'Impossible de calculer. Vérifiez le symbole et réessayez.')}</div>`;
        console.error(error);
    }
}

// ===== GRAPHIQUE =====
let stockChart = null;

async function fetchAndDisplayChart(symbol) {
    const chartContainer = document.getElementById('chartContainer');
    const chartMessage = document.getElementById('chartMessage');
    const canvas = document.getElementById('stockChart');

    chartContainer.style.display = 'block';
    chartMessage.textContent = 'Chargement de l\'historique...';

    try {
        // Récupérer les données historiques (TIME_SERIES_DAILY)
        const data = await apiFetch({ function: 'TIME_SERIES_DAILY', symbol: symbol });
        const timeSeries = data['Time Series (Daily)'];

        if (!timeSeries) {
            throw new Error('Pas de données historiques');
        }

        // Extraire les 30 derniers jours
        const dates = Object.keys(timeSeries).slice(0, 30).reverse();
        const prices = dates.map(date => parseFloat(timeSeries[date]['4. close']));

        canvas.style.display = 'block';
        chartMessage.textContent = '';
        createChart(symbol, dates, prices);
    } catch (error) {
        console.error('Erreur graphique:', error);
        if (stockChart) {
            stockChart.destroy();
            stockChart = null;
        }
        canvas.style.display = 'none';
        chartMessage.textContent = errorMessage(error, 'Historique des prix indisponible pour le moment.');
    }
}

function createChart(symbol, dates, prices) {
    const ctx = document.getElementById('stockChart').getContext('2d');

    // Détruire l'ancien graphique s'il existe
    if (stockChart) {
        stockChart.destroy();
    }

    // Déterminer la couleur selon la tendance
    const isPositive = prices[prices.length - 1] > prices[0];
    const lineColor = isPositive ? '#a8c9a8' : '#e8c1c1';
    const gradientColor = isPositive ? 'rgba(168, 201, 168, 0.2)' : 'rgba(232, 193, 193, 0.2)';

    // Créer le dégradé
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, gradientColor);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    // Formater les dates (sans new Date() pour éviter le décalage UTC)
    const formattedDates = dates.map(date => {
        const [, month, day] = date.split('-').map(Number);
        return `${day}/${month}`;
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
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: lineColor,
                    borderWidth: 2,
                    displayColors: false,
                    callbacks: {
                        label: context => formatMoney(context.parsed.y)
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#8b7d8b', maxRotation: 0, autoSkipPadding: 20 }
                },
                y: {
                    grid: { color: 'rgba(212, 165, 165, 0.1)' },
                    ticks: {
                        color: '#8b7d8b',
                        callback: value => formatMoney(value, 0)
                    }
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

// ===== THÈME =====
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Animation du bouton
    const toggleBtn = document.getElementById('themeToggle');
    toggleBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        toggleBtn.style.transform = 'rotate(0deg)';
    }, 400);
}

function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

// ===== FONCTIONS UTILITAIRES =====

// Protection XSS
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Accepte seulement les liens http(s)
function safeUrl(url) {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol) ? escapeHtml(parsed.href) : '';
    } catch {
        return '';
    }
}

// Ex : AAPL, BRK.B, SHOP.TO
function isValidSymbol(symbol) {
    return /^[A-Z0-9.\-]{1,12}$/.test(symbol);
}

// 230,10 $ US
function formatMoney(value, decimals = 2) {
    return new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

// +23,50 $ US / −32,00 $ US
function formatSignedMoney(value) {
    return (value >= 0 ? '+' : '−') + formatMoney(Math.abs(value));
}

// 12,5 % · +3,2 % · −1,4 %
function formatPercent(value) {
    return new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 1 }).format(value) + ' %';
}

function formatSignedPercent(value) {
    return (value >= 0 ? '+' : '−') + formatPercent(Math.abs(value));
}

function formatNumber(value) {
    return new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 4 }).format(value);
}

// Couleur selon le signe
function gainClass(value) {
    if (value === null || value === undefined) return '';
    return value >= 0 ? 'text-positive' : 'text-negative';
}

function formatVolume(volume) {
    if (volume >= 1000000) {
        return (volume / 1000000).toFixed(2) + 'M';
    } else if (volume >= 1000) {
        return (volume / 1000).toFixed(2) + 'K';
    }
    return String(volume);
}

// Gabarits HTML
function changeBadge(stock) {
    const isPositive = stock.change >= 0;
    return `
        <div class="stock-change ${isPositive ? 'positive' : 'negative'}">
            ${isPositive ? '↑' : '↓'} ${Math.abs(stock.change).toFixed(2)} (${escapeHtml(stock.changePercent)})
        </div>
    `;
}

function detailItem(label, value) {
    return `
        <div class="detail-item">
            <div class="detail-label">${label}</div>
            <div class="detail-value">${value}</div>
        </div>
    `;
}

function resultItem(label, value) {
    return `
        <div class="result-item">
            <div class="result-label">${label}</div>
            <div class="result-value">${value}</div>
        </div>
    `;
}

function showLoading(containerId) {
    document.getElementById(containerId).innerHTML = '<div class="loading">Chargement...</div>';
}

// Messages temporaires
const messageTimers = {};
function showMessage(message, type = 'error', boxId = 'searchMessage') {
    const box = document.getElementById(boxId);
    const cssClass = type === 'success' ? 'success-message' : 'error-message';
    const icon = type === 'success' ? '' : '❌ ';

    box.innerHTML = `<div class="${cssClass}">${icon}${message}</div>`;

    clearTimeout(messageTimers[boxId]);
    messageTimers[boxId] = setTimeout(() => clearMessage(boxId), 5000);
}

function clearMessage(boxId = 'searchMessage') {
    document.getElementById(boxId).innerHTML = '';
}

// localStorage
function loadFromStorage(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Impossible de sauvegarder :', error);
    }
}
