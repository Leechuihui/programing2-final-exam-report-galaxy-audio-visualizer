#!/bin/bash

# Create Video Thumbnail Script
# 创建视频缩略图脚本

echo "🖼️  Galaxy Audio Visualizer - Video Thumbnail Creator"
echo "=================================================="

# Check if video file exists
if [ ! -f "media/demo-videos/demo1.mov" ]; then
    echo "❌ 视频文件不存在: media/demo-videos/demo1.mov"
    exit 1
fi

echo "📹 视频文件信息:"
echo "   文件: media/demo-videos/demo1.mov"
echo "   大小: $(du -h media/demo-videos/demo1.mov | cut -f1)"

# Create thumbnails directory
mkdir -p media/thumbnails

echo ""
echo "🖼️  创建视频缩略图..."

# Check if ffmpeg is available
if command -v ffmpeg &> /dev/null; then
    echo "✅ 找到 ffmpeg，正在创建缩略图..."
    
    # Create thumbnail at 5 seconds
    ffmpeg -i media/demo-videos/demo1.mov -ss 00:00:05 -vframes 1 -q:v 2 media/thumbnails/video-thumbnail.jpg 2>/dev/null
    
    if [ -f "media/thumbnails/video-thumbnail.jpg" ]; then
        echo "✅ 缩略图创建成功: media/thumbnails/video-thumbnail.jpg"
        echo "   大小: $(du -h media/thumbnails/video-thumbnail.jpg | cut -f1)"
    else
        echo "❌ 缩略图创建失败"
    fi
else
    echo "⚠️  未找到 ffmpeg，使用占位符图片"
    
    # Create a placeholder thumbnail using ImageMagick or simple text
    if command -v convert &> /dev/null; then
        echo "✅ 找到 ImageMagick，创建占位符..."
        convert -size 800x450 xc:black -fill white -pointsize 48 -gravity center -annotate +0+0 "🎬 Demo Video\nGalaxy Audio Visualizer" media/thumbnails/video-thumbnail.jpg
    else
        echo "📝 创建简单的占位符文件..."
        echo "Video Thumbnail Placeholder" > media/thumbnails/video-thumbnail.txt
    fi
fi

echo ""
echo "📋 缩略图使用说明:"
echo "================"
echo "1. 缩略图已保存到: media/thumbnails/video-thumbnail.jpg"
echo "2. 可以在README.md中使用缩略图链接到视频"
echo "3. 格式: [![Video Thumbnail](media/thumbnails/video-thumbnail.jpg)](media/demo-videos/demo1.mov)"
echo ""

# Show current thumbnails
if [ -d "media/thumbnails" ]; then
    echo "📁 当前缩略图文件:"
    ls -la media/thumbnails/
fi

echo ""
echo "🎉 缩略图创建完成！"
