// 0 - main menu
// 1 - easy question
// 2 - med question
// 3 - hard question
// 4 - results
let prompt = -1;
let timer = -1;
let DATA;

const QUESTIONS = [
    'Easy',
    'Medium',
    'Hard'
]

const RARITIES = [
    {
        name: 'Red Bloon',
        points: 25,
        symbol: '🎈',
        icon: 'assets/red_bloon.webp'
    },
    {
        name: 'Camo',
        points: 50,
        symbol: '🌳',
        icon: 'assets/camo_bloon.webp'
    },
    {
        name: 'DDT',
        points: 80,
        symbol: '✴️',
        icon: 'assets/ddt.webp'
    },
    {
        name: 'The Golden Bloon',
        points: 100,
        symbol: '💫',
        icon: 'assets/golden_bloon.webp'
    },
    {
        name: 'Camo Regro Fortified Red',
        points: 60,
        symbol: '🪀',
        icon: 'assets/camgrow_red.webp'
    },
]

const MS_START = Date.UTC(2026, 10, 9) + 18_000_000; // EST
const MS_DAY = 86_400_000;
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
    let input = document.getElementById('answer-input').value;
    let answer = answer_auto(input);
    if (!force) {
        if (!answer) {
            return;
        }
        if (input.toLowerCase() != answer.toLowerCase()) {
            document.getElementById('answer-input').value = answer;
            return;
        }
    }
    timer = -1;
    if (!answer) {
        answer = "";
    }
    let rarity = answer_rarity(answer, prompt);
    let desc = answer_desc(answer, prompt);

    localStorage.setItem('answers.' + DAY_NUMBER + '.' + prompt + '.answer', answer);
    localStorage.setItem('answers.' + DAY_NUMBER + '.' + prompt + '.rarity', rarity);
    localStorage.setItem('answers.' + DAY_NUMBER + '.' + prompt + '.desc', desc);

    document.getElementById('result-answer-label').textContent = answer;
    document.getElementById('result-desc-label').textContent = desc ? desc : '';
    if (rarity >= 0) {
        document.getElementById('result-rarity-label').textContent = RARITIES[rarity].name;
        document.getElementById('result-points-label').textContent = RARITIES[rarity].points + ' Points';
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
    let scores = get_scores(DAY_NUMBER);
    let answers = get_answers(DAY_NUMBER);
    let descriptions = get_descriptions(DAY_NUMBER);

    document.getElementById('end-points-label').textContent = scores.total + ' POINTS';

    document.getElementById('end-easy-label').textContent = 'EASY - ' + DATA[0].prompt;
    document.getElementById('end-medium-label').textContent = 'MEDIUM - ' + DATA[1].prompt;
    document.getElementById('end-hard-label').textContent = 'HARD - ' + DATA[2].prompt;

    document.getElementById('end-easy-answer-label').textContent = answers[0] + ' - ' + scores.individual[0] + ' points';
    document.getElementById('end-medium-answer-label').textContent = answers[1] + ' - ' + scores.individual[1] + ' points';
    document.getElementById('end-hard-answer-label').textContent = answers[2] + ' - ' + scores.individual[2] + ' points';

    document.getElementById('end-easy-desc-label').textContent = descriptions[0] == 'null' ? '' : descriptions[0];
    document.getElementById('end-medium-desc-label').textContent = descriptions[1] == 'null' ? '' : descriptions[1];
    document.getElementById('end-hard-desc-label').textContent = descriptions[2] == 'null' ? '' : descriptions[2];
    
    document.getElementById('desc-panel').classList.replace('panel', 'panel-hidden');
    document.getElementById('prompt-panel').classList.replace('panel', 'panel-hidden');
    document.getElementById('answer-panel').classList.replace('panel', 'panel-hidden');
    document.getElementById('result-panel').classList.replace('panel', 'panel-hidden');
    document.getElementById('title-panel').classList.replace('panel-hidden', 'panel');
    document.getElementById('end-panel').classList.replace('panel-hidden', 'panel');
    document.getElementById('copy-panel').classList.replace('panel-hidden', 'panel');
}

async function copy_score() {
    let r = get_rarities(DAY_NUMBER);
    let text = 
        'The Golden Bloon #' + DAY_NUMBER + '\n'
         + get_scores(DAY_NUMBER).total + ' - '
         + (r[0] == -1 ? '⬛' : RARITIES[r[0]].symbol)
         + (r[1] == -1 ? '⬛' : RARITIES[r[1]].symbol)
         + (r[2] == -1 ? '⬛' : RARITIES[r[2]].symbol)
         + '\nhttps://emeryllium.github.io/the-golden-bloon/';

    await navigator.clipboard.writeText(text);
}

async function copy_image() {
    const canvas = await html2canvas(document.getElementById('end-panel'), {
        backgroundColor: null,
        scale: window.devicePixelRatio,
        useCORS: true
    });
    const img = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    try {
        await navigator.clipboard.write([new ClipboardItem({"image/png": img,})]);
    } catch {
        const url = URL.createObjectURL(img);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'SPOILER_THE-GOLDEN-BLOON_' + DAY_NUMBER + '.png';
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}

function answer_auto(answer) {
    let min_comp = Number.MAX_SAFE_INTEGER;
    let min_ans = "";
    for (const rarity of DATA[prompt].answers) {
        for (const aliases_concat of rarity) {
            const aliases = aliases_concat.split('~')[0].split(',');
            for (const alias of aliases) {
                let comp = answer_comp(normalize_string(alias).replace(/\s/g, ''), normalize_string(answer).replace(/\s/g, ''));
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

function answer_rarity(answer) {
    for (const i of RARITIES.keys()) {
        for (const alias_concat of DATA[prompt].answers[i]) {
            if (answer == alias_concat.split('~')[0].split(',')[0]) {
                return i;
            }
        }
    }
    return -1;
}

function answer_desc(answer) {
    for (const i of RARITIES.keys()) {
        for (const alias_concat of DATA[prompt].answers[i]) {
            var aliases = alias_concat.split('~');
            if (answer == aliases[0].split(',')[0]) {
                return aliases.length >= 2 ? aliases[1] : null;
            }
        }
    }
    return null;
}

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

function normalize_string(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}

function get_answers(day) {
    let answers = [];
    for (const i of QUESTIONS.keys()) {
        let answer = localStorage.getItem('answers.' + day + '.' + i + '.answer');
        if (!answer) {
            answers[i] = 'No answer.';
        } else {
            answers[i] = answer;
        }
    }
    return answers;
}

function get_rarities(day) {
    let rarities = [];
    for (const i of QUESTIONS.keys()) {
        rarities[i] = localStorage.getItem('answers.' + day + '.' + i + '.rarity');
    }
    return rarities;
}

function get_descriptions(day) {
    let descriptions = [];
    for (const i of QUESTIONS.keys()) {
        descriptions[i] = localStorage.getItem('answers.' + day + '.' + i + '.desc');
    }
    return descriptions;
}

function get_scores(day) {
    let scores = [];
    for (const i of QUESTIONS.keys()) {
        let rarity = localStorage.getItem('answers.' + day + '.' + i + '.rarity')
        if (rarity == -1) {
            scores[i] = 0;
        } else {
            scores[i] = RARITIES[rarity].points;
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
document.querySelector('#btn-copy-score').addEventListener('click', copy_score);
document.querySelector('#btn-copy-image').addEventListener('click', copy_image);
document.querySelector('#answer-input').addEventListener('keyup', function(event) {
    if (event.key == 'Enter') {
        submit(false);
    }
})
init();