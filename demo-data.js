// Données d'exemple pour le mode démo (prix non réels)
// Les réponses imitent le format de l'API Alpha Vantage.

const DEMO_QUOTES = {
    AAPL: { price: 230.10, change: 2.35, high: 231.40, low: 226.90, volume: 52345678 },
    MSFT: { price: 415.50, change: -3.20, high: 419.80, low: 413.10, volume: 21456789 },
    GOOGL: { price: 170.00, change: 1.10, high: 171.25, low: 168.40, volume: 25678901 },
    AMZN: { price: 205.30, change: -1.45, high: 208.00, low: 204.10, volume: 38765432 },
    NVDA: { price: 140.25, change: 3.80, high: 141.90, low: 136.20, volume: 245678901 },
    TSLA: { price: 250.80, change: -6.10, high: 258.40, low: 249.20, volume: 98765432 },
    SHOP: { price: 105.40, change: 0.85, high: 106.30, low: 103.90, volume: 8765432 }
};

const DEMO_SYMBOLS = Object.keys(DEMO_QUOTES);

function demoResponse(params) {
    const symbol = params.symbol || params.tickers;
    const quote = DEMO_QUOTES[symbol];

    if (params.function === 'GLOBAL_QUOTE') {
        return { 'Global Quote': quote ? demoGlobalQuote(quote) : {} };
    }
    if (params.function === 'TIME_SERIES_DAILY') {
        return quote ? { 'Time Series (Daily)': demoTimeSeries(symbol, quote.price) } : {};
    }
    return { feed: [] };
}

function demoGlobalQuote(quote) {
    const previousClose = quote.price - quote.change;
    return {
        '03. high': String(quote.high),
        '04. low': String(quote.low),
        '05. price': String(quote.price),
        '06. volume': String(quote.volume),
        '08. previous close': previousClose.toFixed(2),
        '09. change': String(quote.change),
        '10. change percent': `${(quote.change / previousClose * 100).toFixed(4)}%`
    };
}

// Historique de 60 jours ouvrables qui se termine au prix actuel.
// Le générateur est basé sur le symbole : la courbe est toujours la même pour une action.
function demoTimeSeries(symbol, currentPrice) {
    let seed = [...symbol].reduce((total, char) => total + char.charCodeAt(0), 0);
    const random = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };

    const series = {};
    const date = new Date();
    let price = currentPrice;
    let days = 0;

    while (days < 60) {
        const weekDay = date.getDay();
        if (weekDay !== 0 && weekDay !== 6) {
            series[toIsoDate(date)] = { '4. close': price.toFixed(2) };
            price = price * (1 + (random() - 0.5) * 0.04);
            days++;
        }
        date.setDate(date.getDate() - 1);
    }

    return series;
}

function toIsoDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}
