// Logique du portefeuille (fonctions pures)
// Position : { symbol, shares, buyPrice } — buyPrice en $ US, null si inconnu

// Nettoie les données sauvegardées (accepte aussi l'ancien format ['AAPL', ...])
function normalizePositions(raw) {
    if (!Array.isArray(raw)) return [];

    return raw
        .map(item => {
            if (typeof item === 'string') {
                return { symbol: item, shares: 1, buyPrice: null };
            }
            return item;
        })
        .filter(item =>
            item &&
            typeof item.symbol === 'string' &&
            isPositiveNumber(item.shares) &&
            (item.buyPrice === null || isPositiveNumber(item.buyPrice))
        );
}

// Ajoute une position ; si l'action existe déjà, calcule le prix moyen pondéré
function addPosition(positions, newPosition) {
    const existing = positions.find(p => p.symbol === newPosition.symbol);

    if (!existing) {
        return [...positions, { ...newPosition }];
    }

    const totalShares = existing.shares + newPosition.shares;
    let buyPrice;

    if (existing.buyPrice === null) {
        buyPrice = newPosition.buyPrice;
    } else if (newPosition.buyPrice === null) {
        buyPrice = existing.buyPrice;
    } else {
        buyPrice = (existing.shares * existing.buyPrice + newPosition.shares * newPosition.buyPrice) / totalShares;
    }

    return positions.map(p =>
        p.symbol === newPosition.symbol ? { symbol: p.symbol, shares: totalShares, buyPrice } : p
    );
}

function removePosition(positions, symbol) {
    return positions.filter(p => p.symbol !== symbol);
}

// Valeur, gain et variation d'une position
function computePosition(position, price, dailyChange) {
    const value = position.shares * price;
    const hasCost = position.buyPrice !== null;
    const cost = hasCost ? position.shares * position.buyPrice : null;
    const gain = hasCost ? value - cost : null;

    return {
        ...position,
        price,
        value,
        cost,
        gain,
        gainPercent: hasCost && cost > 0 ? (gain / cost) * 100 : null,
        dayChange: position.shares * dailyChange
    };
}

// Totaux et poids de chaque position (gains : positions avec prix d'achat seulement)
function computeSummary(rows) {
    const totalValue = sum(rows.map(r => r.value));
    const rowsWithCost = rows.filter(r => r.cost !== null);
    const totalCost = sum(rowsWithCost.map(r => r.cost));
    const totalGain = sum(rowsWithCost.map(r => r.gain));

    return {
        totalValue,
        totalCost,
        totalGain,
        totalGainPercent: totalCost > 0 ? (totalGain / totalCost) * 100 : null,
        dayChange: sum(rows.map(r => r.dayChange)),
        missingCostCount: rows.length - rowsWithCost.length,
        rows: rows.map(r => ({
            ...r,
            weight: totalValue > 0 ? (r.value / totalValue) * 100 : 0
        }))
    };
}

// Validation du formulaire : renvoie { position } ou { error }
function parsePositionInput(symbol, sharesText, buyPriceText) {
    const cleanSymbol = String(symbol).trim().toUpperCase();
    // Accepte la virgule décimale
    const shares = Number(String(sharesText).trim().replace(',', '.'));
    const priceText = String(buyPriceText).trim().replace(',', '.');
    const buyPrice = priceText === '' ? null : Number(priceText);

    if (!/^[A-Z0-9.\-]{1,12}$/.test(cleanSymbol)) {
        return { error: 'Symbole invalide (ex : AAPL, BRK.B)' };
    }
    if (!isPositiveNumber(shares)) {
        return { error: 'La quantité doit être un nombre plus grand que 0' };
    }
    if (buyPrice !== null && !isPositiveNumber(buyPrice)) {
        return { error: 'Le prix d\'achat doit être un nombre plus grand que 0' };
    }

    return { position: { symbol: cleanSymbol, shares, buyPrice } };
}

function isPositiveNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function sum(numbers) {
    return numbers.reduce((total, n) => total + n, 0);
}

// Export pour les tests Node.js
if (typeof module !== 'undefined') {
    module.exports = {
        normalizePositions,
        addPosition,
        removePosition,
        computePosition,
        computeSummary,
        parsePositionInput
    };
}
