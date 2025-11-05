// Configuration de l'API
const API_KEY = 'NA2DSFA47SYVII1X';
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

// Variable pour le graphique de comparaison
let comparisonChart = null;

// Variables pour le Battle Royale
let battleMode = false;
let battleCanvas, battleCtx;
let fighters = [];
let battleInterval = null;
let battleAnimationId = null;

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
    
    // Time Machine Toggle
    document.getElementById('timeMachineToggle').addEventListener('click', toggleTimeMachine);
    
    // Time Machine
    document.getElementById('timeTravelBtn').addEventListener('click', timeTravel);
    
    // Preset buttons pour Time Machine
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('tmSymbol').value = this.dataset.symbol;
            document.getElementById('tmAmount').value = this.dataset.amount;
            document.getElementById('tmYears').value = this.dataset.years;
            timeTravel();
        });
    });
    
    // Battle Royale Toggle
    document.getElementById('battleToggle').addEventListener('click', toggleBattleSection);
    
    // Battle Royale Controls
    document.getElementById('startBattleBtn').addEventListener('click', startBattle);
    document.getElementById('stopBattleBtn').addEventListener('click', stopBattle);
    
    // Init Battle Canvas
    initBattleCanvas();
    
    // Charger le portefeuille existant
    displayPortfolio();
});

// ===== BATTLE ROYALE =====

function initBattleCanvas() {
    battleCanvas = document.getElementById('battleCanvas');
    battleCtx = battleCanvas.getContext('2d');
    
    resizeBattleCanvas();
    window.addEventListener('resize', resizeBattleCanvas);
}

function resizeBattleCanvas() {
    battleCanvas.width = window.innerWidth;
    battleCanvas.height = window.innerHeight;
}

function toggleBattleSection() {
    const section = document.getElementById('battleSection');
    const button = document.getElementById('battleToggle');
    
    if (section.style.display === 'none' || section.style.display === '') {
        section.style.display = 'block';
        button.classList.add('active');
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        section.style.display = 'none';
        button.classList.remove('active');
        stopBattle();
    }
}

async function startBattle() {
    if (portfolio.length < 2) {
        alert('⚔️ Ajoutez au moins 2 actions à votre portefeuille pour lancer le combat !');
        return;
    }
    
    // Activer le mode battle
    battleMode = true;
    document.body.classList.add('battle-mode');
    
    // Cacher le bouton start, montrer le bouton stop
    document.getElementById('startBattleBtn').style.display = 'none';
    document.getElementById('stopBattleBtn').style.display = 'block';
    
    // Initialiser les fighters
    await initializeFighters();
    
    // Afficher l'arène
    displayBattleArena();
    
    // Démarrer l'animation canvas
    animateBattle();
    
    // Démarrer le combat automatique
    battleInterval = setInterval(performBattleRound, 2000);
    
    console.log('⚔️ BATTLE ROYALE COMMENCÉE !');
}

function stopBattle() {
    battleMode = false;
    document.body.classList.remove('battle-mode');
    
    // Montrer le bouton start, cacher le bouton stop
    document.getElementById('startBattleBtn').style.display = 'block';
    document.getElementById('stopBattleBtn').style.display = 'none';
    
    // Arrêter les animations
    if (battleInterval) {
        clearInterval(battleInterval);
        battleInterval = null;
    }
    
    if (battleAnimationId) {
        cancelAnimationFrame(battleAnimationId);
        battleAnimationId = null;
    }
    
    // Nettoyer le canvas
    battleCtx.clearRect(0, 0, battleCanvas.width, battleCanvas.height);
    
    console.log('⚔️ Battle arrêtée');
}

async function initializeFighters() {
    fighters = [];
    
    for (const symbol of portfolio) {
        try {
            const stockData = await fetchStockData(symbol);
            
            // Calculer la santé basée sur la performance
            const changePercent = parseFloat(stockData.changePercent.replace('%', ''));
            const baseHealth = 100;
            const healthBonus = Math.max(-30, Math.min(30, changePercent * 2));
            const health = baseHealth + healthBonus;
            
            fighters.push({
                symbol: symbol,
                health: Math.max(20, Math.min(130, health)),
                maxHealth: Math.max(20, Math.min(130, health)),
                attack: 10 + Math.random() * 10,
                defense: 5 + Math.random() * 5,
                price: stockData.price,
                change: stockData.change,
                changePercent: changePercent,
                wins: 0,
                isAlive: true,
                x: Math.random() * (battleCanvas.width - 100) + 50,
                y: Math.random() * (battleCanvas.height - 100) + 50,
                targetX: 0,
                targetY: 0,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`
            });
        } catch (error) {
            console.error(`Erreur pour ${symbol}:`, error);
            
            // Créer un fighter avec des données de démo
            fighters.push({
                symbol: symbol,
                health: 100,
                maxHealth: 100,
                attack: 10 + Math.random() * 10,
                defense: 5 + Math.random() * 5,
                price: 150 + Math.random() * 100,
                change: (Math.random() - 0.5) * 5,
                changePercent: ((Math.random() - 0.5) * 10).toFixed(2),
                wins: 0,
                isAlive: true,
                x: Math.random() * (battleCanvas.width - 100) + 50,
                y: Math.random() * (battleCanvas.height - 100) + 50,
                targetX: 0,
                targetY: 0,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`
            });
        }
    }
}

function displayBattleArena() {
    const arena = document.getElementById('battleArena');
    const leaderboard = document.getElementById('battleLeaderboard');
    
    leaderboard.style.display = 'block';
    
    let arenaHTML = '<div class="battle-grid">';
    
    fighters.forEach(fighter => {
        const healthPercent = (fighter.health / fighter.maxHealth) * 100;
        const isLowHealth = healthPercent < 30;
        const knockedOut = !fighter.isAlive;
        
        arenaHTML += `
            <div class="fighter-card ${knockedOut ? 'knocked-out' : ''}" id="fighter-${fighter.symbol}">
                <div class="fighter-header">
                    <div class="fighter-symbol">${fighter.symbol}</div>
                    <div class="fighter-rank">#${fighters.indexOf(fighter) + 1}</div>
                </div>
                
                <div class="fighter-status">
                    ${knockedOut ? '💀' : fighter.health > 70 ? '💪' : fighter.health > 40 ? '😤' : '🤕'}
                </div>
                
                <div class="health-bar-container">
                    <div class="health-text">${Math.round(fighter.health)}/${fighter.maxHealth}</div>
                    <div class="health-bar ${isLowHealth ? 'low-health' : ''}" 
                         style="width: ${healthPercent}%">
                    </div>
                </div>
                
                <div class="fighter-stats">
                    <div class="stat-item">
                        <div class="stat-label">⚔️ Attaque</div>
                        <div class="stat-value">${fighter.attack.toFixed(1)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">🛡️ Défense</div>
                        <div class="stat-value">${fighter.defense.toFixed(1)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">🏆 Victoires</div>
                        <div class="stat-value">${fighter.wins}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">📊 Performance</div>
                        <div class="stat-value" style="color: ${fighter.changePercent >= 0 ? '#32cd32' : '#dc143c'}">
                            ${fighter.changePercent >= 0 ? '+' : ''}${fighter.changePercent}%
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    arenaHTML += '</div>';
    arena.innerHTML = arenaHTML;
    
    updateLeaderboard();
}

function updateLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    
    // Trier les fighters par santé (vivants d'abord)
    const sortedFighters = [...fighters].sort((a, b) => {
        if (a.isAlive && !b.isAlive) return -1;
        if (!a.isAlive && b.isAlive) return 1;
        return b.health - a.health;
    });
    
    let leaderboardHTML = '';
    
    sortedFighters.forEach((fighter, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        
        leaderboardHTML += `
            <div class="leaderboard-item ${index === 0 && fighter.isAlive ? 'victory-animation' : ''}">
                <div class="leaderboard-rank">${medal || (index + 1)}</div>
                <div class="leaderboard-symbol">${fighter.symbol}</div>
                <div class="leaderboard-health" style="color: ${fighter.isAlive ? '#32cd32' : '#dc143c'}">
                    ${fighter.isAlive ? Math.round(fighter.health) + ' HP' : 'K.O.'}
                </div>
            </div>
        `;
    });
    
    leaderboardList.innerHTML = leaderboardHTML;
}

function performBattleRound() {
    // Trouver les fighters vivants
    const aliveFighters = fighters.filter(f => f.isAlive);
    
    if (aliveFighters.length <= 1) {
        // Battle terminée !
        endBattle();
        return;
    }
    
    // Sélectionner 2 fighters aléatoires pour combattre
    const fighter1 = aliveFighters[Math.floor(Math.random() * aliveFighters.length)];
    let fighter2 = aliveFighters[Math.floor(Math.random() * aliveFighters.length)];
    
    // S'assurer qu'ils sont différents
    while (fighter2 === fighter1 && aliveFighters.length > 1) {
        fighter2 = aliveFighters[Math.floor(Math.random() * aliveFighters.length)];
    }
    
    // Combat !
    executeCombat(fighter1, fighter2);
    
    // Mettre à jour l'affichage
    displayBattleArena();
}

function executeCombat(attacker, defender) {
    // Animer l'attaquant
    const attackerCard = document.getElementById(`fighter-${attacker.symbol}`);
    if (attackerCard) {
        attackerCard.classList.add('attacking');
        setTimeout(() => attackerCard.classList.remove('attacking'), 500);
    }
    
    // Animer le défenseur
    const defenderCard = document.getElementById(`fighter-${defender.symbol}`);
    if (defenderCard) {
        defenderCard.classList.add('defending');
        setTimeout(() => defenderCard.classList.remove('defending'), 500);
    }
    
    // Calculer les dégâts
    const baseDamage = attacker.attack;
    const criticalHit = Math.random() < 0.2; // 20% de chance de coup critique
    const damage = Math.max(1, baseDamage * (criticalHit ? 2 : 1) - defender.defense * 0.5);
    
    // Appliquer les dégâts
    defender.health -= damage;
    
    // Créer des particules sur le canvas
    createBattleParticles(defender.x, defender.y, criticalHit ? '#ffd700' : '#ff4500');
    
    // Message de combat
    const arena = document.getElementById('battleArena');
    const message = document.createElement('div');
    message.className = 'battle-message';
    message.textContent = `⚔️ ${attacker.symbol} attaque ${defender.symbol} pour ${damage.toFixed(1)} dégâts${criticalHit ? ' CRITIQUE !' : ' !'}`;
    arena.insertBefore(message, arena.firstChild);
    
    setTimeout(() => message.remove(), 2000);
    
    // Vérifier si le défenseur est K.O.
    if (defender.health <= 0) {
        defender.health = 0;
        defender.isAlive = false;
        attacker.wins++;
        
        if (defenderCard) {
            defenderCard.classList.add('knocked-out');
        }
        
        // Message K.O.
        const koMessage = document.createElement('div');
        koMessage.className = 'battle-message';
        koMessage.style.background = 'rgba(220, 20, 60, 0.4)';
        koMessage.textContent = `💀 ${defender.symbol} est K.O. ! ${attacker.symbol} gagne !`;
        arena.insertBefore(koMessage, arena.firstChild);
        
        setTimeout(() => koMessage.remove(), 3000);
    }
    
    updateLeaderboard();
}

function createBattleParticles(x, y, color) {
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 50 + Math.random() * 50;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        const particle = document.createElement('div');
        particle.className = 'battle-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 2000);
    }
}

function animateBattle() {
    if (!battleMode) return;
    
    // Fond sombre avec effet
    battleCtx.fillStyle = 'rgba(26, 15, 15, 0.1)';
    battleCtx.fillRect(0, 0, battleCanvas.width, battleCanvas.height);
    
    // Dessiner les fighters
    fighters.forEach(fighter => {
        if (!fighter.isAlive) return;
        
        // Déplacer vers une cible aléatoire
        if (Math.random() < 0.02) {
            fighter.targetX = Math.random() * (battleCanvas.width - 100) + 50;
            fighter.targetY = Math.random() * (battleCanvas.height - 100) + 50;
        }
        
        // Déplacement fluide
        const dx = fighter.targetX - fighter.x;
        const dy = fighter.targetY - fighter.y;
        fighter.x += dx * 0.02;
        fighter.y += dy * 0.02;
        
        // Dessiner le fighter
        battleCtx.save();
        
        // Halo
        const gradient = battleCtx.createRadialGradient(fighter.x, fighter.y, 0, fighter.x, fighter.y, 40);
        gradient.addColorStop(0, fighter.color + 'aa');
        gradient.addColorStop(1, fighter.color + '00');
        battleCtx.fillStyle = gradient;
        battleCtx.beginPath();
        battleCtx.arc(fighter.x, fighter.y, 40, 0, Math.PI * 2);
        battleCtx.fill();
        
        // Corps du fighter
        battleCtx.fillStyle = fighter.color;
        battleCtx.shadowBlur = 20;
        battleCtx.shadowColor = fighter.color;
        battleCtx.beginPath();
        battleCtx.arc(fighter.x, fighter.y, 20, 0, Math.PI * 2);
        battleCtx.fill();
        
        // Barre de vie
        const healthBarWidth = 60;
        const healthBarHeight = 8;
        const healthPercent = fighter.health / fighter.maxHealth;
        
        battleCtx.shadowBlur = 0;
        battleCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        battleCtx.fillRect(fighter.x - healthBarWidth / 2, fighter.y - 35, healthBarWidth, healthBarHeight);
        
        battleCtx.fillStyle = healthPercent > 0.3 ? '#32cd32' : '#dc143c';
        battleCtx.fillRect(fighter.x - healthBarWidth / 2, fighter.y - 35, healthBarWidth * healthPercent, healthBarHeight);
        
        // Symbole
        battleCtx.fillStyle = 'white';
        battleCtx.font = 'bold 16px Georgia';
        battleCtx.textAlign = 'center';
        battleCtx.fillText(fighter.symbol, fighter.x, fighter.y - 45);
        
        battleCtx.restore();
    });
    
    // Lignes de connexion entre fighters proches
    for (let i = 0; i < fighters.length; i++) {
        if (!fighters[i].isAlive) continue;
        
        for (let j = i + 1; j < fighters.length; j++) {
            if (!fighters[j].isAlive) continue;
            
            const dx = fighters[i].x - fighters[j].x;
            const dy = fighters[i].y - fighters[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 200) {
                const opacity = (1 - distance / 200) * 0.3;
                battleCtx.strokeStyle = `rgba(220, 20, 60, ${opacity})`;
                battleCtx.lineWidth = 2;
                battleCtx.beginPath();
                battleCtx.moveTo(fighters[i].x, fighters[i].y);
                battleCtx.lineTo(fighters[j].x, fighters[j].y);
                battleCtx.stroke();
            }
        }
    }
    
    battleAnimationId = requestAnimationFrame(animateBattle);
}

function endBattle() {
    stopBattle();
    
    const winner = fighters.find(f => f.isAlive);
    
    if (winner) {
        const arena = document.getElementById('battleArena');
        const victoryMessage = document.createElement('div');
        victoryMessage.className = 'battle-message';
        victoryMessage.style.fontSize = '2em';
        victoryMessage.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 140, 0, 0.3))';
        victoryMessage.style.padding = '30px';
        victoryMessage.innerHTML = `
            🏆 <strong>${winner.symbol}</strong> REMPORTE LE BATTLE ROYALE ! 🏆<br>
            <span style="font-size: 0.6em;">Avec ${Math.round(winner.health)} HP restants</span>
        `;
        arena.insertBefore(victoryMessage, arena.firstChild);
    }
    
    console.log('🏆 Battle terminée !');
}

// ===== FIN BATTLE ROYALE =====

// ===== TIME MACHINE =====

function toggleTimeMachine() {
    const section = document.getElementById('timeMachineSection');
    const button = document.getElementById('timeMachineToggle');
    
    if (section.style.display === 'none' || section.style.display === '') {
        section.style.display = 'block';
        button.classList.add('active');
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        section.style.display = 'none';
        button.classList.remove('active');
    }
}

async function timeTravel() {
    const symbol = document.getElementById('tmSymbol').value.trim().toUpperCase();
    const amount = parseFloat(document.getElementById('tmAmount').value);
    const years = parseInt(document.getElementById('tmYears').value);
    const resultsContainer = document.getElementById('timeMachineResults');
    
    if (!symbol) {
        resultsContainer.innerHTML = '<div class="error-message">⏰ Veuillez entrer un symbole d\'action</div>';
        return;
    }
    
    if (!amount || amount <= 0) {
        resultsContainer.innerHTML = '<div class="error-message">⏰ Veuillez entrer un montant valide</div>';
        return;
    }
    
    showTimeWarp(years);
    
    resultsContainer.innerHTML = '<div class="loading">⏰ Calcul du voyage temporel...</div>';
    
    try {
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - years);
        
        const historicalData = await fetchHistoricalData(symbol, years);
        
        if (!historicalData || !historicalData.pastPrice || !historicalData.currentPrice) {
            throw new Error('Données insuffisantes');
        }
        
        const pastPrice = historicalData.pastPrice;
        const currentPrice = historicalData.currentPrice;
        const shares = amount / pastPrice;
        const currentValue = shares * currentPrice;
        const profit = currentValue - amount;
        const returnPercent = ((currentValue - amount) / amount * 100).toFixed(2);
        const multiplier = (currentValue / amount).toFixed(2);
        
        setTimeout(() => {
            hideTimeWarp();
            displayTimeMachineResults(symbol, amount, years, pastPrice, currentPrice, currentValue, profit, returnPercent, multiplier, shares);
        }, 3000);
        
    } catch (error) {
        console.error('Erreur Time Machine:', error);
        setTimeout(() => {
            hideTimeWarp();
            displayTimeMachineDemoResults(symbol, amount, years);
        }, 3000);
    }
}

async function fetchHistoricalData(symbol, years) {
    try {
        const url = `${API_BASE}?function=TIME_SERIES_MONTHLY&symbol=${symbol}&apikey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data['Monthly Time Series']) {
            const timeSeries = data['Monthly Time Series'];
            const dates = Object.keys(timeSeries).sort();
            
            const currentPrice = parseFloat(timeSeries[dates[dates.length - 1]]['4. close']);
            
            const targetDate = new Date();
            targetDate.setFullYear(targetDate.getFullYear() - years);
            
            let pastPrice = null;
            for (let i = 0; i < dates.length; i++) {
                const date = new Date(dates[i]);
                if (date <= targetDate) {
                    pastPrice = parseFloat(timeSeries[dates[i]]['4. close']);
                    break;
                }
            }
            
            if (pastPrice) {
                return { pastPrice, currentPrice };
            }
        }
        
        throw new Error('Données historiques non disponibles');
        
    } catch (error) {
        console.error('Erreur récupération données historiques:', error);
        return null;
    }
}

function displayTimeMachineDemoResults(symbol, amount, years) {
    const resultsContainer = document.getElementById('timeMachineResults');
    
    const growthRate = 0.08 + Math.random() * 0.12;
    const currentValue = amount * Math.pow(1 + growthRate, years);
    const profit = currentValue - amount;
    const returnPercent = ((currentValue - amount) / amount * 100).toFixed(2);
    const multiplier = (currentValue / amount).toFixed(2);
    
    const pastPrice = 100 + Math.random() * 50;
    const currentPrice = pastPrice * (currentValue / amount);
    const shares = amount / pastPrice;
    
    displayTimeMachineResults(symbol, amount, years, pastPrice, currentPrice, currentValue, profit, returnPercent, multiplier, shares, true);
}

function displayTimeMachineResults(symbol, amount, years, pastPrice, currentPrice, currentValue, profit, returnPercent, multiplier, shares, isDemo = false) {
    const resultsContainer = document.getElementById('timeMachineResults');
    
    const isProfit = profit >= 0;
    const pastYear = new Date().getFullYear() - years;
    
    const resultHTML = `
        <div class="time-result-card">
            ${isDemo ? '<div style="background: rgba(255, 165, 0, 0.1); padding: 10px; border-radius: 10px; margin-bottom: 20px; text-align: center;"><small style="color: #ff8c00;">💡 <em>Résultats simulés (données de démonstration)</em></small></div>' : ''}
            
            <div class="time-result-header">
                <div class="time-result-title">⏰ Voyage Temporel : ${symbol}</div>
                <div class="time-result-journey">
                    ${pastYear} → ${new Date().getFullYear()} (${years} an${years > 1 ? 's' : ''})
                </div>
            </div>
            
            <div class="time-result-main">
                <div class="time-result-label">Votre investissement de $${amount.toFixed(2)} serait maintenant :</div>
                <div class="time-result-value">$${currentValue.toFixed(2)}</div>
                <div class="time-result-multiplier" style="color: ${isProfit ? '#28a745' : '#dc3545'}">
                    ${isProfit ? '✨' : '📉'} ${multiplier}x votre investissement initial
                </div>
            </div>
            
            <div class="time-result-details">
                <div class="time-detail-box">
                    <div class="time-detail-label">Prix en ${pastYear}</div>
                    <div class="time-detail-value">$${pastPrice.toFixed(2)}</div>
                </div>
                
                <div class="time-detail-box">
                    <div class="time-detail-label">Prix actuel</div>
                    <div class="time-detail-value">$${currentPrice.toFixed(2)}</div>
                </div>
                
                <div class="time-detail-box">
                    <div class="time-detail-label">Actions achetées</div>
                    <div class="time-detail-value">${shares.toFixed(2)}</div>
                </div>
                
                <div class="time-detail-box">
                    <div class="time-detail-label">Rendement total</div>
                    <div class="time-detail-value" style="color: ${isProfit ? '#28a745' : '#dc3545'}">
                        ${isProfit ? '+' : ''}${returnPercent}%
                    </div>
                </div>
                
                <div class="time-detail-box">
                    <div class="time-detail-label">${isProfit ? 'Profit réalisé' : 'Perte'}</div>
                    <div class="time-detail-value" style="color: ${isProfit ? '#28a745' : '#dc3545'}">
                        ${isProfit ? '+' : ''}$${profit.toFixed(2)}
                    </div>
                </div>
                
                <div class="time-detail-box">
                    <div class="time-detail-label">Rendement annuel</div>
                    <div class="time-detail-value">${(returnPercent / years).toFixed(2)}%/an</div>
                </div>
            </div>
            
            <div class="time-result-message ${isProfit ? '' : 'negative'}">
                ${isProfit ? 
                    `🎉 Félicitations ! Si vous aviez investi $${amount.toFixed(2)} dans ${symbol} il y a ${years} an${years > 1 ? 's' : ''}, vous auriez gagné $${profit.toFixed(2)} ! C'est ${multiplier}x votre investissement initial !` :
                    `😔 Si vous aviez investi $${amount.toFixed(2)} dans ${symbol} il y a ${years} an${years > 1 ? 's' : ''}, vous auriez perdu $${Math.abs(profit).toFixed(2)}. Mais rappelez-vous : les marchés fluctuent !`
                }
            </div>
        </div>
    `;
    
    resultsContainer.innerHTML = resultHTML;
}

function showTimeWarp(years) {
    const overlay = document.getElementById('timeWarpOverlay');
    const yearDisplay = overlay.querySelector('.time-warp-year');
    
    overlay.classList.add('active');
    
    const currentYear = new Date().getFullYear();
    let displayYear = currentYear;
    
    const countdown = setInterval(() => {
        displayYear--;
        yearDisplay.textContent = displayYear;
        
        if (displayYear <= currentYear - years) {
            clearInterval(countdown);
        }
    }, 300);
}

function hideTimeWarp() {
    const overlay = document.getElementById('timeWarpOverlay');
    overlay.classList.remove('active');
}

// ===== MODE CONSTELLATION =====

function initConstellation() {
    canvas = document.getElementById('constellationCanvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    canvas.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
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
    
    addPortfolioStars();
}

function addPortfolioStars() {
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
    
    ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach((star, index) => {
        if (star.isStock) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const angle = Math.atan2(star.y - centerY, star.x - centerX);
            const radius = Math.sqrt(Math.pow(star.x - centerX, 2) + Math.pow(star.y - centerY, 2));
            
            const newAngle = angle + star.orbitSpeed;
            star.x = centerX + Math.cos(newAngle) * radius;
            star.y = centerY + Math.sin(newAngle) * radius;
            
            const dx = mouseX - star.x;
            const dy = mouseY - star.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                star.x += dx * 0.01;
                star.y += dy * 0.01;
            }
            
            ctx.save();
            
            const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 4);
            gradient.addColorStop(0, star.color + 'aa');
            gradient.addColorStop(1, star.color + '00');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = star.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = star.color;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'white';
            ctx.font = '12px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText(star.symbol, star.x, star.y - star.size - 10);
            
            ctx.restore();
            
        } else {
            star.x += star.speedX;
            star.y += star.speedY;
            
            if (star.x < 0 || star.x > canvas.width) star.speedX *= -1;
            if (star.y < 0 || star.y > canvas.height) star.speedY *= -1;
            
            star.opacity += star.twinkleSpeed;
            if (star.opacity >= 1 || star.opacity <= 0.3) {
                star.twinkleSpeed *= -1;
            }
            
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
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
        createStars(150);
        animateConstellation();
        console.log('🌌 Mode Constellation activé');
    } else {
        document.body.classList.remove('constellation-mode');
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
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
        
        fetchStockNews(symbol);
        fetchAndDisplayChart(symbol);
    } catch (error) {
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
            console.error(`Erreur pour ${symbol}:`, error);
            
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
        
        if (constellationMode) {
            createStars(150);
        }
    }
}

// ===== COMPARAISON AVEC GRAPHIQUE =====

async function addToComparison(symbol) {
    if (comparisonList.length >= 5) {
        showError('Vous pouvez comparer maximum 5 actions à la fois');
        return;
    }
    
    if (comparisonList.includes(symbol)) {
        showError('Cette action est déjà dans la comparaison');
        return;
    }
    
    comparisonList.push(symbol);
    displayComparison();
}

async function displayComparison() {
    const container = document.getElementById('comparisonArea');
    
    if (comparisonList.length === 0) {
        container.innerHTML = '<p class="empty-state">Sélectionnez des actions pour les comparer en douceur</p>';
        return;
    }
    
    container.innerHTML = '<div class="loading">Chargement de la comparaison...</div>';
    
    let comparisonHTML = `
        <div style="margin-bottom: 30px;">
            <h3 style="color: #8b6f8b; margin-bottom: 20px; font-weight: 300; text-align: center;">
                📊 Comparaison Graphique
            </h3>
            <div style="background: rgba(255, 250, 250, 0.5); padding: 20px; border-radius: 15px; border: 2px dashed rgba(212, 165, 165, 0.3);">
                <canvas id="comparisonChart" style="max-height: 400px;"></canvas>
            </div>
        </div>
        
        <div style="margin-bottom: 20px; text-align: center;">
            <button onclick="clearComparison()" style="padding: 12px 25px; background: linear-gradient(135deg, #e8c1c1 0%, #d4a5a5 100%); font-size: 0.95em;">
                🗑️ Vider la comparaison
            </button>
        </div>
        
        <div class="comparison-grid">
    `;
    
    const colors = [
        '#d4a5a5',
        '#c9a0dc',
        '#a8c9a8',
        '#ffa500',
        '#ff6b9d'
    ];
    
    const allDatesData = [];
    
    for (let i = 0; i < comparisonList.length; i++) {
        const symbol = comparisonList[i];
        try {
            const stockData = await fetchStockData(symbol);
            const isPositive = stockData.change >= 0;
            
            const historicalData = await fetchComparisonChartData(symbol);
            allDatesData.push({
                symbol: symbol,
                data: historicalData,
                color: colors[i]
            });
            
            comparisonHTML += `
                <div class="stock-card" style="border-left-color: ${colors[i]};">
                    <div class="stock-header">
                        <div>
                            <div class="stock-symbol" style="background: linear-gradient(135deg, ${colors[i]}, ${colors[i]}cc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                                ${stockData.symbol}
                            </div>
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
            
            const demoData = generateDemoChartData();
            allDatesData.push({
                symbol: symbol,
                data: demoData,
                color: colors[i]
            });
        }
    }
    
    comparisonHTML += '</div>';
    container.innerHTML = comparisonHTML;
    
    createComparisonChart(allDatesData);
}

async function fetchComparisonChartData(symbol) {
    try {
        const chartUrl = `${API_BASE}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
        const response = await fetch(chartUrl);
        const data = await response.json();
        
        const timeSeries = data['Time Series (Daily)'];
        
        if (!timeSeries) {
            return generateDemoChartData();
        }
        
        const dates = Object.keys(timeSeries).slice(0, 30).reverse();
        const prices = dates.map(date => parseFloat(timeSeries[date]['4. close']));
        
        return { dates, prices };
        
    } catch (error) {
        console.error('Erreur graphique comparaison:', error);
        return generateDemoChartData();
    }
}

function generateDemoChartData() {
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
    
    return { dates, prices };
}

function createComparisonChart(allDatesData) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    const labels = allDatesData[0].data.dates.map(date => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    
    const datasets = allDatesData.map(stockData => {
        const firstPrice = stockData.data.prices[0];
        const normalizedPrices = stockData.data.prices.map(price => (price / firstPrice) * 100);
        
        return {
            label: stockData.symbol,
            data: normalizedPrices,
            borderColor: stockData.color,
            backgroundColor: stockData.color + '20',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: stockData.color,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
        };
    });
    
    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#8b7d8b',
                        font: {
                            family: 'Georgia',
                            size: 14
                        },
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderWidth: 2,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + ' (base 100)';
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Performance Relative (Base 100)',
                    color: '#8b6f8b',
                    font: {
                        family: 'Georgia',
                        size: 16,
                        weight: '300'
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
                        autoSkipPadding: 20,
                        font: {
                            family: 'Georgia'
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(212, 165, 165, 0.1)'
                    },
                    ticks: {
                        color: '#8b7d8b',
                        font: {
                            family: 'Georgia'
                        },
                        callback: function(value) {
                            return value.toFixed(0);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Performance (%)',
                        color: '#8b7d8b',
                        font: {
                            family: 'Georgia',
                            size: 14
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

function clearComparison() {
    comparisonList = [];
    displayComparison();
}

function removeFromComparison(symbol) {
    comparisonList = comparisonList.filter(s => s !== symbol);
    displayComparison();
}

// ===== FIN COMPARAISON =====

// Récupérer les actualités financières
async function fetchStockNews(symbol) {
    const newsContainer = document.querySelector('.news-container');
    newsContainer.innerHTML = `<div class="loading">✨ Chargement des actualités pour ${symbol}...</div>`;
    
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
