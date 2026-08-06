// Add syncMram as the third parameter
export default function hardwareSketch(p, addLog, syncMram) {
    let mram = [
        { id: 0, name: "I2C Sensors", strikes: 0, skip: false },
        { id: 1, name: "SPI Comm", strikes: 0, skip: false },
        { id: 2, name: "UART Log", strikes: 0, skip: false }
    ];

    let state = "IDLE";
    let activeId = -1;
    let wdt = 100;
    let timer = 0;
    let pendingFault = null;
    let crashTimer = 0;

    // NEW: Helper function to push deep copies of MRAM to React
    const syncToReact = () => {
        // We spread the array and objects so React recognizes it as a new state
        syncMram(mram.map(item => ({ ...item })));
    };

    p.setup = () => {
        p.createCanvas(800, 450);
        p.frameRate(30);
        syncToReact(); // Sync initial 0 strikes state on load
    };

    p.startBoot = () => {
        if (state === "CRASHED" && activeId !== -1) {
            addLog(`[WAKE-UP] WDT_RESET flag detected in RCC_CSR.`);
            mram[activeId].strikes++;

            if (mram[activeId].strikes >= 3) {
                mram[activeId].skip = true;
                addLog(`PMIC_CMD: Strike threshold met. Power-gating ${mram[activeId].name}.`);
            }

            addLog(`MRAM_READ: Culprit was ID: ${activeId} (${mram[activeId].name})`);
            addLog(`MRAM_UPDATE: ${mram[activeId].name} strikes = ${mram[activeId].strikes}/3`);

            // SYNC: We just changed strikes and skips, tell React to update the table
            syncToReact();

        } else {
            addLog("SYSTEM POWER ON");
        }

        addLog("BOOT: Sentinel Microkernel Initializing...");
        state = "BOOTING";
        activeId = 0;
        wdt = 100;
        pendingFault = null;
        timer = p.millis();
    };

    p.triggerFault = (targetId, faultType) => {
        if (mram[targetId].skip) return;

        if (state === "OS_RUNNING") {
            addLog(`CRITICAL: In-flight ${faultType} on ${mram[targetId].name}! Flight OS halted.`);
            addLog(`IWDG: Watchdog starved. Pulling hardware reset pin low...`);
            state = "CRASHED";
            activeId = targetId;

            if (faultType === "SEL") {
                mram[targetId].strikes = 2;
                syncToReact(); // SYNC: We hard-set strikes for SEL
            }

            crashTimer = p.millis();
            return;
        }

        addLog(`EXTERNAL_INTERRUPT: ${faultType} simulated on ${mram[targetId].name}!`);
        pendingFault = { id: targetId, type: faultType };
    };

    p.draw = () => {
        p.background(20);

        if (state === "BOOTING") {
            processBootSequence();
        } else if (state === "CRASHED") {
            if (p.millis() - crashTimer > 1500) {
                addLog("HARDWARE_RESET: MCU restarting...");
                p.startBoot();
            }
        }

        drawMCUTraces();
        drawBlock(100, 100, 120, 80, "PMIC\nPower Mgmt", "#222", "#444");
        drawBlock(100, 250, 120, 80, "MRAM\nPersistent", "#222", "#444");
        drawMCU(350, 125, 150, 200);

        for (let i = 0; i < 3; i++) {
            let py = 60 + (i * 120);
            let pColor = mram[i].skip ? "#2a2a2a" : (activeId === i ? "#b8860b" : "#1e4d2b");
            let outline = mram[i].skip ? "#444" : (activeId === i ? "#ffd700" : "#2e8b57");

            if (state === "CRASHED" && activeId === i && pendingFault?.type === "SEL") {
                pColor = (p.frameCount % 10 > 5) ? "#ff0000" : "#800000";
            }

            drawBlock(600, py, 140, 80, `${mram[i].name}\nStrikes: ${mram[i].strikes}`, pColor, outline);
        }
        drawPMICTraces();
    };

    function processBootSequence() {
        if (activeId < 3 && mram[activeId].skip) {
            addLog(`BYPASS: Skipping ${mram[activeId].name} (Power-gated).`);
            activeId++;
            timer = p.millis();
            return;
        }

        if (pendingFault && pendingFault.id === activeId) {
            if (pendingFault.type === "SEL" && state !== "CRASHED") {
                addLog(`CRITICAL: Hard Latch-up (SEL) causing massive current draw.`);
                mram[activeId].strikes = 2;
                syncToReact(); // SYNC: SEL forces strike count update
            }

            wdt -= 4;
            if (wdt <= 0 && state !== "CRASHED") {
                state = "CRASHED";
                addLog(`FATAL: Watchdog timer expired. MCU halted.`);
                addLog(`IWDG: Pulling hardware reset pin low...`);
                crashTimer = p.millis();
            }
            return;
        }

        wdt = 100;
        if (p.millis() - timer > 2000) {
            addLog(`SUCCESS: ${mram[activeId].name} initialized.`);
            activeId++;
            timer = p.millis();
        }

        if (activeId >= 3) {
            state = "OS_RUNNING";
            activeId = -1;
            addLog("HANDOFF: Executing jump_to_os(0x08008000).");
            addLog("=== FLIGHT OS RUNNING ===");
        }
    }

    function drawPMICTraces() {
        for (let i = 0; i < 3; i++) {
            let py = 60 + (i * 120);
            let targetY = py - 10;
            let isGated = mram[i].skip;

            p.strokeWeight(3);
            p.stroke(isGated ? 50 : 200, 50, 50);
            p.line(220, 140, 260, targetY);

            p.strokeWeight(4);
            p.stroke(255);
            if (isGated) {
                p.line(260, targetY, 280, targetY - 20);
                p.fill(255, 100, 100); p.noStroke();
                p.text("CUT", 270, targetY - 25);
            } else {
                p.line(260, targetY, 290, targetY);
            }

            p.strokeWeight(3);
            p.stroke(isGated ? 50 : 200, 50, 50);
            p.line(290, targetY, 600, targetY);

            if (!isGated && state !== "CRASHED") {
                let cycle = (p.frameCount % 60) / 60;
                let dotX1 = p.lerp(220, 260, cycle);
                let dotY1 = p.lerp(140, targetY, cycle);
                let dotX2 = p.lerp(290, 600, cycle);
                let dotY2 = targetY;

                p.fill(255, 100, 100); p.noStroke();
                p.circle(dotX1, dotY1, 6);
                p.circle(dotX2, dotY2, 6);
            }
        }
    }

    function drawMCUTraces() {
        p.strokeWeight(3);
        for (let i = 0; i < 3; i++) {
            let py = 60 + (i * 120);
            if (mram[i].skip) p.stroke(50);
            else if (activeId === i && state === "BOOTING") p.stroke(255, 215, 0);
            else p.stroke(100);
            p.line(500, 225, 600, py + 15);
        }
    }

    function drawBlock(x, y, w, h, label, fillCol, strokeCol) {
        p.fill(fillCol);
        p.stroke(strokeCol);
        p.strokeWeight(2);
        p.rect(x, y, w, h, 8);

        p.fill(255);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        p.text(label, x + w / 2, y + h / 2);
    }

    function drawMCU(x, y, w, h) {
        let mcuColor = "#222";
        if (state === "CRASHED") mcuColor = "#800000";
        if (state === "OS_RUNNING") mcuColor = "#004080";

        drawBlock(x, y, w, h, "STM32F405\n(MCU)", mcuColor, "#888");

        p.fill(50);
        p.rect(x + 10, y + h - 30, w - 20, 15);
        p.fill(wdt > 50 ? "#00ff00" : "#ff0000");
        p.rect(x + 10, y + h - 30, Math.max(0, (wdt / 100) * (w - 20)), 15);

        p.fill(255);
        p.textSize(10);
        p.text("IWDG (Watchdog)", x + w / 2, y + h - 40);
    }
}