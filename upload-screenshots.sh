#!/bin/bash

# Galaxy Audio Visualizer Player - Screenshot Upload Script
# This script helps upload screenshots to the GitHub repository

echo "📸 Galaxy Audio Visualizer Player - Screenshot Upload"
echo "===================================================="

# Check if screenshots directory exists
if [ ! -d "media/screenshots" ]; then
    echo "❌ Screenshots directory not found"
    echo "Run ./take-screenshots.sh first to capture screenshots"
    exit 1
fi

# Check if there are any screenshots
if [ ! "$(ls -A media/screenshots/ 2>/dev/null)" ]; then
    echo "❌ No screenshots found in media/screenshots/"
    echo "Please add your screenshots to the media/screenshots/ directory first"
    exit 1
fi

echo "📸 Found screenshots:"
ls -la media/screenshots/

echo ""
echo "📊 Screenshot Information:"
echo "========================="

# Count and show file sizes
TOTAL_FILES=$(ls -1 media/screenshots/ | wc -l)
TOTAL_SIZE=$(du -sh media/screenshots/ | cut -f1)

echo "   Total files: $TOTAL_FILES"
echo "   Total size: $TOTAL_SIZE"

# Check individual file sizes
echo ""
echo "📁 File details:"
for file in media/screenshots/*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        filesize=$(du -h "$file" | cut -f1)
        echo "   $filename: $filesize"
    fi
done

echo ""
read -p "Upload these screenshots to GitHub? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Upload cancelled"
    exit 1
fi

# Add screenshots to git
echo "📝 Adding screenshots to Git..."
git add media/screenshots/

# Create commit
echo "💾 Creating commit..."
git commit -m "Add project screenshots

- Added $TOTAL_FILES screenshot(s) showing project features
- Total size: $TOTAL_SIZE
- Includes main interface, visualization modes, and responsive design"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push

echo ""
echo "✅ Screenshots uploaded successfully!"
echo "🔗 View at: https://github.com/Leechuihui/programing2-final-exam-report-galaxy-audio-visualizer/tree/main/media/screenshots"
echo ""
echo "📋 Next steps:"
echo "1. Update README.md to include screenshot links"
echo "2. Add screenshot descriptions to media/screenshots/README.md"
echo "3. Consider creating a screenshot gallery"
echo ""
echo "🎉 Your project screenshots are now live on GitHub!"
