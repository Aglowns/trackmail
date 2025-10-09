/**
 * Build script for Gmail Add-on
 * Bundles TypeScript files into a single JavaScript file for Apps Script
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

// Build configuration
const buildConfig = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/Code.js',
  target: 'es2019',
  platform: 'neutral',
  banner: {
    js: `/**
 * Job Application Tracker - Gmail Add-on
 * Built: ${new Date().toISOString()}
 */
`,
  },
  external: [],
  minify: false,
  sourcemap: false,
};

async function build() {
  try {
    console.log('Building Gmail Add-on...');
    
    // Ensure dist directory exists
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist', { recursive: true });
    }
    
    // Build with esbuild - use cjs format for simpler output
    const tempConfig = {
      ...buildConfig,
      outfile: 'dist/Code.temp.js',
      format: 'cjs', // CommonJS format
    };
    
    await esbuild.build(tempConfig);
    
    // Read the temp file
    let code = fs.readFileSync('dist/Code.temp.js', 'utf8');
    
    // Remove the banner (we'll add our own)
    code = code.replace(/^\/\*\*[\s\S]*?\*\/\s*/m, '');
    
    // Remove "use strict" if present
    code = code.replace(/^"use strict";\s*/m, '');
    
    // Replace module.exports with global assignments
    code = code.replace(/module\.exports = __toCommonJS\(main_exports\);/g, '');
    
    // Replace __export calls with global assignments
    code = code.replace(/__export\(main_exports, \{\s*([^}]+)\s*\}\);/g, (match, exports) => {
      const assignments = exports.split(',').map(exp => {
        const trimmed = exp.trim();
        if (trimmed.includes(':')) {
          const [name, func] = trimmed.split(':').map(s => s.trim());
          const cleanName = name.replace(/['"]/g, '');
          const cleanFunc = func.replace(/\(\) => /, '').replace(/\s*$/, '');
          return `this.${cleanName} = ${cleanFunc};`;
        }
        return '';
      }).filter(Boolean).join('\n');
      return assignments;
    });
    
    // Remove any remaining require() calls that might cause issues
    code = code.replace(/var \w+ = require\([^)]+\);/g, '');
    
    // Add the banner
    const banner = `/**
 * Job Application Tracker - Gmail Add-on
 * Built: ${new Date().toISOString()}
 */

`;
    
    // Write the final file
    fs.writeFileSync('dist/Code.js', banner + code);
    
    // Delete temp file
    fs.unlinkSync('dist/Code.temp.js');
    
    // Copy appsscript.json to dist
    fs.copyFileSync('appsscript.json', 'dist/appsscript.json');
    
    console.log('✓ Build complete!');
    console.log('  → dist/Code.js');
    console.log('  → dist/appsscript.json');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function watch() {
  console.log('Watching for changes...');
  
  const context = await esbuild.context(buildConfig);
  await context.watch();
  
  // Watch appsscript.json
  fs.watch('appsscript.json', (eventType) => {
    if (eventType === 'change') {
      console.log('appsscript.json changed, copying...');
      fs.copyFileSync('appsscript.json', 'dist/appsscript.json');
    }
  });
  
  console.log('Watching for changes... (Press Ctrl+C to stop)');
}

// Run build or watch
if (isWatch) {
  watch();
} else {
  build();
}

