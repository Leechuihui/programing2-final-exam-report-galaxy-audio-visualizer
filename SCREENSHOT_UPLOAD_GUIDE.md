# 📸 截屏上传指南

## 🎯 快速上传步骤

### 步骤1：准备截屏文件
将你的截屏文件重命名并放到 `media/screenshots/` 目录中：

```
media/screenshots/
├── main-interface.png          # 主界面截屏
├── loading-screen.png          # 加载界面截屏
├── solar-system-view.png       # 太阳系视图截屏
├── advanced-controls.png       # 高级控制面板截屏
├── particle-mode.png           # 粒子模式截屏
├── spectrum-mode.png           # 频谱模式截屏
├── waveform-mode.png           # 波形模式截屏
├── needle-mode.png             # 针状图模式截屏
├── equalizer.png               # 均衡器界面截屏
├── mobile-view.png             # 移动端视图截屏
└── playlist.png                # 播放列表截屏
```

### 步骤2：上传到GitHub

#### 方法1：使用上传脚本（推荐）
```bash
# 将所有截屏文件复制到 media/screenshots/ 目录后
./upload-screenshots.sh
```

#### 方法2：手动上传
```bash
# 添加截屏文件
git add media/screenshots/

# 提交更改
git commit -m "Add project screenshots

- Main interface and loading screen
- Solar system visualization view
- Advanced controls panel
- All visualization modes
- Responsive design examples"

# 推送到GitHub
git push
```

#### 方法3：通过GitHub网页界面
1. 访问你的仓库：https://github.com/Leechuihui/programing2-final-exam-report-galaxy-audio-visualizer
2. 点击 "Add file" → "Upload files"
3. 拖拽截屏文件到 `media/screenshots/` 目录
4. 提交更改

## 📋 推荐的截屏文件

基于你的项目，建议上传以下截屏：

### 必须上传的截屏：
1. **main-interface.png** - 主界面（太阳系视图）
2. **loading-screen.png** - 加载界面
3. **advanced-controls.png** - 高级控制面板
4. **solar-system-view.png** - 太阳系可视化

### 可选截屏：
5. **particle-mode.png** - 粒子模式
6. **spectrum-mode.png** - 频谱模式
7. **waveform-mode.png** - 波形模式
8. **needle-mode.png** - 针状图模式
9. **equalizer.png** - 均衡器界面
10. **mobile-view.png** - 移动端视图

## 🎨 截屏要求

- **格式**: PNG 或 JPG
- **分辨率**: 1920x1080 或更高
- **质量**: 高清，清晰可见
- **文件大小**: 每个小于5MB
- **命名**: 使用英文，用连字符分隔

## 🚀 快速开始

1. **将截屏文件复制到项目目录**：
   ```bash
   cp ~/Desktop/your-screenshots/*.png media/screenshots/
   ```

2. **重命名为标准名称**：
   ```bash
   cd media/screenshots/
   mv "截屏1.png" "main-interface.png"
   mv "截屏2.png" "loading-screen.png"
   mv "截屏3.png" "advanced-controls.png"
   mv "截屏4.png" "solar-system-view.png"
   ```

3. **上传到GitHub**：
   ```bash
   ./upload-screenshots.sh
   ```

## 📸 截屏展示

上传后，这些截屏将自动显示在README.md中：

```markdown
## 📸 Screenshots

<div align="center">
  <img src="media/screenshots/main-interface.png" alt="Main Interface" width="400"/>
  <img src="media/screenshots/loading-screen.png" alt="Loading Screen" width="400"/>
</div>

<div align="center">
  <img src="media/screenshots/solar-system-view.png" alt="Solar System View" width="400"/>
  <img src="media/screenshots/advanced-controls.png" alt="Advanced Controls" width="400"/>
</div>
```

---

**现在就开始上传你的截屏吧！** 📸✨