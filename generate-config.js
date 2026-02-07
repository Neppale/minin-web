const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const configPath = path.join(__dirname, 'config.js');

const envVars = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const equalIndex = trimmed.indexOf('=');
            if (equalIndex > 0) {
                const key = trimmed.substring(0, equalIndex).trim();
                const value = trimmed.substring(equalIndex + 1).trim();
                if (key && value !== undefined) {
                    envVars[key] = value;
                }
            }
        }
    }
}

const configObject = {
    ...envVars
};

const configEntries = Object.entries(configObject)
    .map(([key, value]) => `    ${key}: ${JSON.stringify(value)}`)
    .join(',\n');

const configContent = `window.ENV_CONFIG = {
${configEntries}
};
`;

fs.writeFileSync(configPath, configContent, 'utf8');
console.log('Config file generated successfully');
