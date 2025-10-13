#!/bin/bash

# Video Status Check Script
# 视频状态检查脚本

echo "📺 Galaxy Audio Visualizer - Video Status Check"
echo "=============================================="

# 检查本地视频文件
echo "📁 本地视频文件检查:"
if [ -f "media/demo-videos/demo1.mov" ]; then
    echo "✅ 视频文件存在: media/demo-videos/demo1.mov"
    echo "   大小: $(du -h media/demo-videos/demo1.mov | cut -f1)"
    echo "   修改时间: $(stat -f "%Sm" media/demo-videos/demo1.mov 2>/dev/null || stat -c "%y" media/demo-videos/demo1.mov 2>/dev/null)"
else
    echo "❌ 视频文件不存在"
    exit 1
fi

echo ""

# 检查Git状态
echo "📝 Git状态检查:"
if git ls-files | grep -q "demo1.mov"; then
    echo "✅ 视频文件已添加到Git"
else
    echo "❌ 视频文件未添加到Git"
fi

# 检查提交状态
if git status --porcelain | grep -q "demo1.mov"; then
    echo "⚠️  视频文件有未提交的更改"
else
    echo "✅ 视频文件已提交"
fi

echo ""

# 检查README链接
echo "📖 README.md检查:"
if grep -q "demo1.mov" README.md; then
    echo "✅ README.md包含视频链接"
else
    echo "❌ README.md缺少视频链接"
fi

echo ""

# 显示访问链接
echo "🔗 视频访问链接:"
echo "=================="
echo "GitHub仓库: https://github.com/Leechuihui/programing2-final-exam-report-galaxy-audio-visualizer"
echo "视频文件: https://github.com/Leechuihui/programing2-final-exam-report-galaxy-audio-visualizer/blob/main/media/demo-videos/demo1.mov"
echo "视频目录: https://github.com/Leechuihui/programing2-final-exam-report-galaxy-audio-visualizer/tree/main/media/demo-videos"
echo ""

# 检查网络连接
echo "🌐 网络连接检查:"
if ping -c 1 github.com > /dev/null 2>&1; then
    echo "✅ GitHub连接正常"
else
    echo "❌ 无法连接到GitHub"
fi

echo ""

# 显示观看指南
echo "📺 观看指南:"
echo "============"
echo "1. 访问GitHub仓库链接"
echo "2. 点击 media/demo-videos/demo1.mov 文件"
echo "3. GitHub会自动显示视频播放器"
echo "4. 点击播放按钮观看"
echo ""

# 显示视频信息
echo "📊 视频信息:"
echo "============"
echo "文件名: demo1.mov"
echo "大小: 9.8MB"
echo "格式: MOV (H.264)"
echo "内容: Galaxy Audio Visualizer 项目演示"
echo ""

echo "🎉 视频上传状态检查完成！"
echo "现在你可以通过上面的链接观看你的演示视频了！"
