// 0 - main menu
// 1 - easy question
// 2 - med question
// 3 - hard question
// 4 - results
let prompt = -1;
let timer = -1;
let DATA;

const POINTS = [
    25,
    50,
    80,
    100,
    60,
]

const RARITIES = [
    "Red Bloon",
    "Camo",
    "DDT",
    "The Golden Bloon",
    "Too Clever",
]

const MS_START = Date.UTC(2026, 10, 9) + 18_000_000 // EST
const MS_DAY = 86_400_000
const DAY_NUMBER = Math.floor((Date.now() - MS_START) / MS_DAY);

const MAX_AUTOCORRECT_ERROR = 5;
const MAX_AUTOCORRECT_ERROR_PERC = 0.2;

async function init() {
    document.getElementById('date-label').textContent = 'DAY ' + DAY_NUMBER;
    const day = await fetch('days/' + DAY_NUMBER + '.json');
    if (!day.ok) throw new Error('No data found for today.');
    DATA = await day.json();
}

function play() {
    prompt = 0;
    document.getElementById('title-panel').classList.replace('panel', 'panel-hidden');
    document.getElementById('desc-panel').classList.replace('panel', 'panel-hidden');
    document.getElementById('prompt-panel').classList.replace('panel-hidden', 'panel');
    document.getElementById('answer-panel').classList.replace('panel-hidden', 'panel');
    update_prompt();
}

function submit(force) {
    let answer = answer_auto(document.getElementById('answer-input').value);
    if (!answer && !force) {
        return;
    }
    timer = -1;
    if (!answer) {
        answer = "";
    }
    let rarity = answer_rarity(answer, prompt);

    localStorage.setItem('answers.' + DAY_NUMBER + '.' + prompt + '.answer', answer);
    localStorage.setItem('answers.' + DAY_NUMBER + '.' + prompt + '.rarity', rarity);

    document.getElementById('result-answer-label').textContent = answer;
    if (rarity >= 0) {
        document.getElementById('result-rarity-label').textContent = RARITIES[rarity];
        document.getElementById('result-points-label').textContent = POINTS[rarity] + ' Points';
    } else {
        document.getElementById('result-rarity-label').textContent = 'No answer.';
        document.getElementById('result-points-label').textContent = '0 Points';
    }

    document.getElementById('result-panel').classList.replace('panel-hidden', 'panel');
    document.getElementById('answer-panel').classList.replace('panel', 'panel-hidden');
    document.getElementById('answer-input').value = "";
}

function next_prompt() {
    document.getElementById('result-panel').classList.replace('panel', 'panel-hidden');
    document.getElementById('answer-panel').classList.replace('panel-hidden', 'panel');
    prompt++;
    if (prompt == 3) {
        end_game();
    } else {
        update_prompt();
    }
}

function update_prompt() {
    timer = 25;
    document.getElementById('timer-label').textContent = timer;
    setTimeout(dec_timer.bind(this, prompt), 1000);
    if (prompt == 0) {
        document.getElementById('difficulty-label').textContent = "EASY";
        document.getElementById('prompt-label').textContent = DATA[0].prompt;
    }
    else if (prompt == 1) {
        document.getElementById('difficulty-label').textContent = "MEDIUM";
        document.getElementById('prompt-label').textContent = DATA[1].prompt;
    }
    else if (prompt == 2) {
        document.getElementById('difficulty-label').textContent = "HARD";
        document.getElementById('prompt-label').textContent = DATA[2].prompt;
    }
}

function dec_timer(prompt_num) {
    if (timer <= 0 || prompt != prompt_num) {
        return;
    }
    timer--;
    document.getElementById('timer-label').textContent = timer;
    if (timer == 0) {
        submit(true);
    } else {
        setTimeout(dec_timer.bind(this, prompt_num), 1000);
    }
}

function end_game() {
    document.getElementById('end-points-label').textContent = scores(DAY_NUMBER).total + ' POINTS';
    document.getElementById('end-easy-label').textContent = 'EASY - ' + DATA[0].prompt;
    document.getElementById('end-easy-answer-label').textContent = answers(DAY_NUMBER)[0] + ' - ' + scores(DAY_NUMBER).individual[0] + ' points';
    document.getElementById('end-medium-label').textContent = 'MEDIUM - ' + DATA[1].prompt;
    document.getElementById('end-medium-answer-label').textContent = answers(DAY_NUMBER)[1] + ' - ' + scores(DAY_NUMBER).individual[1] + ' points';
    document.getElementById('end-hard-label').textContent = 'HARD - ' + DATA[2].prompt;
    document.getElementById('end-hard-answer-label').textContent = answers(DAY_NUMBER)[2] + ' - ' + scores(DAY_NUMBER).individual[2] + ' points';
    
    document.getElementById('desc-panel').classList.replace('panel', 'panel-hidden');
    document.getElementById('prompt-panel').classList.replace('panel', 'panel-hidden');
    document.getElementById('answer-panel').classList.replace('panel', 'panel-hidden');
    document.getElementById('result-panel').classList.replace('panel', 'panel-hidden');
    document.getElementById('title-panel').classList.replace('panel-hidden', 'panel');
    document.getElementById('end-panel').classList.replace('panel-hidden', 'panel');
}

    // TODO: ADD AUTOCORRECT

function answer_auto(answer) {
    let min_comp = Number.MAX_SAFE_INTEGER;
    let min_ans = "";
    for (const rarity of DATA[prompt].answers) {
        for (const aliases_concat of rarity) {
            const aliases = aliases_concat.split(",");
            for (const alias of aliases) {
                let comp = answer_comp(alias.toLowerCase().replace(/\s/g, ''), answer.toLowerCase().replace(/\s/g, ''));
                if (comp < min_comp) {
                    min_comp = comp;
                    min_ans = aliases[0];
                }
            }
        }
    }
    if (min_comp <= MAX_AUTOCORRECT_ERROR && min_comp / answer.length <= MAX_AUTOCORRECT_ERROR_PERC) {
        return min_ans;
    } else {
        return null;
    }
}

let answer_rarity = (answer) => {
    for (const i of RARITIES.keys()) {
        for (const alias_concat of DATA[prompt].answers[i]) {
            if (answer == alias_concat.split(",")[0]) {
                return i;
            }
        }
    }
    return -1;
};

// Levenshtein distance
function answer_comp(s, t) {
    const dp = Array(s.length + 1).fill(null).map(() =>
        Array(t.length + 1).fill(null));
    for (let i = 0; i <= s.length; i += 1) {
        dp[i][0] = i;
    }
    for (let j = 0; j <= t.length; j += 1) {
        dp[0][j] = j;
    }
    for (let i = 1; i <= s.length; i += 1) {
        for (let j = 1; j <= t.length; j += 1) {
            const indicator = s[i - 1] === t[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i][j - 1] + 1, // Deletion
                dp[i - 1][j] + 1, // Insertion
                dp[i - 1][j - 1] + indicator // Substitution
            );
        }
    }
    return dp[s.length][t.length];
}

function answers(day) {
    let answers = [];
    for (let i = 0; i < 3; i++) {
        let answer = localStorage.getItem('answers.' + day + '.' + i + '.answer');
        if (!answer) {
            answers[i] = 'No answer.';
        } else {
            answers[i] = answer;
        }
    }
    return answers;
}

function scores(day) {
    let scores = [];
    for (let i = 0; i < 3; i++) {
        let rarity = localStorage.getItem('answers.' + day + '.' + i + '.rarity')
        if (rarity == -1) {
            scores[i] = 0;
        } else {
            scores[i] = POINTS[rarity];
        }
    }
    return {
        "total": scores[0] + scores[1] + scores[2],
        "individual": scores,
    };
}

document.querySelector('#btn-play').addEventListener('click', play);
document.querySelector('#btn-submit').addEventListener('click', submit.bind(this, false));
document.querySelector('#btn-next').addEventListener('click', next_prompt);
init();