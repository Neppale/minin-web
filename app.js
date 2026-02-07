const CONFIG = {
    healthcheckEndpoint: window.ENV_CONFIG?.MININ_URL ? `${window.ENV_CONFIG?.MININ_URL}/version` : '',
    postEndpoint: window.ENV_CONFIG?.MININ_URL || '',
    githubUrl: 'https://github.com'
};

const TERMINAL_THEME = {
    background: '#c0c0c0',
    foreground: '#000000',
    cursor: '#000000',
    cursorAccent: '#c0c0c0',
    selection: 'rgba(0, 0, 0, 0.3)'
};

const TERMINAL_CONFIG = {
    fontSize: 14,
    fontFamily: 'Courier New, monospace',
    cursorBlink: true,
    cursorStyle: 'block',
    allowTransparency: true
};

const terminal = new Terminal({
    theme: TERMINAL_THEME,
    ...TERMINAL_CONFIG
});

const fitAddon = new FitAddon.FitAddon();
terminal.loadAddon(fitAddon);

const HEALTHCHECK_STATUS = {
    CHECKING: 'checking',
    OK: 'ok',
    FAIL: 'fail'
};

const LINK_INDICES = {
    ABOUT: 0,
    DONATION: 1,
    EXPIRATION: 2
};

const KEY_CODES = {
    ENTER: '\r',
    BACKSPACE: '\x7f',
    BACKSPACE_ALT: '\b',
    CTRL_C: '\x03',
    ARROW_UP_VT100: '\x1b[A',
    ARROW_UP_APP: '\x1bOA',
    ARROW_DOWN_VT100: '\x1b[B',
    ARROW_DOWN_APP: '\x1bOB'
};

const ARROW_UP_CODES = [KEY_CODES.ARROW_UP_VT100, KEY_CODES.ARROW_UP_APP];
const ARROW_DOWN_CODES = [KEY_CODES.ARROW_DOWN_VT100, KEY_CODES.ARROW_DOWN_APP];

const NAVIGATION_DIRECTIONS = {
    UP: 'up',
    DOWN: 'down'
};

const ASCII_ART = [
    '',
    '',
    ' ▄    ▄   ▀             ▀                    ▀          ',
    ' ██  ██ ▄▄▄    ▄ ▄▄   ▄▄▄    ▄ ▄▄          ▄▄▄    ▄ ▄▄  ',
    ' █ ██ █   █    █▀  █    █    █▀  █           █    █▀  █ ',
    ' █ ▀▀ █   █    █   █    █    █   █           █    █   █ ',
    ' █    █ ▄▄█▄▄  █   █  ▄▄█▄▄  █   █    █    ▄▄█▄▄  █   █ ',
    '',
    ''
];

terminal.open(document.getElementById('terminal-container'));
fitAddon.fit();

window.addEventListener('resize', () => {
    fitAddon.fit();
});

let currentInput = '';
let expirationDate = null;
let healthcheckStatus = HEALTHCHECK_STATUS.CHECKING;
let serviceVersion = null;
let inputEnabled = true;
let selectedLinkIndex = -1;
let isLinkNavigationMode = false;

const links = [
    { id: 'about', text: 'About Minin.in', action: () => window.open(CONFIG.githubUrl, '_blank') },
    { id: 'donation', text: 'donating any amount', action: () => {} },
    { id: 'expiration', text: 'Expiration date', action: () => {
        const datepicker = document.getElementById('datepicker');
        if (datepicker && typeof datepicker.showPicker === 'function') {
            datepicker.showPicker();
        } else {
            datepicker.focus();
            datepicker.click();
        }
    }}
];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const EXPIRATION_MONTHS_DEFAULT = 6;
const HEALTHCHECK_DELAY_MS = 500;

const ESC = '\x1b';
const ANSI_CODES = {
    BOLD: `${ESC}[1m`,
    UNDERLINE: `${ESC}[4m`,
    RESET: `${ESC}[0m`,
    REVERSE: `${ESC}[7m`,
    REVERSE_RESET: `${ESC}[27m`,
    CURSOR_HIDE: `${ESC}[?25l`,
    CURSOR_SHOW: `${ESC}[?25h`
};

function getDefaultExpirationDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + EXPIRATION_MONTHS_DEFAULT);
    return date;
}

function formatDate(date) {
    return `${MONTHS[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
}

expirationDate = getDefaultExpirationDate();

function getHighlightCodes(linkIndex) {
    const isSelected = selectedLinkIndex === linkIndex && isLinkNavigationMode;
    return {
        start: isSelected ? ANSI_CODES.REVERSE : '',
        end: isSelected ? ANSI_CODES.REVERSE_RESET : ''
    };
}

function renderContent() {
    terminal.clear();
    currentInput = '';
    
    ASCII_ART.forEach(line => terminal.writeln(line));
    
    const aboutHighlight = getHighlightCodes(LINK_INDICES.ABOUT);
    terminal.writeln(`${aboutHighlight.start}${ANSI_CODES.UNDERLINE}About Minin.in${ANSI_CODES.RESET}${aboutHighlight.end}`);
    terminal.writeln('You can navigate through links using your arrow keys (Up ↑ and Down ↓)');
    terminal.writeln('');
    
    if (healthcheckStatus === HEALTHCHECK_STATUS.CHECKING) {
        terminal.writeln('Checking service status...');
    } else if (healthcheckStatus === HEALTHCHECK_STATUS.OK) {
        terminal.writeln('Checking service status...OK');
        terminal.writeln(`Running Minin.in v${serviceVersion}`);
    } else if (healthcheckStatus === HEALTHCHECK_STATUS.FAIL) {
        terminal.writeln('Checking service status...FAIL');
        terminal.writeln('The Minin.in service is currently unavailable. Check again later.');
    }
    terminal.writeln('');
    
    if (healthcheckStatus === HEALTHCHECK_STATUS.OK) {
        terminal.writeln('Insert URL and press ENTER to minify!');
        terminal.writeln('');
        
        terminal.write('You can unlock expiration dates longer than 6 months');
        terminal.writeln('');
        terminal.write('by ');
        
        const donationHighlight = getHighlightCodes(LINK_INDICES.DONATION);
        terminal.write(`${donationHighlight.start}${ANSI_CODES.UNDERLINE}donating any amount${ANSI_CODES.RESET}${donationHighlight.end}.`);
        terminal.writeln('');
        terminal.writeln('');
        
        const formattedDate = formatDate(expirationDate);
        const expirationHighlight = getHighlightCodes(LINK_INDICES.EXPIRATION);
        terminal.write(`${expirationHighlight.start}${ANSI_CODES.UNDERLINE}Expiration date: ${formattedDate}${ANSI_CODES.RESET}${expirationHighlight.end}`);
        terminal.writeln('');
        terminal.writeln('');
        
        if (inputEnabled && !isLinkNavigationMode) {
            terminal.write('> ');
            terminal.write(ANSI_CODES.CURSOR_SHOW);
        } else if (isLinkNavigationMode) {
            terminal.write(ANSI_CODES.CURSOR_HIDE);
        }
    } else {
        if (!isLinkNavigationMode) {
            terminal.write(ANSI_CODES.CURSOR_SHOW);
        } else {
            terminal.write(ANSI_CODES.CURSOR_HIDE);
        }
    }
}

async function performHealthcheck() {
    if (!CONFIG.healthcheckEndpoint) {
        healthcheckStatus = HEALTHCHECK_STATUS.FAIL;
        inputEnabled = false;
        renderContent();
        return;
    }
    
    try {
        const response = await fetch(CONFIG.healthcheckEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.version) {
                healthcheckStatus = HEALTHCHECK_STATUS.OK;
                serviceVersion = data.version;
                inputEnabled = true;
            } else {
                healthcheckStatus = HEALTHCHECK_STATUS.FAIL;
                inputEnabled = false;
            }
        } else {
            healthcheckStatus = HEALTHCHECK_STATUS.FAIL;
            inputEnabled = false;
        }
    } catch (error) {
        console.error('Healthcheck failed:', error);
        healthcheckStatus = HEALTHCHECK_STATUS.FAIL;
        inputEnabled = false;
    }
    
    renderContent();
}

function setupDatepicker() {
    const datepicker = document.getElementById('datepicker');
    const defaultDate = getDefaultExpirationDate();
    datepicker.value = defaultDate.toISOString().split('T')[0];
    
    datepicker.addEventListener('change', (e) => {
        expirationDate = new Date(e.target.value);
        renderContent();
    });
}

function navigateLinks(direction) {
    const availableLinkIndices = [LINK_INDICES.ABOUT];
    if (healthcheckStatus === HEALTHCHECK_STATUS.OK) {
        availableLinkIndices.push(LINK_INDICES.DONATION);
        availableLinkIndices.push(LINK_INDICES.EXPIRATION);
    }
    
    if (availableLinkIndices.length === 0) return;
    
    if (!isLinkNavigationMode) {
        isLinkNavigationMode = true;
        selectedLinkIndex = availableLinkIndices[0];
        terminal.options.cursorBlink = false;
        terminal.write(ANSI_CODES.CURSOR_HIDE);
    } else {
        const currentIndexInAvailable = availableLinkIndices.indexOf(selectedLinkIndex);
        if (currentIndexInAvailable === -1) {
            selectedLinkIndex = availableLinkIndices[0];
        } else {
            if (direction === NAVIGATION_DIRECTIONS.UP) {
                const newIndex = (currentIndexInAvailable - 1 + availableLinkIndices.length) % availableLinkIndices.length;
                selectedLinkIndex = availableLinkIndices[newIndex];
            } else if (direction === NAVIGATION_DIRECTIONS.DOWN) {
                const newIndex = (currentIndexInAvailable + 1) % availableLinkIndices.length;
                selectedLinkIndex = availableLinkIndices[newIndex];
            }
        }
    }
    
    renderContent();
}

function exitLinkNavigationMode() {
    isLinkNavigationMode = false;
    selectedLinkIndex = -1;
    terminal.options.cursorBlink = true;
    terminal.write(ANSI_CODES.CURSOR_SHOW);
}

function executeSelectedLink() {
    if (!isLinkNavigationMode || selectedLinkIndex < 0 || selectedLinkIndex >= links.length) {
        return;
    }
    
    const link = links[selectedLinkIndex];
    if (link && link.action) {
        link.action();
    }
    
    exitLinkNavigationMode();
    renderContent();
}

function isValidUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

function setupTerminalInput() {
    terminal.onData((data) => {
        const allowInput = inputEnabled && healthcheckStatus === HEALTHCHECK_STATUS.OK;
        
        if (ARROW_UP_CODES.includes(data)) {
            navigateLinks(NAVIGATION_DIRECTIONS.UP);
            return;
        } else if (ARROW_DOWN_CODES.includes(data)) {
            navigateLinks(NAVIGATION_DIRECTIONS.DOWN);
            return;
        }
        
        if (data === KEY_CODES.ENTER) {
            if (isLinkNavigationMode) {
                executeSelectedLink();
                return;
            }
            
            if (!allowInput) {
                return;
            }
            
            if (currentInput.trim()) {
                const url = currentInput.trim();
                
                if (!isValidUrl(url)) {
                    alert('Invalid URL format. Please enter a valid HTTP or HTTPS URL.');
                    currentInput = '';
                    exitLinkNavigationMode();
                    renderContent();
                    return;
                }
                
                if (CONFIG.postEndpoint) {
                    fetch(CONFIG.postEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ url: url })
                    })
                    .then(response => {
                        console.log('Request status:', response.status);
                        return response.text().then(text => {
                            try {
                                const json = JSON.parse(text);
                                console.log('Response:', json);
                            } catch (e) {
                                console.log('Response:', text);
                            }
                        });
                    })
                    .catch(error => {
                        console.error('Request failed:', error);
                        console.log('Request status: Error');
                        console.log('Response:', error.message);
                    });
                } else {
                    console.log('Request status: No endpoint configured');
                    console.log('Response: POST endpoint not set');
                }
                
                currentInput = '';
                exitLinkNavigationMode();
                renderContent();
            } else {
                exitLinkNavigationMode();
                renderContent();
            }
        } else if (data === KEY_CODES.BACKSPACE || data === KEY_CODES.BACKSPACE_ALT) {
            if (isLinkNavigationMode) {
                exitLinkNavigationMode();
                renderContent();
                return;
            }
            
            if (!allowInput) {
                return;
            }
            
            if (currentInput.length > 0) {
                currentInput = currentInput.slice(0, -1);
                terminal.write('\b \b');
            }
        } else if (data === KEY_CODES.CTRL_C) {
            currentInput = '';
            exitLinkNavigationMode();
            if (allowInput) {
                terminal.write('^C\r\n> ');
            } else {
                renderContent();
            }
        } else if (data >= ' ') {
            if (!allowInput) {
                return;
            }
            
            if (isLinkNavigationMode) {
                exitLinkNavigationMode();
                currentInput = data;
                terminal.write('\r\n> ' + data);
            } else {
                currentInput += data;
                terminal.write(data);
            }
        }
    });
}

async function init() {
    setupDatepicker();
    setupTerminalInput();
    
    healthcheckStatus = HEALTHCHECK_STATUS.CHECKING;
    inputEnabled = false;
    renderContent();
    
    await new Promise(resolve => setTimeout(resolve, HEALTHCHECK_DELAY_MS));
    await performHealthcheck();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
