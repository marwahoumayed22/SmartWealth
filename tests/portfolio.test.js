// Tests de portfolio.js — npm test

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    normalizePositions,
    addPosition,
    removePosition,
    computePosition,
    computeSummary,
    parsePositionInput
} = require('../portfolio.js');

test('ajoute une nouvelle position', () => {
    const result = addPosition([], { symbol: 'AAPL', shares: 10, buyPrice: 100 });
    assert.deepEqual(result, [{ symbol: 'AAPL', shares: 10, buyPrice: 100 }]);
});

test('fusionne une action déjà présente avec un prix moyen pondéré', () => {
    let positions = addPosition([], { symbol: 'AAPL', shares: 10, buyPrice: 100 });
    positions = addPosition(positions, { symbol: 'AAPL', shares: 30, buyPrice: 200 });

    assert.equal(positions.length, 1);
    assert.equal(positions[0].shares, 40);
    assert.equal(positions[0].buyPrice, 175); // (10×100 + 30×200) / 40
});

test('ne modifie pas le tableau d\'origine', () => {
    const original = [{ symbol: 'AAPL', shares: 1, buyPrice: 100 }];
    addPosition(original, { symbol: 'AAPL', shares: 1, buyPrice: 200 });
    assert.equal(original[0].shares, 1);
});

test('retire une position', () => {
    const positions = [
        { symbol: 'AAPL', shares: 1, buyPrice: 100 },
        { symbol: 'MSFT', shares: 2, buyPrice: 300 }
    ];
    assert.deepEqual(removePosition(positions, 'AAPL').map(p => p.symbol), ['MSFT']);
});

test('calcule la valeur, le gain et le gain en %', () => {
    const row = computePosition({ symbol: 'AAPL', shares: 10, buyPrice: 100 }, 120, 2);

    assert.equal(row.value, 1200);
    assert.equal(row.cost, 1000);
    assert.equal(row.gain, 200);
    assert.equal(row.gainPercent, 20);
    assert.equal(row.dayChange, 20);
});

test('gère une perte', () => {
    const row = computePosition({ symbol: 'MSFT', shares: 4, buyPrice: 50 }, 40, -1);
    assert.equal(row.gain, -40);
    assert.equal(row.gainPercent, -20);
});

test('prix d\'achat inconnu : pas de gain calculé', () => {
    const row = computePosition({ symbol: 'IBM', shares: 2, buyPrice: null }, 100, 1);
    assert.equal(row.value, 200);
    assert.equal(row.gain, null);
    assert.equal(row.gainPercent, null);
});

test('résumé : totaux et poids qui font 100 %', () => {
    const summary = computeSummary([
        computePosition({ symbol: 'A', shares: 1, buyPrice: 100 }, 150, 1),
        computePosition({ symbol: 'B', shares: 1, buyPrice: 100 }, 50, -1)
    ]);

    assert.equal(summary.totalValue, 200);
    assert.equal(summary.totalCost, 200);
    assert.equal(summary.totalGain, 0);
    assert.equal(summary.dayChange, 0);
    assert.deepEqual(summary.rows.map(r => r.weight), [75, 25]);
});

test('résumé : les positions sans prix d\'achat sont exclues des gains', () => {
    const summary = computeSummary([
        computePosition({ symbol: 'A', shares: 1, buyPrice: 100 }, 110, 0),
        computePosition({ symbol: 'B', shares: 1, buyPrice: null }, 500, 0)
    ]);

    assert.equal(summary.totalValue, 610);
    assert.equal(summary.totalGain, 10);
    assert.equal(summary.totalGainPercent, 10);
    assert.equal(summary.missingCostCount, 1);
});

test('résumé d\'un portefeuille vide', () => {
    const summary = computeSummary([]);
    assert.equal(summary.totalValue, 0);
    assert.equal(summary.totalGainPercent, null);
});

test('convertit l\'ancien format (liste de symboles)', () => {
    assert.deepEqual(normalizePositions(['AAPL']), [{ symbol: 'AAPL', shares: 1, buyPrice: null }]);
});

test('ignore les données corrompues', () => {
    assert.deepEqual(normalizePositions(null), []);
    assert.deepEqual(normalizePositions([{ symbol: 'X', shares: -3, buyPrice: 10 }, 42]), []);
});

test('valide le formulaire', () => {
    assert.deepEqual(parsePositionInput(' aapl ', '12,5', '180,25').position,
        { symbol: 'AAPL', shares: 12.5, buyPrice: 180.25 });
    assert.equal(parsePositionInput('AAPL', '3', '').position.buyPrice, null);
    assert.ok(parsePositionInput('AA PL', '3', '').error);
    assert.ok(parsePositionInput('AAPL', '0', '').error);
    assert.ok(parsePositionInput('AAPL', 'abc', '').error);
    assert.ok(parsePositionInput('AAPL', '3', '-5').error);
});
