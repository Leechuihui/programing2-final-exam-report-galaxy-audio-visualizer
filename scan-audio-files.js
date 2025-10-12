#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 音频文件扫描器
 * 扫描assets文件夹中的所有.mp3文件并生成配置文件
 */

const ASSETS_DIR = './assets';
const CONFIG_FILE = './audio-files.json';

function scanAudioFiles() {
    try {
        console.log('🔍 Scanning audio files...');

        // Check if assets folder exists
        if (!fs.existsSync(ASSETS_DIR)) {
            console.error(`❌ Error: ${ASSETS_DIR} folder does not exist`);
            return;
        }

        // Read all files in assets folder
        const files = fs.readdirSync(ASSETS_DIR);

        // Filter out .mp3 files
        const audioFiles = files
            .filter(file => file.toLowerCase().endsWith('.mp3'))
            .map(file => {
                const filePath = path.join(ASSETS_DIR, file);
                const stats = fs.statSync(filePath);

                return {
                    name: file,
                    path: `assets/${file}`,
                    size: stats.size,
                    sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
                    modified: stats.mtime.toISOString()
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        // Generate config file
        const config = {
            lastUpdated: new Date().toISOString(),
            totalFiles: audioFiles.length,
            totalSizeMB: audioFiles.reduce((sum, file) => sum + parseFloat(file.sizeMB), 0).toFixed(2),
            files: audioFiles
        };

        // Write config file
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

        console.log('✅ Scan completed!');
        console.log(`📁 Found ${audioFiles.length} audio files`);
        console.log(`💾 Total size: ${config.totalSizeMB} MB`);
        console.log(`📄 Config file saved to: ${CONFIG_FILE}`);

        // Display file list
        console.log('\n🎵 Audio file list:');
        audioFiles.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file.name} (${file.sizeMB} MB)`);
        });

    } catch (error) {
        console.error('❌ Error occurred during scanning:', error.message);
    }
}

// Generate HTML playlist fragment
function generatePlaylistHTML(audioFiles) {
    const html = audioFiles.map((file, index) => {
        const displayName = file.name.length > 30 ?
            file.name.substring(0, 27) + '...' :
            file.name;
        return `      <div class="playlist-item${index === 0 ? ' active' : ''}" data-index="${index}" title="${file.name}">${displayName}</div>`;
    }).join('\n');

    console.log('\n📋 HTML playlist code:');
    console.log(html);
}

// Main function
function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🎵 Audio File Scanner

Usage:
  node scan-audio-files.js          # Scan files and generate config
  node scan-audio-files.js --html   # Also generate HTML playlist code
  node scan-audio-files.js --help   # Show help information

Features:
  - Automatically scan .mp3 files in assets folder
  - Generate audio-files.json config file
  - Optionally generate HTML playlist code
        `);
        return;
    }

    scanAudioFiles();

    if (args.includes('--html')) {
        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            generatePlaylistHTML(config.files);
        } catch (error) {
            console.error('❌ Failed to read config file:', error.message);
        }
    }
}

if (require.main === module) {
    main();
}

module.exports = { scanAudioFiles, generatePlaylistHTML };
