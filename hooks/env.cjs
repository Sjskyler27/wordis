const fs = require('fs');
const path = require('path');

const readEnvValue = (key) => {
  if (process.env[key] != null) {
    return process.env[key];
  }

  try {
    const envPath = path.resolve(__dirname, '../.env');
    const envContents = fs.readFileSync(envPath, 'utf8');
    const match = envContents.match(new RegExp(`^${key}=(.*)$`, 'm'));
    if (!match) {
      return undefined;
    }

    return match[1].trim().replace(/^['"]|['"]$/g, '');
  } catch (error) {
    return undefined;
  }
};

const isTestingMode = readEnvValue('VITE_TESTING') === 't';

module.exports = {
  isTestingMode
};
