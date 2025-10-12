#!/bin/bash

# Galaxy Audio Visualizer Player - Video Upload Script
# This script helps upload demo videos to the GitHub repository

echo "🎥 Galaxy Audio Visualizer Player - Video Upload"
echo "================================================"

# Check if video file is provided
if [ $# -eq 0 ]; then
    echo "❌ Please provide a video file path"
    echo "Usage: ./upload-video.sh <video-file> [description]"
    echo "Example: ./upload-video.sh demo.mp4 'Project overview demonstration'"
    exit 1
fi

VIDEO_FILE="$1"
DESCRIPTION="${2:-Demo video}"

# Check if video file exists
if [ ! -f "$VIDEO_FILE" ]; then
    echo "❌ Video file not found: $VIDEO_FILE"
    exit 1
fi

# Get file information
FILE_SIZE=$(du -h "$VIDEO_FILE" | cut -f1)
FILE_NAME=$(basename "$VIDEO_FILE")

echo "📹 Video Information:"
echo "   File: $FILE_NAME"
echo "   Size: $FILE_SIZE"
echo "   Description: $DESCRIPTION"

# Check file size (GitHub limit is 100MB)
FILE_SIZE_BYTES=$(stat -f%z "$VIDEO_FILE" 2>/dev/null || stat -c%s "$VIDEO_FILE" 2>/dev/null)
MAX_SIZE=$((100 * 1024 * 1024)) # 100MB in bytes

if [ "$FILE_SIZE_BYTES" -gt "$MAX_SIZE" ]; then
    echo "⚠️  Warning: File size ($FILE_SIZE) exceeds GitHub's recommended 100MB limit"
    echo "   Consider compressing the video or using external hosting"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Upload cancelled"
        exit 1
    fi
fi

# Create media directory if it doesn't exist
mkdir -p media/demo-videos

# Copy video to media directory
echo "📁 Copying video to media directory..."
cp "$VIDEO_FILE" "media/demo-videos/$FILE_NAME"

# Add to git
echo "📝 Adding video to Git..."
git add "media/demo-videos/$FILE_NAME"

# Create commit
echo "💾 Creating commit..."
git commit -m "Add demo video: $DESCRIPTION

- File: $FILE_NAME
- Size: $FILE_SIZE
- Description: $DESCRIPTION"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push

echo ""
echo "✅ Video uploaded successfully!"
echo "🔗 View at: https://github.com/Leechuihui/programing2-final-exam-report-galaxy-audio-visualizer/blob/main/media/demo-videos/$FILE_NAME"
echo ""
echo "📋 Next steps:"
echo "1. Update README.md to include video link"
echo "2. Add video description to media/README.md"
echo "3. Consider creating a thumbnail image"
echo ""
echo "🎉 Your demo video is now live on GitHub!"
