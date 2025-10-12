#!/bin/bash

# Galaxy Audio Visualizer Player - GitHub Setup Script
# This script helps set up the GitHub repository for the project

echo "🌌 Galaxy Audio Visualizer Player - GitHub Setup"
echo "================================================"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Add all files to git
echo "📝 Adding files to Git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Galaxy Audio Visualizer Player v1.0.0

- Complete audio visualization system with 4 modes
- Professional equalizer with 10-band control
- Dynamic playlist with auto-detection
- Responsive design for all devices
- Modern UI with glassmorphism effects
- Comprehensive documentation and setup guides"

echo "✅ Initial commit created"

# Display repository status
echo ""
echo "📊 Repository Status:"
echo "===================="
git status --short

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Create a new repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Repository name: galaxy-audio-visualizer"
echo "   - Description: Professional audio visualization player with real-time analysis"
echo "   - Make it public"
echo "   - Don't initialize with README (we already have one)"
echo ""
echo "2. Add the remote origin:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/galaxy-audio-visualizer.git"
echo ""
echo "3. Push to GitHub:"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "4. Enable GitHub Pages:"
echo "   - Go to repository Settings > Pages"
echo "   - Source: Deploy from a branch"
echo "   - Branch: main"
echo "   - Folder: / (root)"
echo ""
echo "5. Update README.md:"
echo "   - Replace 'your-username' with your actual GitHub username"
echo "   - Update the live demo URL"
echo "   - Update contact information"
echo ""
echo "🎉 Your project will be live at:"
echo "   https://YOUR_USERNAME.github.io/galaxy-audio-visualizer/"
echo ""
echo "📚 Documentation created:"
echo "   ✅ README.md - Comprehensive project overview"
echo "   ✅ CONTRIBUTING.md - Development guidelines"
echo "   ✅ LICENSE - MIT License"
echo "   ✅ CHANGELOG.md - Version history"
echo "   ✅ PROJECT_SUMMARY.md - Detailed project summary"
echo "   ✅ .github/workflows/deploy.yml - GitHub Actions"
echo "   ✅ .gitignore - Git ignore rules"
echo "   ✅ package.json - Project configuration"
echo ""
echo "🚀 Ready to publish to GitHub!"
