const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(frontendDir, 'package.json');
const outputPath = path.join(frontendDir, 'src', 'buildMeta.js');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const buildMeta = {
  version: packageJson.version,
  buildTime: new Date().toISOString(),
};

const fileContents = `const buildMeta = ${JSON.stringify(buildMeta, null, 2)};

export default buildMeta;
`;

fs.writeFileSync(outputPath, fileContents, 'utf8');
console.log(`Wrote build metadata to ${outputPath}`);
