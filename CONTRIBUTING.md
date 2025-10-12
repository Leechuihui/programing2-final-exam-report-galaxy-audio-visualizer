# Contributing to Galaxy Audio Visualizer Player

Thank you for your interest in contributing to the Galaxy Audio Visualizer Player! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Bugs
- Use the GitHub issue tracker
- Include detailed reproduction steps
- Provide browser version and system information
- Attach screenshots if applicable

### Suggesting Features
- Check existing issues first
- Provide clear use cases and benefits
- Consider implementation complexity
- Be open to discussion and feedback

### Code Contributions
- Fork the repository
- Create a feature branch
- Make your changes
- Test thoroughly
- Submit a pull request

## 🛠️ Development Setup

### Prerequisites
- Node.js (v14 or higher)
- Modern web browser
- Git

### Local Development
```bash
# Clone your fork
git clone https://github.com/your-username/galaxy-audio-visualizer.git
cd galaxy-audio-visualizer

# Add upstream remote
git remote add upstream https://github.com/original-owner/galaxy-audio-visualizer.git

# Start development server
python -m http.server 8000
# or
npx serve .
```

### Testing Your Changes
1. Test in multiple browsers (Chrome, Firefox, Safari, Edge)
2. Test on different screen sizes
3. Test with various audio files
4. Check console for errors
5. Verify keyboard shortcuts work

## 📝 Code Style Guidelines

### JavaScript
- Use ES6+ features
- Follow consistent naming conventions
- Add comments for complex logic
- Use meaningful variable names
- Keep functions focused and small

```javascript
// Good
function calculateAudioLevel(spectrum) {
    // Calculate RMS audio level from frequency spectrum
    const sum = spectrum.reduce((acc, val) => acc + val * val, 0);
    return Math.sqrt(sum / spectrum.length);
}

// Avoid
function calc(a) {
    return Math.sqrt(a.reduce((b, c) => b + c * c, 0) / a.length);
}
```

### CSS
- Use consistent indentation (2 spaces)
- Group related properties
- Use meaningful class names
- Follow BEM methodology when appropriate
- Use CSS custom properties for theming

```css
/* Good */
.visualization-container {
    position: relative;
    width: 100%;
    height: 100vh;
    background: var(--primary-bg);
    overflow: hidden;
}

.visualization-container__canvas {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
}
```

### HTML
- Use semantic HTML5 elements
- Include proper accessibility attributes
- Keep structure clean and logical
- Use consistent indentation

```html
<!-- Good -->
<main class="audio-player" role="main">
    <section class="visualization-area" aria-label="Audio visualization">
        <canvas id="visualization-canvas" 
                role="img" 
                aria-label="Real-time audio visualization">
        </canvas>
    </section>
</main>
```

## 🧪 Testing Guidelines

### Manual Testing Checklist
- [ ] Audio playback works correctly
- [ ] All visualization modes function
- [ ] Equalizer controls respond properly
- [ ] Keyboard shortcuts work
- [ ] Mobile responsiveness
- [ ] Error handling works
- [ ] Performance is acceptable

### Browser Testing
Test on the following browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

### Performance Testing
- Monitor frame rate (should maintain 60 FPS)
- Check memory usage
- Test with large audio files
- Verify smooth animations

## 📋 Pull Request Process

### Before Submitting
1. **Fork and clone** the repository
2. **Create a feature branch** from `main`
3. **Make your changes** following the style guidelines
4. **Test thoroughly** on multiple browsers
5. **Update documentation** if needed
6. **Commit with clear messages**

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Tested on Safari
- [ ] Tested on mobile
- [ ] Performance tested

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

### Review Process
1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** by maintainers
4. **Approval** and merge

## 🎯 Areas for Contribution

### High Priority
- **Performance optimization**
- **Mobile experience improvements**
- **Accessibility enhancements**
- **New visualization modes**
- **Audio processing features**

### Medium Priority
- **UI/UX improvements**
- **Documentation updates**
- **Code refactoring**
- **Test coverage**
- **Error handling**

### Low Priority
- **Code style improvements**
- **Comment additions**
- **Minor bug fixes**
- **Feature requests**

## 🐛 Bug Reports

### Required Information
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 10, macOS 11, Ubuntu 20.04]
- Browser: [e.g. Chrome 91, Firefox 89, Safari 14]
- Version: [e.g. 1.2.0]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Required Information
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## 📚 Documentation

### Code Documentation
- Comment complex algorithms
- Document function parameters and return values
- Explain non-obvious code decisions
- Keep comments up to date

### User Documentation
- Update README.md for new features
- Add usage examples
- Document configuration options
- Include troubleshooting guides

## 🔒 Security

### Security Guidelines
- Don't commit sensitive information
- Validate all user inputs
- Use secure coding practices
- Report security vulnerabilities privately

### Reporting Security Issues
Email security issues to: security@example.com
- Don't create public issues for security problems
- Include detailed reproduction steps
- Allow time for response before disclosure

## 🏷️ Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version number updated
- [ ] Changelog updated
- [ ] Release notes prepared

## 🤔 Questions?

### Getting Help
- Check existing issues and discussions
- Join our community discussions
- Contact maintainers directly
- Read the documentation thoroughly

### Community Guidelines
- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and experience
- Follow the code of conduct

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Galaxy Audio Visualizer Player! 🎵✨
