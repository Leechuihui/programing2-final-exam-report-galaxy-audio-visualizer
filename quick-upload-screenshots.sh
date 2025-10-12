#!/bin/bash

# Quick Screenshot Upload Script
# 快速截屏上传脚本

echo "📸 快速截屏上传工具"
echo "=================="

# 检查截屏目录
if [ ! -d "media/screenshots" ]; then
    echo "❌ 截屏目录不存在，正在创建..."
    mkdir -p media/screenshots
fi

echo "📁 当前截屏目录: $(pwd)/media/screenshots/"
echo ""

# 显示当前截屏文件
echo "📸 当前截屏文件:"
if [ "$(ls -A media/screenshots/ 2>/dev/null)" ]; then
    ls -la media/screenshots/
else
    echo "   (目录为空)"
fi

echo ""
echo "📋 上传步骤:"
echo "==========="
echo "1. 将你的截屏文件复制到 media/screenshots/ 目录"
echo "2. 重命名为标准名称（可选）:"
echo "   - main-interface.png (主界面)"
echo "   - loading-screen.png (加载界面)"
echo "   - solar-system-view.png (太阳系视图)"
echo "   - advanced-controls.png (高级控制面板)"
echo "3. 运行此脚本上传"
echo ""

# 检查是否有截屏文件
if [ ! "$(ls -A media/screenshots/ 2>/dev/null)" ]; then
    echo "⚠️  没有找到截屏文件"
    echo ""
    echo "请先将截屏文件复制到 media/screenshots/ 目录，然后重新运行此脚本"
    echo ""
    echo "示例命令:"
    echo "cp ~/Desktop/截屏*.png media/screenshots/"
    echo "cp ~/Downloads/截屏*.png media/screenshots/"
    exit 1
fi

# 显示文件信息
echo "📊 截屏文件信息:"
TOTAL_FILES=$(ls -1 media/screenshots/ | wc -l)
TOTAL_SIZE=$(du -sh media/screenshots/ | cut -f1)

echo "   文件数量: $TOTAL_FILES"
echo "   总大小: $TOTAL_SIZE"
echo ""

# 显示文件列表
echo "📁 文件列表:"
for file in media/screenshots/*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        filesize=$(du -h "$file" | cut -f1)
        echo "   $filename: $filesize"
    fi
done

echo ""
read -p "确认上传这些截屏到GitHub? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 上传已取消"
    exit 1
fi

# 添加文件到Git
echo "📝 添加截屏文件到Git..."
git add media/screenshots/

# 创建提交
echo "💾 创建提交..."
git commit -m "Add project screenshots

- Added $TOTAL_FILES screenshot(s) showing project features
- Total size: $TOTAL_SIZE
- Includes main interface, loading screen, solar system view, and advanced controls"

# 推送到GitHub
echo "🚀 推送到GitHub..."
git push

echo ""
echo "✅ 截屏上传成功!"
echo "🔗 查看地址: https://github.com/Leechuihui/programing2-final-exam-report-galaxy-audio-visualizer/tree/main/media/screenshots"
echo ""
echo "📋 下一步:"
echo "1. 截屏将自动显示在README.md中"
echo "2. 可以访问GitHub仓库查看截屏"
echo "3. 分享给其他人查看你的项目"
echo ""
echo "🎉 你的项目截屏现在已经在线了!"
