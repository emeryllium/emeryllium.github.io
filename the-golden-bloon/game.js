// 0 - main menu
// 1 - easy question
// 2 - med question
// 3 - hard question
// 4 - results
let state = 0;
let DATA;

async function init() {
    document.getElementById('date-label').textContent = 'DAY ' + DAY_NUMBER;
    const day = await fetch('days/' + DAY_NUMBER + '.json');
    if (!day.ok) throw new Error('No data found for today.');
    DATA = await day.json();
}

function play() {
    state = 1;
    document.getElementById('title-panel').classList.replace('panel', 'panel-hidden');
    document.getElementById('desc-panel').classList.replace('panel', 'panel-hidden');
    document.getElementById('prompt-panel').classList.replace('panel-hidden', 'panel');
    document.getElementById('answer-panel').classList.replace('panel-hidden', 'panel');
    update_prompt();
}

function submit() {
    state++;
    if (state == 4) {
        document.getElementById('prompt-panel').classList.replace('panel', 'panel-hidden');
        document.getElementById('answer-panel').classList.replace('panel', 'panel-hidden');
        document.getElementById('result-panel').classList.replace('panel-hidden', 'panel');
    } else {
        update_prompt();
    }
}

function update_prompt() {
    if (state == 1) {
        document.getElementById('difficulty-label').textContent = "EASY";
        document.getElementById('prompt-label').textContent = DATA[0].prompt;
    }
    else if (state == 2) {
        document.getElementById('difficulty-label').textContent = "MEDIUM";
        document.getElementById('prompt-label').textContent = DATA[1].prompt;
    }
    else if (state == 3) {
        document.getElementById('difficulty-label').textContent = "HARD";
        document.getElementById('prompt-label').textContent = DATA[2].prompt;
    }
}

    // DAILY PROMPTS

const MS_START = Date.UTC(2026, 10, 8)
const MS_DAY = 86400000
const DAY_NUMBER = Math.floor((Date.now() - MS_START) / MS_DAY);

document.querySelector('#btn-play').addEventListener('click', play);
document.querySelector('#btn-submit').addEventListener('click', submit);
init();