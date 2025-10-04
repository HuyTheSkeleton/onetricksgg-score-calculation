(() => {
    const tableSel = "#panel\\:Rv576\\:0 > div > table";
    const tbody = document.querySelector(`${tableSel} > tbody`);
    if (!tbody) return console.error("table tbody not found");
    
    const allRows = Array.from(tbody.querySelectorAll("tr"));
    
    // first row is the header row (contains 'player' text)
    const headerRow = allRows[0];
    const dataRows = allRows.slice(1);
    
    // add core header to the header row
    if (headerRow && !headerRow.querySelector(".score-header")) {
        const headerCell = document.createElement("td");
        headerCell.className = "score-header";
        headerCell.innerText = "Score";
        headerCell.style.cursor = "pointer";
        headerRow.appendChild(headerCell);
    }
    
 //  const candidates = dataRows.slice(0, 30);
    const scored = [];
    
    // reliability (200 games = ~63%, 400 games = ~86%)
    const reliabilityFor = (games) => 1 - Math.exp(-games / 200);
    
    // process all data rows
    dataRows.forEach((row, idx) => {
        const cells = row.querySelectorAll("td");
        
        if (cells.length < 12) {
            if (!row.querySelector(".score-cell")) {
                const emptyCell = document.createElement("td");
                emptyCell.className = "score-cell";
                emptyCell.innerText = "-";
                emptyCell.style.color = "#666";
                row.appendChild(emptyCell);
            }
            return;
        }
        
        // data scraping
        const playRateTxt = (cells[8]?.innerText || "").replace("%","").trim();
        const gamesTxt    = (cells[9]?.innerText || "").replace(/,/g,"").trim();
        const winRateTxt  = (cells[10]?.innerText || "").replace("%","").trim();
        const lpTxt       = (cells[7]?.innerText || "").replace("LP","").trim();
        
        const playRate = parseFloat(playRateTxt);
        const games = parseInt(gamesTxt, 10);
        const winRate = parseFloat(winRateTxt);
        const lp = parseInt(lpTxt, 10);
        
        if ([playRate, games, winRate, lp].some(v => isNaN(v))) {
            if (!row.querySelector(".score-cell")) {
                const emptyCell = document.createElement("td");
                emptyCell.className = "score-cell";
                emptyCell.innerText = "-";
                emptyCell.style.color = "#666";
                row.appendChild(emptyCell);
            }
            return;
        }
        
        const reliability = reliabilityFor(games);
        
        // aggresive winrate scaling 40% = 0pts 50% = 50pts 55% = 75pts 60% = 100pts 65% = 125pts 70% = 150pts
        const winrateScore = Math.max(0, (winRate - 40) * 5);
        
        // playrate (0-15 points max)
        const playrateScore = Math.min(playRate, 15);
        
        // lp score (minimal - 0-5 points)
        // 100 LP = 1.2 points (0.012 scaling factor) capped at 30 points
        const lpScore = Math.min(lp * 0.012, 30);
        
        // otp bonus
        const commitmentBonus = playRate >= 50 ? 25 : 0;
        
        // final score: winrate 80% playrate 15% lp 30%
        const score = (winrateScore * reliability * 0.80) + (playrateScore * 0.15) + (lpScore * 0.30) + commitmentBonus;
        
        let scoreCell = row.querySelector(".score-cell");
        if (!scoreCell) {
            scoreCell = document.createElement("td");
            scoreCell.className = "score-cell";
            row.appendChild(scoreCell);
        }
        scoreCell.innerText = score.toFixed(2);
        scoreCell.style.fontWeight = "bold";
        scoreCell.style.color = playRate >= 50 ? "#00ff88" : "#ffffff";
        
        row.dataset.score = String(score);
        scored.push(row);
    });
    
    if (scored.length === 0) {
        console.log("no data found");
        return;
    }
    
    // sort scored 
    const sorted = scored.slice().sort((a,b) => 
        parseFloat(b.dataset.score) - parseFloat(a.dataset.score)
    );
    
    // header row at top -> sorted data
    const others = dataRows.filter(r => !scored.includes(r));
    
    tbody.innerHTML = "";
    tbody.appendChild(headerRow); // is top header
    sorted.forEach(r => tbody.appendChild(r));
    others.forEach(r => tbody.appendChild(r));
    
    console.log(`sorted ${scored.length} players by score`);
})();