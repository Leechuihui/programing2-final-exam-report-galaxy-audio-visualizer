/*
 * Minimalist Audio Visualizer System
 * Features:
 * 1. Particle system visualization (with mouse interaction)
 * 2. Spectrum analysis visualization
 * 3. Waveform display visualization
 * 4. Visualizer mode menu
 * 5. Needle pointer diagram visualization
 * 6. Beautiful player interface
 */

// Audio variables
let sample;
let isReady;
let amplitude;
let fft;
let needles;
let currentSongIndex = 0;
let normalDistributionIcon;
let normalDistMean = 0;
let normalDistStdDev = 0.1;

// Player UI variables
let songNames;
let isPlaying = false;
let currentTime = 0;
let totalTime = 0;
let volume = 0.4;
let isMuted = false;
let previousVolume = 0.4; // Store volume before muting

// Playback modes
const PLAYBACK_MODES = {
    LOOP_LIST: 'loop_list',      // Loop list
    LOOP_SINGLE: 'loop_single',  // Loop single
    SHUFFLE: 'shuffle'           // Shuffle
};

let currentPlaybackMode = PLAYBACK_MODES.LOOP_LIST; // Default loop list playback
let shuffleHistory = []; // Track played songs in shuffle mode

// Loading state
let loadedSongs = 0;
let totalSongs = 7;
let hasError = false;

// Particle system variables
let particles = [];
const numParticles = 300;
const maxDistance = 150;
const baseParticleSize = 10;
const repulsionRadius = 100;
const repulsionStrength = 1.2;
const attractionStrength = 0.03;
const dampingFactor = 0.95;
const directionChangeRate = 0.05;
const maxSpeed = 4.0;

// Music response enhancement parameters
const musicResponseConfig = {
    bassKickThreshold: 0.6,      // Bass kick threshold
    bassKickForce: 8.0,          // Bass kick force
    bassKickRadius: 200,         // Bass kick radius
    trebleResponse: 0.8,         // Treble response strength
    trebleRadius: 150,           // Treble radius
    overallEnergyMultiplier: 1.5, // Overall energy multiplier
    pulseEffect: true,           // Pulse effect
    rippleEffect: true,          // Ripple effect
    colorShift: false            // Color shift (disabled)
};

// Visualization mode control
let visualModes = ["Particle movement", "Spectrum analysis", "Waveform display", "Needle pointer diagram"];
let currentMode = 0;
let showMenu = false;

// Performance tracking and optimization
let frameCount = 0;
let lastTime = 0;
let fps = 60;
let targetFPS = 60;
let frameInterval = 1000 / targetFPS;
let lastFrameTime = 0;

// Performance optimization flags
let performanceMode = {
    reduceParticles: false,
    simplifyBackground: false,
    limitSpectrumBars: false,
    enableFrameRateLimit: true
};

// ===== Animation and Transition System =====

// Easing functions
const easing = {
    linear: t => t,
    easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOut: t => t * (2 - t),
    easeIn: t => t * t,
    bounce: t => {
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
};

// Animation Manager
class AnimationManager {
    constructor() {
        this.animations = [];
    }

    // Add animation
    add(property, startValue, endValue, duration, easingFunc = 'easeOut', callback = null) {
        const animation = {
            property: property,
            startValue: startValue,
            endValue: endValue,
            duration: duration,
            easingFunc: easingFunc,
            startTime: performance.now(),
            callback: callback,
            completed: false
        };
        this.animations.push(animation);
        return animation;
    }

    // Update animation
    update() {
        const currentTime = performance.now();
        this.animations = this.animations.filter(animation => {
            if (animation.completed) return false;

            const elapsed = currentTime - animation.startTime;
            const progress = Math.min(elapsed / animation.duration, 1);
            const easedProgress = easing[animation.easingFunc](progress);

            // Calculate current value
            const currentValue = animation.startValue +
                (animation.endValue - animation.startValue) * easedProgress;

            // Update property (requires external handling)
            this.updateProperty(animation.property, currentValue);

            if (progress >= 1) {
                animation.completed = true;
                if (animation.callback) animation.callback();
                return false;
            }

            return true;
        });
    }

    // Update property (requires subclass implementation)
    updateProperty(property, value) {
        // Subclass implementation
    }

    // Clear all animations
    clear() {
        this.animations = [];
    }
}

// Spectrum Animation Manager
class SpectrumAnimationManager extends AnimationManager {
    constructor() {
        super();
        this.smoothValues = {
            bass: 0,
            mid: 0,
            treble: 0,
            energy: 0,
            peak: 0,
            rms: 0
        };
    }

    updateProperty(property, value) {
        if (this.smoothValues.hasOwnProperty(property)) {
            this.smoothValues[property] = value;
        }
    }

    // Get smooth value
    getSmoothValue(property) {
        return this.smoothValues[property] || 0;
    }

    // Smooth transition to new value
    smoothTransition(freqData) {
        const duration = 300; // 300ms transition

        this.add('bass', this.smoothValues.bass, freqData.avgBass, duration, 'easeOut');
        this.add('mid', this.smoothValues.mid, freqData.avgMid, duration, 'easeOut');
        this.add('treble', this.smoothValues.treble, freqData.avgTreble, duration, 'easeOut');
        this.add('energy', this.smoothValues.energy, freqData.totalEnergy, duration, 'easeOut');
        this.add('peak', this.smoothValues.peak, freqData.peakLevel, duration, 'easeOut');
        this.add('rms', this.smoothValues.rms, freqData.rmsLevel, duration, 'easeOut');
    }
}

// Global animation manager instances
let spectrumAnimations;
let globalAnimations;

// ===== Responsive Layout Management System =====

// Responsive Layout Manager
class ResponsiveLayout {
    constructor() {
        this.updateLayout();
    }

    updateLayout() {
        this.isMobile = width < 768;
        this.isTablet = width >= 768 && width < 1024;
        this.isDesktop = width >= 1024;

        // Adjust parameters based on device type
        this.panelWidth = this.isMobile ? width * 0.95 : this.isTablet ? width * 0.85 : width * 0.9;
        this.panelHeight = this.isMobile ? height * 0.12 : height * 0.15;
        this.fontSize = this.isMobile ? width * 0.018 : this.isTablet ? width * 0.02 : width * 0.022;
        this.barCount = this.isMobile ? Math.floor(width / 4) : Math.floor(width / 3);
        this.particleCount = this.isMobile ? 20 : this.isTablet ? 30 : 50;

        // Spectrum visualization parameters
        this.barWidthMultiplier = this.isMobile ? 2.5 : this.isTablet ? 3 : 3.5;
        this.spacingMultiplier = this.isMobile ? 0.1 : this.isTablet ? 0.15 : 0.2;
        this.maxBarHeight = this.isMobile ? height * 0.6 : height * 0.7;

        // Particle system parameters
        this.particleSizeMin = this.isMobile ? 1.5 : this.isTablet ? 2 : 2.5;
        this.particleSizeMax = this.isMobile ? 6 : this.isTablet ? 8 : 10;
        this.trailSteps = this.isMobile ? 4 : this.isTablet ? 5 : 6;
    }

    getResponsiveValue(baseValue, mobileScale = 0.7, tabletScale = 0.85, desktopScale = 1.0) {
        if (this.isMobile) return baseValue * mobileScale;
        if (this.isTablet) return baseValue * tabletScale;
        return baseValue * desktopScale;
    }

    // Get device-specific glow intensity
    getGlowIntensity() {
        if (this.isMobile) return { min: 5, max: 15 };
        if (this.isTablet) return { min: 8, max: 25 };
        return { min: 10, max: 30 };
    }

    // Get device-specific animation speed
    getAnimationSpeed() {
        if (this.isMobile) return 0.02;
        if (this.isTablet) return 0.03;
        return 0.05;
    }
}

// Global responsive layout instance
let responsiveLayout;

// ===== Professional Equalizer and Spectrum Visualization Features =====

// Equalizer variables
let eqBands = [];
let eqValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 10 frequency bands
let eqFrequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
let eqFilters = [];

// Equalizer interaction state
let eqInteractionState = {
    isVisible: false,
    isFixed: false,
    hoverTimer: null,
    hideTimer: null
};



// Audio file configuration
let audioFilesConfig = null;
let songs = [];

// Function to dynamically load audio files
function loadAudioFilesFromConfig() {
    if (!audioFilesConfig || !audioFilesConfig.files) {
        console.error('❌ Audio config file invalid');
        // Fallback to default loading
        loadDefaultAudioFiles();
        return;
    }

    console.log('🎵 Loading audio files from config file...');
    songs = [];
    songNames = [];

    audioFilesConfig.files.forEach((file, index) => {
        songNames.push(file.name);
        console.log(`  ${index + 1}. Loading: ${file.name}`);
        songs.push(loadSound(file.path, soundLoaded, soundError));
    });

    songs.forEach(song => song.setVolume(volume));
    console.log(`✅ Total ${songs.length} audio files loaded`);
}

// Default audio file loading (fallback)
function loadDefaultAudioFiles() {
    console.log('⚠️ Using default audio files...');
    songNames = [
        'I Swear.mp3',
        'Late Night Melancholy - (EA7) CHILL Lofi Piano Beat | Study Session 📚 (1 hour Loop).mp3',
        'Wu Ge Ku.mp3',
        'parsRadio_loop.mp3',
        'segway_loop.mp3',
        'yee-king_track.mp3'
    ];

    songs = [
        loadSound('assets/I Swear.mp3', soundLoaded, soundError),
        loadSound('assets/Late Night Melancholy - (EA7) CHILL Lofi Piano Beat | Study Session 📚 (1 hour Loop).mp3', soundLoaded, soundError),
        loadSound('assets/Wu Ge Ku.mp3', soundLoaded, soundError),
        loadSound('assets/parsRadio_loop.mp3', soundLoaded, soundError),
        loadSound('assets/segway_loop.mp3', soundLoaded, soundError),
        loadSound('assets/yee-king_track.mp3', soundLoaded, soundError)
    ];
    songs.forEach(song => song.setVolume(volume));
}

function preload() {
    soundFormats('mp3', 'wav');
    isReady = false;
    hasError = false;

    // Show loading overlay
    document.getElementById('loadingOverlay').style.display = 'flex';

    // Try to load audio config file
    try {
        // In p5.js, we need to use fetch or other methods to load JSON
        // For now, use default loading, then try to update in setup
        loadDefaultAudioFiles();
    } catch (error) {
        console.error('❌ Failed to preload audio files:', error);
        loadDefaultAudioFiles();
    }
}

function soundLoaded() {
    loadedSongs++;
    updateLoadingProgress();

    if (loadedSongs === totalSongs) {
        // All songs loaded successfully
        setTimeout(() => {
            document.getElementById('loadingOverlay').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loadingOverlay').style.display = 'none';
            }, 500);
        }, 1000);

        isReady = true;
        sample = songs[currentSongIndex];
        updatePlayerUI();
    }
}

function soundError() {
    hasError = true;
    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('errorMessage').classList.remove('hidden');
}

// Loading states
let loadingStage = 0;
const loadingStages = [
    { text: 'Initializing system...', element: 'status-files' },
    { text: 'Loading visualization engine...', element: 'status-visualization' },
    { text: 'Preparing audio system...', element: 'status-audio' },
    { text: 'Creating particle effects...', element: 'status-particles' },
    { text: 'Ready to explore!', element: 'status-ready' }
];

function updateLoadingProgress() {
    const progress = Math.min((loadedSongs / totalSongs) * 100, 100);
    const loadingText = document.querySelector('.loading-text');
    const progressFill = document.getElementById('loadingProgressFill');

    // Update progress text and bar
    loadingText.textContent = `Loading Audio Visualizer... ${Math.round(progress)}%`;
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }

    // Update loading stages based on progress
    const currentStage = Math.floor((progress / 100) * loadingStages.length);
    if (currentStage !== loadingStage && currentStage < loadingStages.length) {
        // Mark previous stages as completed
        for (let i = loadingStage; i < currentStage; i++) {
            const stageElement = document.getElementById(loadingStages[i].element);
            if (stageElement) {
                stageElement.classList.add('completed');
                stageElement.textContent = loadingStages[i].text.replace('⏳', '✅');
            }
        }
        loadingStage = currentStage;

        // Update current stage text
        if (currentStage < loadingStages.length) {
            const currentStageElement = document.getElementById(loadingStages[currentStage].element);
            if (currentStageElement) {
                currentStageElement.textContent = loadingStages[currentStage].text;
            }
        }
    }

    // When loading is complete
    if (progress >= 100) {
        setTimeout(() => {
            // Mark final stage as completed
            const finalStageElement = document.getElementById(loadingStages[loadingStages.length - 1].element);
            if (finalStageElement) {
                finalStageElement.classList.add('completed');
                finalStageElement.textContent = loadingStages[loadingStages.length - 1].text.replace('⏳', '🎉');
            }

            // Update main text
            loadingText.textContent = 'Loading Audio Visualizer... 100% - Complete!';
        }, 500);
    }
}

// Initialize equalizer and spectrum visualization
function initEqualizer() {
    try {
        // Create equalizer filters
        eqFilters = eqFrequencies.map(freq => {
            return new p5.LowPass();
        });

        // Setup equalizer event listeners
        setupEqualizerControls();

        // Equalizer interaction control
        setupEqualizerInteraction();

        // Add keyboard shortcut support
        setupEqualizerKeyboardShortcuts();

        console.log('Equalizer initialized successfully');
    } catch (error) {
        console.error('Equalizer initialization failed:', error);
    }
}

// Setup equalizer controls
function setupEqualizerControls() {
    const eqIds = ['eqSlider1', 'eqSlider2', 'eqSlider3', 'eqSlider4', 'eqSlider5', 'eqSlider6', 'eqSlider7', 'eqSlider8', 'eqSlider9', 'eqSlider10'];
    const eqValueIds = ['eqValue1', 'eqValue2', 'eqValue3', 'eqValue4', 'eqValue5', 'eqValue6', 'eqValue7', 'eqValue8', 'eqValue9', 'eqValue10'];

    let setupCount = 0;

    // Debug information
    console.log('Starting equalizer control setup...');
    console.log('Slider IDs to find:', eqIds);
    console.log('Value display IDs to find:', eqValueIds);

    eqIds.forEach((id, index) => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(eqValueIds[index]);

        console.log(`Frequency band ${index + 1}:`, { id, slider: !!slider, valueDisplay: !!valueDisplay });

        if (slider && valueDisplay) {
            setupCount++;

            // Remove old event listeners if they exist
            if (slider._eqHandler) {
                slider.removeEventListener('input', slider._eqHandler);
            }

            // Create new event handler function
            slider._eqHandler = (e) => {
                const value = parseInt(e.target.value);
                eqValues[index] = value;
                valueDisplay.textContent = value + 'dB';
                console.log(`Equalizer slider ${id} value changed: ${value}dB`);
                applyEqualizer();
            };

            slider.addEventListener('input', slider._eqHandler);

            // Initialize display value
            valueDisplay.textContent = eqValues[index] + 'dB';

            console.log(`Frequency band ${index + 1} setup completed`);
        } else {
            console.warn(`Frequency band ${index + 1} elements not found:`, { id, slider: !!slider, valueDisplay: !!valueDisplay });
        }
    });

    console.log(`Equalizer control setup completed: ${setupCount}/10 frequency bands`);

    // Setup preset buttons
    setupEqualizerPresets();
}

// Equalizer interaction control function
function setupEqualizerInteraction() {
    const triggerArea = document.getElementById('eqTriggerArea');
    const equalizerContainer = document.getElementById('equalizerContainer');
    const iconHint = document.getElementById('eqIconHint');

    console.log('Starting equalizer interaction control setup...');
    console.log('Trigger area:', !!triggerArea);
    console.log('Equalizer container:', !!equalizerContainer);
    console.log('Icon hint:', !!iconHint);

    if (!triggerArea || !equalizerContainer || !iconHint) {
        console.error('Equalizer interaction elements not found');
        return;
    }

    // Mouse enter trigger area
    triggerArea.addEventListener('mouseenter', () => {
        console.log('Mouse entered trigger area');
        clearTimeout(eqInteractionState.hideTimer);
        eqInteractionState.hoverTimer = setTimeout(() => {
            if (!eqInteractionState.isFixed) {
                showEqualizer();
            }
        }, 300); // 300ms delay to show
    });

    // Mouse leave trigger area
    triggerArea.addEventListener('mouseleave', () => {
        console.log('Mouse left trigger area');
        clearTimeout(eqInteractionState.hoverTimer);
        if (!eqInteractionState.isFixed) {
            eqInteractionState.hideTimer = setTimeout(() => {
                hideEqualizer();
            }, 500); // 500ms delay to hide
        }
    });

    // Mouse enter equalizer container
    equalizerContainer.addEventListener('mouseenter', () => {
        console.log('Mouse entered equalizer container');
        clearTimeout(eqInteractionState.hideTimer);
        clearTimeout(eqInteractionState.hoverTimer);
    });

    // Mouse leave equalizer container
    equalizerContainer.addEventListener('mouseleave', () => {
        console.log('Mouse left equalizer container');
        if (!eqInteractionState.isFixed) {
            eqInteractionState.hideTimer = setTimeout(() => {
                hideEqualizer();
            }, 500);
        }
    });

    // Click equalizer container to fix display
    equalizerContainer.addEventListener('click', (e) => {
        // If clicking close button, don't process
        if (e.target.id === 'eqCloseBtn') {
            return;
        }

        console.log('Clicked equalizer container');
        if (!eqInteractionState.isFixed) {
            fixEqualizer();
        }
    });

    // Click icon hint to show equalizer
    iconHint.addEventListener('click', () => {
        console.log('Clicked icon hint');
        if (eqInteractionState.isVisible) {
            hideEqualizer();
        } else {
            showEqualizer();
        }
    });

    console.log('Equalizer interaction control setup completed');
}

// Add keyboard shortcut support
function setupEqualizerKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + E toggle equalizer display
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            if (eqInteractionState.isVisible) {
                hideEqualizer();
            } else {
                showEqualizer();
            }
        }

        // ESC key hide equalizer
        if (e.key === 'Escape' && eqInteractionState.isVisible) {
            hideEqualizer();
        }

        // Number keys 1-4 quick apply presets
        if (e.key >= '1' && e.key <= '4' && eqInteractionState.isVisible) {
            e.preventDefault();
            const presets = [resetEqualizer, applyBassPreset, applyTreblePreset, applyVocalPreset];
            const index = parseInt(e.key) - 1;
            if (presets[index]) {
                presets[index]();
            }
        }
    });

    console.log('Equalizer keyboard shortcuts setup completed');
}

// Show equalizer
function showEqualizer() {
    const equalizerContainer = document.getElementById('equalizerContainer');
    const iconHint = document.getElementById('eqIconHint');

    if (equalizerContainer && iconHint) {
        eqInteractionState.isVisible = true;
        equalizerContainer.classList.add('visible');
        iconHint.classList.add('hidden');

        // Add status indicator
        updateEqualizerStatus('Visible');

        console.log('Equalizer shown');
    }
}

// Hide equalizer
function hideEqualizer() {
    const equalizerContainer = document.getElementById('equalizerContainer');
    const iconHint = document.getElementById('eqIconHint');

    if (equalizerContainer && iconHint) {
        // Clear all timers
        if (eqInteractionState.hideTimer) {
            clearTimeout(eqInteractionState.hideTimer);
            eqInteractionState.hideTimer = null;
        }
        if (eqInteractionState.hoverTimer) {
            clearTimeout(eqInteractionState.hoverTimer);
            eqInteractionState.hoverTimer = null;
        }

        // Reset state
        eqInteractionState.isVisible = false;
        eqInteractionState.isFixed = false;

        // Remove CSS classes
        equalizerContainer.classList.remove('visible', 'fixed');
        iconHint.classList.remove('hidden');

        // Add status indicator
        updateEqualizerStatus('Hidden');

        console.log('Equalizer hidden, state reset');
    }
}

// Fix equalizer
function fixEqualizer() {
    const equalizerContainer = document.getElementById('equalizerContainer');

    if (equalizerContainer) {
        eqInteractionState.isFixed = true;
        equalizerContainer.classList.add('fixed');

        // Add status indicator
        updateEqualizerStatus('Fixed');

        console.log('Equalizer fixed display');
    }
}

// Update equalizer status indicator
function updateEqualizerStatus(status) {
    const iconHint = document.getElementById('eqIconHint');
    if (iconHint) {
        iconHint.title = `Equalizer: ${status}`;
    }
}

// Setup equalizer presets
function setupEqualizerPresets() {
    const presetButtons = {
        'eqReset': resetEqualizer,
        'eqBass': applyBassPreset,
        'eqTreble': applyTreblePreset,
        'eqVocal': applyVocalPreset
    };

    let presetCount = 0;

    console.log('Starting equalizer preset button setup...');

    Object.entries(presetButtons).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        console.log(`Preset button ${id}:`, !!button);

        if (button) {
            presetCount++;

            // Remove old event listeners if they exist
            if (button._presetHandler) {
                button.removeEventListener('click', button._presetHandler);
            }

            // Create new event handler function
            button._presetHandler = handler;
            button.addEventListener('click', button._presetHandler);

            console.log(`Preset button ${id} setup completed`);
        } else {
            console.warn(`Preset button ${id} not found`);
        }
    });

    // Setup close button
    const closeBtn = document.getElementById('eqCloseBtn');
    console.log('Close button:', !!closeBtn);

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event bubbling
            hideEqualizer();
        });
        presetCount++;
        console.log('Close button setup completed');
    } else {
        console.warn('Close button not found');
    }

    console.log(`Preset button setup completed: ${presetCount}/5 buttons`);
}

// Reset equalizer
function resetEqualizer() {
    eqValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    updateEqualizerUI();
    applyEqualizer();
}

// Apply bass boost preset
function applyBassPreset() {
    eqValues = [6, 8, 6, 4, 2, 0, -2, -4, -6, -8];
    updateEqualizerUI();
    applyEqualizer();
}

// Apply treble boost preset
function applyTreblePreset() {
    eqValues = [-8, -6, -4, -2, 0, 2, 4, 6, 8, 6];
    updateEqualizerUI();
    applyEqualizer();
}

// Apply vocal boost preset
function applyVocalPreset() {
    eqValues = [-6, -4, -2, 0, 4, 6, 8, 6, 4, 2];
    updateEqualizerUI();
    applyEqualizer();
}

// Update equalizer UI
function updateEqualizerUI() {
    const eqIds = ['eqSlider1', 'eqSlider2', 'eqSlider3', 'eqSlider4', 'eqSlider5', 'eqSlider6', 'eqSlider7', 'eqSlider8', 'eqSlider9', 'eqSlider10'];
    const eqValueIds = ['eqValue1', 'eqValue2', 'eqValue3', 'eqValue4', 'eqValue5', 'eqValue6', 'eqValue7', 'eqValue8', 'eqValue9', 'eqValue10'];

    eqIds.forEach((id, index) => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(eqValueIds[index]);

        if (slider && valueDisplay) {
            slider.value = eqValues[index];
            valueDisplay.textContent = eqValues[index] + 'dB';
        }
    });
}

// Apply equalizer effects
function applyEqualizer() {
    if (!sample || !isReady) return;

    try {
        // Here we can implement actual audio filtering effects
        // Due to p5.sound limitations, we mainly update spectrum visualization

        // Validate equalizer values are within reasonable range
        let hasChanges = false;
        eqValues.forEach((value, index) => {
            if (value < -12 || value > 12 || isNaN(value)) {
                console.warn(`Equalizer value out of range: band${index} = ${value}`);
                eqValues[index] = Math.max(-12, Math.min(12, value));
                hasChanges = true;
            }
        });

        // If values were corrected, update UI
        if (hasChanges) {
            updateEqualizerUI();
        }



    } catch (error) {
        console.error('Failed to apply equalizer effects:', error);
    }
}















function setup() {
    createCanvas(windowWidth, windowHeight);
    textAlign(CENTER);
    textSize(32);

    // Audio analysis setup
    amplitude = new p5.Amplitude();
    amplitude.setInput(sample);

    fft = new p5.FFT();
    fft.setInput(sample);

    // Initialize Needles object
    needles = new Needles();

    // Initialize particle system
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }

    // Setup player controls
    setupPlayerControls();

    // Start performance tracking
    lastTime = performance.now();

    // Initialize responsive layout
    responsiveLayout = new ResponsiveLayout();

    // Initialize animation system
    spectrumAnimations = new SpectrumAnimationManager();
    globalAnimations = new AnimationManager();

    // Initialize equalizer and spectrum visualization
    // Wait for DOM to fully load before initializing
    setTimeout(() => {
        if (document.readyState === 'complete') {
            initEqualizer();
            // Try to reload audio files from config file
            tryReloadAudioFiles();
            // Initialize playback control UI
            updatePlaybackModeUI();
            updateMuteButtonUI();
        } else {
            window.addEventListener('load', () => {
                initEqualizer();
                tryReloadAudioFiles();
                // Initialize playback control UI
                updatePlaybackModeUI();
                updateMuteButtonUI();
            });
        }
    }, 200);
}

// Try to reload audio files from config file
function tryReloadAudioFiles() {
    // Wait for config file to load
    setTimeout(() => {
        if (window.audioFilesConfig && window.audioFilesConfig.files) {
            console.log('🔄 Audio config file detected, reloading...');
            audioFilesConfig = window.audioFilesConfig;

            // Stop current playback
            if (isPlaying && songs[currentSongIndex]) {
                songs[currentSongIndex].stop();
                isPlaying = false;
            }

            // Reload audio files
            loadAudioFilesFromConfig();

            // Update playlist
            updatePlaylistDisplay();

            // Update UI
            updatePlayerUI();

            console.log('✅ Audio files reloaded from config file');
        } else {
            console.log('ℹ️ No audio config file found, using default file list');
        }
    }, 500); // Wait 500ms for config file to load
}

function setupPlayerControls() {
    // Play/Pause button
    document.getElementById('playBtn').addEventListener('click', togglePlay);

    // Previous/Next buttons
    document.getElementById('prevBtn').addEventListener('click', previousSong);
    document.getElementById('nextBtn').addEventListener('click', nextSong);

    // Progress bar
    document.getElementById('progressBar').addEventListener('click', seekTo);

    // Volume slider
    document.getElementById('volumeSlider').addEventListener('input', updateVolume);

    // Mute button
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
        muteBtn.addEventListener('click', toggleMute);
    }

    // Playback mode button
    const playbackModeBtn = document.getElementById('playbackModeBtn');
    if (playbackModeBtn) {
        playbackModeBtn.addEventListener('click', togglePlaybackMode);
    }

    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentMode = parseInt(e.target.dataset.mode);
            updateModeButtons();
        });
    });

    // Playlist reload button
    const reloadBtn = document.getElementById('playlistReloadBtn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
            reloadAudioFiles();
        });
    }

    // Playlist items
    document.querySelectorAll('.playlist-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            selectSong(index);
        });
    });

    // Setup bottom navigation bar auto-hide
    setupNavigationAutoHide();

    // Initialize advanced systems
    setTimeout(() => {
        initAdvancedSystems();
    }, 500);

    // Initialize planet positions
    initializePlanetPositions();

    // Create comets
    for (let i = 0; i < 3; i++) {
        comets.push(new Comet());
    }

    // Create asteroid belt
    for (let i = 0; i < 50; i++) {
        asteroids.push(new Asteroid());
    }

    // 启动加载页面控制
    startLoadingSequence();
}

// 设置底部导航栏的自动显示隐藏
function setupNavigationAutoHide() {
    const playerContainer = document.querySelector('.player-container');
    const navTriggerArea = document.getElementById('navTriggerArea');
    const navIndicator = document.getElementById('navIndicator');

    if (!playerContainer || !navTriggerArea || !navIndicator) {
        console.log('Navigation bar elements not found');
        return;
    }

    let hideTimer = null;
    let showTimer = null;
    let isVisible = false;
    let isHovering = false;

    // Mouse enter trigger area
    navTriggerArea.addEventListener('mouseenter', () => {
        isHovering = true;
        clearTimeout(hideTimer);
        if (!isVisible) {
            showTimer = setTimeout(() => {
                if (isHovering) {
                    showNavigation();
                }
            }, 150); // 150ms delay to show
        }
    });

    // Mouse enter navigation bar
    playerContainer.addEventListener('mouseenter', () => {
        isHovering = true;
        clearTimeout(hideTimer);
        clearTimeout(showTimer);
        if (!isVisible) {
            showNavigation();
        }
    });

    // Mouse leave navigation bar
    playerContainer.addEventListener('mouseleave', () => {
        isHovering = false;
        if (isVisible) {
            hideTimer = setTimeout(() => {
                if (!isHovering) {
                    hideNavigation();
                }
            }, 1000); // 1000ms delay to hide
        }
    });

    // Mouse leave trigger area
    navTriggerArea.addEventListener('mouseleave', () => {
        isHovering = false;
        if (isVisible) {
            hideTimer = setTimeout(() => {
                if (!isHovering) {
                    hideNavigation();
                }
            }, 1000); // 1000ms delay to hide
        }
    });

    // Indicator click event
    navIndicator.addEventListener('click', () => {
        console.log('Navigation indicator clicked');
        if (isVisible) {
            hideNavigation();
        } else {
            showNavigation();
        }
    });

    // Indicator hover effect
    navIndicator.addEventListener('mouseenter', () => {
        navIndicator.classList.add('pulse');
        // If navigation bar is hidden, show hint
        if (!isVisible) {
            navIndicator.title = 'Click to show navigation';
        } else {
            navIndicator.title = 'Click to hide navigation';
        }
    });

    navIndicator.addEventListener('mouseleave', () => {
        navIndicator.classList.remove('pulse');
    });

    // Show navigation bar
    function showNavigation() {
        if (!isVisible) {
            playerContainer.classList.remove('hidden');
            playerContainer.classList.add('visible');
            isVisible = true;

            // 更新指示器状态
            navIndicator.title = 'Click to hide navigation';
            navIndicator.style.background = 'linear-gradient(90deg, #f093fb, #667eea, #764ba2)';

            console.log('Navigation bar shown');
        }
    }

    // Hide navigation bar
    function hideNavigation() {
        if (isVisible) {
            playerContainer.classList.remove('visible');
            playerContainer.classList.add('hidden');
            isVisible = false;

            // 更新指示器状态
            navIndicator.title = 'Click to show navigation';
            navIndicator.style.background = 'linear-gradient(90deg, #667eea, #764ba2, #f093fb)';

            console.log('Navigation bar hidden');
        }
    }

    // Force show navigation bar (for playback)
    function forceShowNavigation() {
        clearTimeout(hideTimer);
        clearTimeout(showTimer);
        showNavigation();
    }

    // Force hide navigation bar
    function forceHideNavigation() {
        clearTimeout(hideTimer);
        clearTimeout(showTimer);
        hideNavigation();
    }

    // 初始状态：导航栏默认隐藏
    playerContainer.classList.add('hidden');
    isVisible = false;

    // 如果正在播放，显示导航栏
    if (isPlaying) {
        forceShowNavigation();
    }

    // 监听播放状态变化
    const originalTogglePlay = togglePlay;
    togglePlay = function () {
        const result = originalTogglePlay.call(this);
        if (isPlaying) {
            forceShowNavigation();
        }
        return result;
    };

    // 添加触摸设备支持
    let touchStartY = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].clientY;
        const swipeDistance = touchStartY - touchEndY;

        // Swipe up from bottom to show navigation bar
        if (swipeDistance > 50 && touchStartY > window.innerHeight - 100) {
            forceShowNavigation();
        }
        // Swipe down from navigation bar to hide
        else if (swipeDistance < -50 && isVisible) {
            forceHideNavigation();
        }
    });

    // 导出函数供外部调用
    window.navigationControl = {
        show: forceShowNavigation,
        hide: forceHideNavigation,
        toggle: () => isVisible ? forceHideNavigation() : forceShowNavigation()
    };

    // Add debug information
    console.log('Navigation bar element status:', {
        playerContainer: !!playerContainer,
        navTriggerArea: !!navTriggerArea,
        navIndicator: !!navIndicator,
        initialClasses: playerContainer.className,
        isVisible: isVisible
    });



    console.log('Bottom navigation bar auto-hide feature setup completed');
}

function togglePlay() {
    if (!isReady) return;

    if (isPlaying) {
        sample.pause();
        isPlaying = false;
        document.getElementById('playBtn').textContent = '▶';
    } else {
        sample.play();
        isPlaying = true;
        document.getElementById('playBtn').textContent = '⏸';
    }
}

function previousSong() {
    const newIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    selectSong(newIndex);
}

function nextSong() {
    let newIndex;

    switch (currentPlaybackMode) {
        case PLAYBACK_MODES.SHUFFLE:
            newIndex = getNextShuffleSong();
            break;
        case PLAYBACK_MODES.LOOP_LIST:
        case PLAYBACK_MODES.LOOP_SINGLE:
        default:
            newIndex = (currentSongIndex + 1) % songs.length;
            break;
    }

    selectSong(newIndex);
}

// 获取下一个随机播放的歌曲
function getNextShuffleSong() {
    if (songs.length <= 1) return currentSongIndex;

    let availableSongs = [];
    for (let i = 0; i < songs.length; i++) {
        if (i !== currentSongIndex) {
            availableSongs.push(i);
        }
    }

    if (availableSongs.length === 0) {
        return currentSongIndex; // Should not happen
    }

    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    const nextSongIndex = availableSongs[randomIndex];

    // Add current song to history
    shuffleHistory.push(currentSongIndex);

    // Keep history limited
    if (shuffleHistory.length > 20) {
        shuffleHistory.shift();
    }

    return nextSongIndex;
}

// 切换播放模式
function togglePlaybackMode() {
    switch (currentPlaybackMode) {
        case PLAYBACK_MODES.LOOP_LIST:
            currentPlaybackMode = PLAYBACK_MODES.LOOP_SINGLE;
            break;
        case PLAYBACK_MODES.LOOP_SINGLE:
            currentPlaybackMode = PLAYBACK_MODES.SHUFFLE;
            break;
        case PLAYBACK_MODES.SHUFFLE:
            currentPlaybackMode = PLAYBACK_MODES.LOOP_LIST;
            break;
    }

    updatePlaybackModeUI();
    console.log('Playback mode changed to:', currentPlaybackMode);
}

// 更新播放模式UI
function updatePlaybackModeUI() {
    const modeBtn = document.getElementById('playbackModeBtn');
    if (modeBtn) {
        switch (currentPlaybackMode) {
            case PLAYBACK_MODES.LOOP_LIST:
                modeBtn.textContent = '🔁';
                modeBtn.title = 'Loop List';
                break;
            case PLAYBACK_MODES.LOOP_SINGLE:
                modeBtn.textContent = '🔂';
                modeBtn.title = 'Loop Single';
                break;
            case PLAYBACK_MODES.SHUFFLE:
                modeBtn.textContent = '🔀';
                modeBtn.title = 'Shuffle';
                break;
        }
    }
}

// 更新静音按钮UI
function updateMuteButtonUI() {
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
        if (isMuted) {
            muteBtn.textContent = '🔇';
            muteBtn.title = 'Unmute';
        } else {
            muteBtn.textContent = '🔊';
            muteBtn.title = 'Mute';
        }
    }
}

// 静音切换
function toggleMute() {
    if (isMuted) {
        // Unmute
        volume = previousVolume;
        isMuted = false;
    } else {
        // Mute
        previousVolume = volume;
        volume = 0;
        isMuted = true;
    }

    // Apply volume change
    if (sample) {
        sample.setVolume(volume);
    }

    // Update volume slider
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.value = volume * 100;
    }

    // Update UI
    updateMuteButtonUI();
    updateVolumeIndicator();
}

function switchSong() {
    if (isPlaying) {
        sample.stop();
    }
    sample = songs[currentSongIndex];
    sample.setVolume(volume);
    if (isPlaying) {
        sample.play();
    }
    amplitude.setInput(sample);
    fft.setInput(sample);
    needles.fft.setInput(sample);
    updatePlayerUI();
    updatePlaylistUI();
}

function seekTo(e) {
    if (!isReady || !sample) return;

    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;

    const newTime = percentage * sample.duration();
    sample.jump(newTime);
}

function updateVolume(e) {
    volume = e.target.value / 100;
    if (sample) {
        sample.setVolume(volume);
    }
    updateVolumeIndicator();
}

function updateVolumeIndicator() {
    if (!amplitude) return;

    const level = amplitude.getLevel();
    const volumeContainer = document.querySelector('.volume-container');

    // Create or update volume level indicator
    let volumeIndicator = document.getElementById('volumeIndicator');
    if (!volumeIndicator) {
        volumeIndicator = document.createElement('div');
        volumeIndicator.id = 'volumeIndicator';
        volumeIndicator.style.cssText = `
            position: absolute;
            top: 50%;
            left: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 2px;
            transform: translateY(-50%);
            transition: width 0.1s ease;
            pointer-events: none;
            z-index: 2;
        `;

        const volumeSlider = document.getElementById('volumeSlider');
        volumeSlider.parentElement.style.position = 'relative';
        volumeSlider.parentElement.appendChild(volumeIndicator);
    }

    // Update indicator width based on audio level
    const maxWidth = document.getElementById('volumeSlider').offsetWidth;
    const indicatorWidth = level * maxWidth * 2; // Amplify the effect
    volumeIndicator.style.width = Math.min(indicatorWidth, maxWidth) + 'px';
}

function updateModeButtons() {
    document.querySelectorAll('.mode-btn').forEach((btn, index) => {
        if (index === currentMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update mode display
    document.getElementById('currentMode').textContent = visualModes[currentMode].split(' ')[0];
}

function updatePlayerUI() {
    document.getElementById('songTitle').textContent = songNames[currentSongIndex];
    document.getElementById('songArtist').textContent = 'Audio Visualizer';
}

function updatePlaylistUI() {
    document.querySelectorAll('.playlist-item').forEach((item, index) => {
        if (index === currentSongIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function updateProgress() {
    if (!isReady || !sample) return;

    currentTime = sample.currentTime();
    totalTime = sample.duration();

    if (totalTime > 0) {
        const progress = (currentTime / totalTime) * 100;
        document.getElementById('progressFill').style.width = progress + '%';

        document.getElementById('currentTime').textContent = formatTime(currentTime);
        document.getElementById('totalTime').textContent = formatTime(totalTime);

        // Add waveform visualization to progress bar
        updateProgressWaveform();
    }
}

function updateProgressWaveform() {
    if (!fft) return;

    const waveform = fft.waveform(64); // Get 64 samples for progress bar
    const progressBar = document.getElementById('progressBar');

    // Create or update waveform overlay
    let waveformOverlay = document.getElementById('waveformOverlay');
    if (!waveformOverlay) {
        waveformOverlay = document.createElement('div');
        waveformOverlay.id = 'waveformOverlay';
        waveformOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            opacity: 0.3;
            z-index: 1;
        `;
        progressBar.style.position = 'relative';
        progressBar.appendChild(waveformOverlay);
    }

    // Create SVG waveform
    const svgWidth = progressBar.offsetWidth;
    const svgHeight = progressBar.offsetHeight;
    const barWidth = svgWidth / waveform.length;

    let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
    svgContent += `<defs><linearGradient id="waveformGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.6" />
        <stop offset="50%" style="stop-color:#764ba2;stop-opacity:0.8" />
        <stop offset="100%" style="stop-color:#667eea;stop-opacity:0.6" />
    </linearGradient></defs>`;

    for (let i = 0; i < waveform.length; i++) {
        const amplitude = Math.abs(waveform[i]) * svgHeight * 0.5;
        const x = i * barWidth;
        const y = (svgHeight - amplitude) / 2;

        svgContent += `<rect x="${x}" y="${y}" width="${barWidth * 0.8}" height="${amplitude}" 
            fill="url(#waveformGradient)" rx="1" />`;
    }

    svgContent += '</svg>';
    waveformOverlay.innerHTML = svgContent;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updatePerformanceInfo() {
    // Calculate FPS
    frameCount++;
    const currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
    }

    document.getElementById('fps').textContent = fps;
    document.getElementById('particleCount').textContent = particles.length;
}

// 音乐响应配置控制
function updateMusicResponseConfig() {
    // 根据当前播放状态动态调整参数
    if (isPlaying && isReady) {
        let currentLevel = amplitude.getLevel();

        // Dynamically adjust bass kick threshold
        musicResponseConfig.bassKickThreshold = map(currentLevel, 0, 1, 0.4, 0.8);

        // Dynamically adjust force
        musicResponseConfig.bassKickForce = map(currentLevel, 0, 1, 6.0, 12.0);

        // Dynamically adjust impact radius
        musicResponseConfig.bassKickRadius = map(currentLevel, 0, 1, 150, 300);
    }
}

// 重置音乐响应配置
function resetMusicResponseConfig() {
    musicResponseConfig.bassKickThreshold = 0.6;
    musicResponseConfig.bassKickForce = 8.0;
    musicResponseConfig.bassKickRadius = 200;
    musicResponseConfig.trebleResponse = 0.8;
    musicResponseConfig.trebleRadius = 150;
    musicResponseConfig.overallEnergyMultiplier = 1.5;
}

// 在draw函数中调用音乐响应更新
function draw() {
    // 帧率控制和性能优化
    let currentTime = performance.now();
    if (performanceMode.enableFrameRateLimit && currentTime - lastFrameTime < frameInterval) {
        return; // 跳过这一帧以维持目标帧率
    }
    lastFrameTime = currentTime;

    // 动态性能调整
    adjustPerformanceMode();

    // 更新动画系统
    if (spectrumAnimations) spectrumAnimations.update();
    if (globalAnimations) globalAnimations.update();

    background(0);

    // Don't draw if there's an error
    if (hasError) return;

    // Update performance info with optimizations
    updatePerformanceInfoOptimized();

    // Update progress
    updateProgress();

    // Update volume indicator
    updateVolumeIndicator();

    // 更新音乐响应配置
    updateMusicResponseConfig();

    // Display different visualizations based on current mode
    switch (currentMode) {
        case 0: // Particle mode
            drawParticles();
            break;
        case 1: // Spectrum mode
            drawSpectrum();
            break;
        case 2: // Waveform mode
            drawWaveform();
            break;
        case 3: // Needles mode
            needles.draw();
            break;
    }

    // Show menu if needed
    if (showMenu) {
        drawMenu();
    }

    // 更新和绘制彗星
    for (let comet of comets) {
        comet.update();
        comet.display();
    }

    // Show play prompt only if no song is playing and menu is not shown
    if (isReady && !isPlaying && !showMenu) {
        drawPlayPrompt();
    }

    // 更新高级系统
    updateAdvancedSystems();

    // 绘制增强粒子（如果启用）
    if (currentMode === 0 && enhancedParticleSystem) {
        drawEnhancedParticles();
    }

    // 更新可视化信息面板
    updateVisualizerInfo();
}

function drawParticles() {
    let level = amplitude.getLevel();
    let spectrum = fft.analyze();

    for (let i = 0; i < particles.length; i++) {
        particles[i].update(level, spectrum);
        particles[i].show();

        for (let j = i + 1; j < particles.length; j++) {
            particles[i].connect(particles[j]);
        }
    }
}

// ===== 真实银河系-太阳系可视化系统 =====
function drawSpectrum() {
    if (!responsiveLayout) return;

    let spectrum = fft.analyze();
    let waveform = fft.waveform();

    // 计算频谱数据
    let freqData = calculateFrequencyData(spectrum);

    // 1. 绘制银河系背景层
    drawGalaxyBackground(spectrum, freqData);

    // 2. 绘制银河系螺旋臂结构
    drawGalaxySpiralArms(spectrum, freqData);

    // 3. 绘制太阳系区域
    drawSolarSystemRegion(spectrum, freqData);

    // 4. 绘制太阳（中央恒星）
    drawSun(spectrum, freqData);

    // 5. 绘制八大行星系统
    drawSolarSystemPlanets(spectrum, freqData);

    // 6. 绘制行星轨道和粒子震动效果
    drawPlanetaryOrbitsWithVibration(spectrum, freqData);

    // 7. 绘制小行星带
    drawAsteroidBelt(spectrum, freqData);

    // 8. 绘制彗星轨迹
    drawCometTrails(spectrum, freqData);

    // 9. 精简版太阳系信息面板
    drawSolarSystemInfoPanel(freqData);
}

// 计算频率数据和音频分析指标
function calculateFrequencyData(spectrum) {
    let bass = 0, mid = 0, treble = 0, dominant = 0;
    let bassCount = 0, midCount = 0, trebleCount = 0;
    let maxAmp = 0, dominantIndex = 0;
    let totalEnergy = 0;

    // 频谱分析
    for (let i = 0; i < spectrum.length; i++) {
        let freq = map(i, 0, spectrum.length, 20, 22050);
        let amp = spectrum[i];
        totalEnergy += amp;

        // 找到主频率
        if (amp > maxAmp) {
            maxAmp = amp;
            dominantIndex = i;
        }

        // 频率段分类
        if (freq < 250) {
            bass += amp;
            bassCount++;
        } else if (freq < 4000) {
            mid += amp;
            midCount++;
        } else {
            treble += amp;
            trebleCount++;
        }
    }

    // 获取波形数据用于RMS计算
    let waveform = fft.waveform();
    let waveformSum = 0;
    for (let i = 0; i < waveform.length; i++) {
        waveformSum += waveform[i] * waveform[i];
    }

    // 计算音频分析指标
    let avgBass = bassCount > 0 ? bass / bassCount : 0;
    let avgMid = midCount > 0 ? mid / midCount : 0;
    let avgTreble = trebleCount > 0 ? treble / trebleCount : 0;
    let dominantFreq = map(dominantIndex, 0, spectrum.length, 20, 22050);
    let avgEnergy = totalEnergy / spectrum.length;

    // RMS (Root Mean Square) - 有效值
    let rms = Math.sqrt(waveformSum / waveform.length) * 100; // 放大以便显示

    // 动态范围 - 峰值与RMS的差值
    let dynamicRange = maxAmp - rms;

    // 信噪比 (SNR) - 使用RMS作为信号强度，-90dB作为噪声底
    let snr = rms > 0 ? rms - (-90) : 0;

    // 创建结果对象
    const result = {
        // 频谱数据
        avgBass: avgBass,
        avgMid: avgMid,
        avgTreble: avgTreble,
        dominantFreq: dominantFreq,
        maxAmplitude: maxAmp,
        totalEnergy: avgEnergy,

        // 音频分析指标
        peakLevel: maxAmp,
        rmsLevel: rms,
        dynamicRange: Math.max(0, dynamicRange),
        snr: Math.max(0, snr),

        // 原始波形数据
        waveform: waveform,
        spectrum: spectrum
    };

    // 如果动画系统已初始化，添加平滑过渡
    if (spectrumAnimations) {
        spectrumAnimations.smoothTransition(result);
    }

    return result;
}

// ===== 整合plant.js的真实太阳系数据 =====
const SOLAR_SYSTEM_DATA = {
    sun: {
        name: "Sun",
        radius: 60, // 进一步增大太阳
        color: [255, 140, 0], // RGB深黄色太阳
        rotationSpeed: 0.002,
        glowLayers: 4,
        flareCount: 12
    },
    planets: [
        {
            name: "Mercury",
            radius: 4,
            orbitRadius: 120,
            color: "#8C7853", // 使用plant.js的颜色
            orbitSpeed: 0.02, // 水星轨道速度最快
            rotationSpeed: 0.01,
            description: "最靠近太阳的行星，表面温度极高",
            moons: 0,
            type: "岩石行星",
            audioFreqRange: [0, 32] // 低频响应
        },
        {
            name: "Venus",
            radius: 9,
            orbitRadius: 175,
            color: "#E7CDCD", // plant.js颜色
            orbitSpeed: 0.015, // 金星轨道速度
            rotationSpeed: 0.008,
            description: "被称为地球的姐妹星，有浓密的大气层",
            moons: 0,
            type: "岩石行星",
            audioFreqRange: [32, 64]
        },
        {
            name: "Earth",
            radius: 10,
            orbitRadius: 300,
            color: "#6B93D6", // plant.js蓝色
            orbitSpeed: 0.01, // 地球轨道速度
            rotationSpeed: 0.02,
            description: "我们的家园，唯一已知有生命的行星",
            moons: 1,
            type: "岩石行星",
            audioFreqRange: [64, 128],
            moonData: [
                { name: "Moon", radius: 2.5, orbitRadius: 25, orbitSpeed: 0.03, color: "#C0C0C0" }
            ]
        },
        {
            name: "Mars",
            radius: 5,
            orbitRadius: 425,
            color: "#C1440E", // plant.js红色
            orbitSpeed: 0.008, // 火星轨道速度
            rotationSpeed: 0.018,
            description: "红色星球，人类探索的下一个目标",
            moons: 2,
            type: "岩石行星",
            audioFreqRange: [128, 256],
            moonData: [
                { name: "Phobos", radius: 1, orbitRadius: 12, orbitSpeed: 0.05, color: "#8B7355" },
                { name: "Deimos", radius: 0.8, orbitRadius: 15, orbitSpeed: 0.04, color: "#8B7355" }
            ]
        },
        {
            name: "Jupiter",
            radius: 110, // 使用plant.js的巨大比例
            orbitRadius: 550,
            color: "#D8CA9D", // plant.js黄色
            orbitSpeed: 0.005, // 木星轨道速度
            rotationSpeed: 0.03,
            description: "太阳系最大的行星，有著名的大红斑",
            moons: 79,
            type: "气态巨行星",
            audioFreqRange: [256, 512],
            hasStripes: true,
            moonData: [
                { name: "Io", radius: 2.5, orbitRadius: 140, orbitSpeed: 0.08, color: "#FFFF99" },
                { name: "Europa", radius: 2.2, orbitRadius: 160, orbitSpeed: 0.07, color: "#87CEEB" },
                { name: "Ganymede", radius: 3, orbitRadius: 180, orbitSpeed: 0.06, color: "#696969" },
                { name: "Callisto", radius: 2.8, orbitRadius: 200, orbitSpeed: 0.05, color: "#2F4F4F" }
            ]
        },
        {
            name: "Saturn",
            radius: 95, // plant.js比例
            orbitRadius: 675,
            color: "#FAD5A5", // plant.js淡黄色
            orbitSpeed: 0.003, // 土星轨道速度
            rotationSpeed: 0.025,
            description: "以其美丽的环系而闻名",
            moons: 82,
            type: "气态巨行星",
            audioFreqRange: [512, 1024],
            hasRings: true,
            ringInnerRadius: 120,
            ringOuterRadius: 160,
            moonData: [
                { name: "Titan", radius: 3.5, orbitRadius: 180, orbitSpeed: 0.04, color: "#CD853F" },
                { name: "Enceladus", radius: 1.5, orbitRadius: 150, orbitSpeed: 0.06, color: "#F0F8FF" }
            ]
        },
        {
            name: "Uranus",
            radius: 40, // plant.js比例
            orbitRadius: 800,
            color: "#4FD0E7", // plant.js青色
            orbitSpeed: 0.002, // 天王星轨道速度
            rotationSpeed: 0.015,
            description: "冰巨行星，自转轴倾斜很大",
            moons: 27,
            type: "冰巨行星",
            audioFreqRange: [1024, 2048],
            moonData: [
                { name: "Miranda", radius: 1.2, orbitRadius: 60, orbitSpeed: 0.03, color: "#B0C4DE" },
                { name: "Ariel", radius: 1.4, orbitRadius: 70, orbitSpeed: 0.025, color: "#B0C4DE" }
            ]
        },
        {
            name: "Neptune",
            radius: 40, // plant.js比例
            orbitRadius: 925,
            color: "#4B70DD", // plant.js深蓝色
            orbitSpeed: 0.001, // 海王星轨道速度
            rotationSpeed: 0.012,
            description: "最远的行星，有强烈的风暴",
            moons: 14,
            type: "冰巨行星",
            audioFreqRange: [2048, 4096],
            moonData: [
                { name: "Triton", radius: 2, orbitRadius: 65, orbitSpeed: 0.02, color: "#4169E1" }
            ]
        }
    ]
};

// 整合plant.js的交互控制变量
let showOrbits = true;
let showPlanetInfo = true;
let showPlanetNames = true;
let animationSpeed = 1;
let hoveredPlanet = null;
let comets = [];
let asteroids = [];
let solarSystemTime = 0;

// 行星轨道角度（用于动画）- 初始化为不同位置
let planetAngles = [];
let moonAngles = [];

// 初始化行星在不同位置，轨道速度与音乐播放时间同步
function initializePlanetPositions() {
    planetAngles = [];
    moonAngles = [];

    for (let i = 0; i < SOLAR_SYSTEM_DATA.planets.length; i++) {
        // 让行星分散在轨道的不同位置，避免重叠
        planetAngles.push((TWO_PI / SOLAR_SYSTEM_DATA.planets.length) * i);

        // 初始化卫星角度，每个卫星也在不同位置
        let planet = SOLAR_SYSTEM_DATA.planets[i];
        if (planet.moonData) {
            let moonAnglesForPlanet = [];
            for (let j = 0; j < planet.moonData.length; j++) {
                // 卫星也分散在不同位置
                moonAnglesForPlanet.push((TWO_PI / planet.moonData.length) * j + random(-0.5, 0.5));
            }
            moonAngles.push(moonAnglesForPlanet);
        } else {
            moonAngles.push([]);
        }
    }
}

// ===== 真实银河系-太阳系视觉效果系统 =====

// 银河系背景绘制
function drawGalaxyBackground(spectrum, freqData) {
    // 创建深空渐变背景
    let bgGradient = drawingContext.createLinearGradient(0, 0, width, height);
    let energy = freqData.totalEnergy / 255;

    // 根据音频能量动态调整颜色
    let baseHue = map(freqData.dominantFreq, 20, 22050, 240, 300); // 蓝紫到粉紫
    let saturation = map(energy, 0, 1, 30, 80);
    let lightness = map(energy, 0, 1, 5, 15);

    bgGradient.addColorStop(0, `hsl(${baseHue}, ${saturation}%, ${lightness}%)`);
    bgGradient.addColorStop(0.3, `hsl(${baseHue + 30}, ${saturation * 0.8}%, ${lightness * 1.2}%)`);
    bgGradient.addColorStop(0.7, `hsl(${baseHue + 60}, ${saturation * 0.6}%, ${lightness * 0.8}%)`);
    bgGradient.addColorStop(1, `hsl(${baseHue + 90}, ${saturation * 0.4}%, ${lightness * 0.6}%)`);

    drawingContext.fillStyle = bgGradient;
    drawingContext.fillRect(0, 0, width, height);

    // 添加银河系星空
    drawGalaxyStars(freqData);

    // 添加星云效果
    drawGalaxyNebula(freqData);

    // 添加遥远星系
    drawDistantGalaxies(freqData);

    // 添加星团
    drawStarClusters(freqData);
}

// 绘制银河系星空
function drawGalaxyStars(freqData) {
    noStroke();
    let starCount = responsiveLayout.isMobile ? 100 : 200;

    for (let i = 0; i < starCount; i++) {
        let x = (i * 37) % width;
        let y = (i * 23) % height;
        let twinkle = sin(frameCount * 0.02 + i) * 0.5 + 0.5;
        let brightness = map(freqData.totalEnergy, 0, 255, 100, 255);

        fill(255, 255, 255, twinkle * brightness * 0.8);
        let size = random(0.5, 2);
        ellipse(x, y, size, size);

        // 添加星星光晕效果
        if (i % 5 === 0 && freqData.totalEnergy > 150) {
            drawingContext.shadowColor = `rgba(255, 255, 255, ${twinkle * 0.5})`;
            drawingContext.shadowBlur = 10;
            ellipse(x, y, size * 3, size * 3);
            drawingContext.shadowBlur = 0;
        }
    }
}

// 绘制银河系星云
function drawGalaxyNebula(freqData) {
    let energy = freqData.totalEnergy / 255;

    // 中心星云
    drawingContext.save();
    let nebulaGradient = drawingContext.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width / 3
    );

    let hue = map(freqData.dominantFreq, 20, 22050, 240, 300);
    nebulaGradient.addColorStop(0, `hsla(${hue}, 70%, 50%, ${energy * 0.3})`);
    nebulaGradient.addColorStop(0.5, `hsla(${hue + 30}, 60%, 40%, ${energy * 0.2})`);
    nebulaGradient.addColorStop(1, `hsla(${hue + 60}, 50%, 30%, 0)`);

    drawingContext.fillStyle = nebulaGradient;
    drawingContext.fillRect(0, 0, width, height);
    drawingContext.restore();
}

// 绘制银河系螺旋臂结构
function drawGalaxySpiralArms(spectrum, freqData) {
    let energy = freqData.totalEnergy / 255;
    let armCount = 4; // 银河系主要螺旋臂数量

    for (let arm = 0; arm < armCount; arm++) {
        let armAngle = (TWO_PI / armCount) * arm + frameCount * 0.001;

        // 绘制螺旋臂
        noFill();
        stroke(200, 30, 60, map(energy, 0, 1, 20, 80));
        strokeWeight(2);

        beginShape();
        for (let r = width * 0.1; r < width * 0.8; r += 10) {
            let spiralAngle = armAngle + r * 0.01;
            let x = width / 2 + cos(spiralAngle) * r;
            let y = height / 2 + sin(spiralAngle) * r;

            // 添加音频响应的扰动
            let disturbance = map(spectrum[Math.floor(r / 10) % spectrum.length], 0, 255, -5, 5);
            x += disturbance;
            y += disturbance;

            vertex(x, y);
        }
        endShape();

        // 在螺旋臂上添加星团
        for (let r = width * 0.15; r < width * 0.7; r += 30) {
            let spiralAngle = armAngle + r * 0.01;
            let x = width / 2 + cos(spiralAngle) * r;
            let y = height / 2 + sin(spiralAngle) * r;

            // 星团亮度基于音频
            let starClusterBrightness = map(spectrum[Math.floor(r / 30) % spectrum.length], 0, 255, 50, 200);

            fill(200, 40, 80, starClusterBrightness);
            noStroke();
            ellipse(x, y, 3, 3);

            // 添加星团光晕
            if (starClusterBrightness > 150) {
                drawingContext.shadowColor = `rgba(200, 200, 255, 0.5)`;
                drawingContext.shadowBlur = 8;
                ellipse(x, y, 6, 6);
                drawingContext.shadowBlur = 0;
            }
        }
    }
}

// 绘制太阳系区域
function drawSolarSystemRegion(spectrum, freqData) {
    let centerX = width / 2;
    let centerY = height / 2;
    let regionRadius = min(width, height) * 0.55; // 增大太阳系区域

    // 太阳系区域边界（微弱发光）
    noFill();
    stroke(60, 30, 40, 100);
    strokeWeight(1);
    ellipse(centerX, centerY, regionRadius * 2, regionRadius * 2);

    // 太阳系区域背景光晕
    drawingContext.save();
    let regionGradient = drawingContext.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, regionRadius
    );

    let energy = freqData.totalEnergy / 255;
    regionGradient.addColorStop(0, `hsla(60, 50%, 30%, ${energy * 0.1})`);
    regionGradient.addColorStop(0.7, `hsla(45, 40%, 20%, ${energy * 0.05})`);
    regionGradient.addColorStop(1, `hsla(30, 30%, 10%, 0)`);

    drawingContext.fillStyle = regionGradient;
    drawingContext.fillRect(centerX - regionRadius, centerY - regionRadius, regionRadius * 2, regionRadius * 2);
    drawingContext.restore();
}

// 绘制太阳（中央恒星）
function drawSun(spectrum, freqData) {
    let centerX = width / 2;
    let centerY = height / 2;
    let sunData = SOLAR_SYSTEM_DATA.sun;

    // 太阳大小基于音频总能量
    let baseRadius = sunData.radius;
    let energyMultiplier = map(freqData.totalEnergy, 0, 255, 0.8, 1.4);
    let sunRadius = baseRadius * energyMultiplier;

    // 太阳核心 - 深黄色填充
    fill(255, 140, 0); // RGB深黄色太阳
    noStroke();
    ellipse(centerX, centerY, sunRadius * 2, sunRadius * 2);

    // 太阳光晕层 - 暗红色光晕
    for (let i = 0; i < 3; i++) {
        let glowRadius = sunRadius * (1.3 + i * 0.2);
        let glowAlpha = map(i, 0, 2, 150, 30);

        fill(255, 140, 0, glowAlpha); // RGB深黄色光晕
        ellipse(centerX, centerY, glowRadius * 2, glowRadius * 2);
    }

    // 太阳耀斑效果（基于高频音频）
    let flareIntensity = map(freqData.avgTreble, 0, 255, 0, 1);
    if (flareIntensity > 0.3) {
        let flareCount = 8;
        for (let i = 0; i < flareCount; i++) {
            let flareAngle = (TWO_PI / flareCount) * i + frameCount * 0.02;
            let flareLength = sunRadius * (1 + flareIntensity);
            let flareX = centerX + cos(flareAngle) * flareLength;
            let flareY = centerY + sin(flareAngle) * flareLength;

            stroke(255, 140, 0, flareIntensity * 200); // 深黄色耀斑
            strokeWeight(3);
            line(centerX, centerY, flareX, flareY);
        }
    }

    // 太阳表面纹理（日冕效果）
    let coronaCount = 20;
    for (let i = 0; i < coronaCount; i++) {
        let coronaAngle = (TWO_PI / coronaCount) * i + frameCount * sunData.rotationSpeed;
        let coronaRadius = sunRadius * 0.8;
        let coronaX = centerX + cos(coronaAngle) * coronaRadius;
        let coronaY = centerY + sin(coronaAngle) * coronaRadius;

        fill(255, 140, 0, 100); // RGB深黄色日冕
        noStroke();
        ellipse(coronaX, coronaY, 3, 3);
    }
}

// 绘制增强版太阳系八大行星（整合plant.js效果）
function drawSolarSystemPlanets(spectrum, freqData) {
    let centerX = width / 2;
    let centerY = height / 2;

    // 更新太阳系时间
    solarSystemTime += 0.01 * animationSpeed;

    // 重置悬停状态
    hoveredPlanet = null;

    // 计算音乐播放进度（0-1之间）
    let musicProgress = 0;
    if (sample && sample.duration()) {
        musicProgress = sample.currentTime() / sample.duration();
    }

    // 更新行星轨道角度 - 行星围绕太阳公转
    for (let i = 0; i < SOLAR_SYSTEM_DATA.planets.length; i++) {
        let planet = SOLAR_SYSTEM_DATA.planets[i];

        // 行星围绕太阳公转：初始位置 + 持续运动
        planetAngles[i] += planet.orbitSpeed * animationSpeed;

        // 更新卫星轨道角度 - 卫星围绕行星转动
        if (planet.moonData) {
            for (let j = 0; j < planet.moonData.length; j++) {
                let moon = planet.moonData[j];
                // 卫星围绕行星转动：初始位置 + 卫星相对运动
                moonAngles[i][j] += moon.orbitSpeed * animationSpeed;
            }
        }
    }

    // 绘制每个行星
    for (let i = 0; i < SOLAR_SYSTEM_DATA.planets.length; i++) {
        let planet = SOLAR_SYSTEM_DATA.planets[i];
        let angle = planetAngles[i];

        // 行星位置
        // 计算行星位置 - 行星围绕太阳公转
        let planetX = centerX + cos(planetAngles[i]) * planet.orbitRadius;
        let planetY = centerY + sin(planetAngles[i]) * planet.orbitRadius;

        // 音频响应：行星大小基于对应频段
        let spectrumIndex = Math.floor(map(i, 0, SOLAR_SYSTEM_DATA.planets.length, 0, spectrum.length));
        let audioResponse = spectrum[spectrumIndex] || 0;
        let sizeMultiplier = map(audioResponse, 0, 255, 0.8, 1.5);
        let planetRadius = planet.radius * sizeMultiplier;

        // 检查鼠标悬停
        let mouseDistance = dist(mouseX, mouseY, planetX, planetY);
        let isHovered = mouseDistance < planetRadius * 1.2;
        if (isHovered) {
            hoveredPlanet = planet;
        }

        // 绘制轨道（如果启用）
        if (showOrbits) {
            // 轨道线
            stroke(255, 255, 255, 30);
            strokeWeight(1);
            noFill();
            ellipse(centerX, centerY, planet.orbitRadius * 2, planet.orbitRadius * 2);

            // 轨道上的粒子效果
            let orbitParticleCount = 20;
            for (let p = 0; p < orbitParticleCount; p++) {
                let orbitAngle = (TWO_PI / orbitParticleCount) * p + solarSystemTime * 0.01;
                let orbitX = centerX + cos(orbitAngle) * planet.orbitRadius;
                let orbitY = centerY + sin(orbitAngle) * planet.orbitRadius;

                fill(255, 255, 255, 50);
                noStroke();
                ellipse(orbitX, orbitY, 1, 1);
            }
        }

        // 绘制行星发光效果（悬停时）
        if (isHovered) {
            for (let glowLayer = 0; glowLayer < 3; glowLayer++) {
                let glowAlpha = 100 - glowLayer * 30;
                let glowSize = planetRadius * (1.5 + glowLayer * 0.3);

                // 转换hex颜色为RGB
                let r = parseInt(planet.color.substr(1, 2), 16);
                let g = parseInt(planet.color.substr(3, 2), 16);
                let b = parseInt(planet.color.substr(5, 2), 16);

                fill(r, g, b, glowAlpha);
                noStroke();
                ellipse(planetX, planetY, glowSize * 2, glowSize * 2);
            }
        }

        // 绘制行星主体
        fill(planet.color);
        noStroke();
        ellipse(planetX, planetY, planetRadius * 2, planetRadius * 2);

        // 绘制土星环
        if (planet.hasRings) {
            stroke(200, 180, 150, 150);
            strokeWeight(3);
            noFill();
            ellipse(planetX, planetY, planet.ringInnerRadius * 2, planet.ringInnerRadius * 1.5);
            ellipse(planetX, planetY, planet.ringOuterRadius * 2, planet.ringOuterRadius * 1.5);

            // 环上的粒子
            let ringParticleCount = 40;
            for (let p = 0; p < ringParticleCount; p++) {
                let ringAngle = (TWO_PI / ringParticleCount) * p + solarSystemTime * 0.5;
                let ringRadius = (planet.ringInnerRadius + planet.ringOuterRadius) / 2;
                let ringX = planetX + cos(ringAngle) * ringRadius;
                let ringY = planetY + sin(ringAngle) * ringRadius * 0.75;

                fill(200, 180, 150, 120);
                noStroke();
                ellipse(ringX, ringY, 2, 2);
            }
        }

        // 绘制木星条纹
        if (planet.hasStripes) {
            push();
            translate(planetX, planetY);
            rotate(solarSystemTime * planet.rotationSpeed);

            stroke(150, 120, 80, 100);
            strokeWeight(2);
            line(-planetRadius * 0.8, -planetRadius * 0.3, planetRadius * 0.8, -planetRadius * 0.3);
            line(-planetRadius * 0.8, planetRadius * 0.3, planetRadius * 0.8, planetRadius * 0.3);

            // 大红斑
            fill(180, 80, 60, 150);
            noStroke();
            ellipse(planetRadius * 0.4, planetRadius * 0.2, planetRadius * 0.3, planetRadius * 0.2);

            pop();
        }

        // 绘制卫星系统
        if (planet.moonData) {
            for (let j = 0; j < planet.moonData.length; j++) {
                let moon = planet.moonData[j];
                let moonAngle = moonAngles[i][j];

                // 卫星围绕行星转动
                let moonX = planetX + cos(moonAngles[i][j]) * moon.orbitRadius;
                let moonY = planetY + sin(moonAngles[i][j]) * moon.orbitRadius;

                // 卫星大小也受音频影响（较小幅度）
                let moonSizeMultiplier = map(audioResponse, 0, 255, 0.9, 1.2);
                let moonRadius = moon.radius * moonSizeMultiplier;

                // 绘制卫星轨道线（微弱）
                if (showOrbits && moonRadius > 1) {
                    noFill();
                    stroke(255, 255, 255, 20);
                    strokeWeight(0.5);
                    ellipse(planetX, planetY, moon.orbitRadius * 2, moon.orbitRadius * 2);
                }

                // 绘制卫星
                fill(moon.color);
                noStroke();
                ellipse(moonX, moonY, moonRadius * 2, moonRadius * 2);
            }
        }

        // 绘制行星名称（如果启用）
        if (showPlanetNames) {
            fill(255);
            noStroke();
            textAlign(CENTER);
            textSize(12);
            text(planet.name, planetX, planetY + planetRadius + 20);

            // 绘制卫星数量
            if (planet.moons > 0) {
                textSize(10);
                fill(200);
                text(planet.moons + " moons", planetX, planetY + planetRadius + 35);
            }
        }

        // 行星表面纹理效果
        drawPlanetSurfaceDetails(planetX, planetY, planetRadius, planet, audioResponse);
    }
}

// 绘制行星表面细节
function drawPlanetSurfaceDetails(x, y, radius, planet, audioResponse) {
    let detailCount = Math.floor(radius / 2);

    for (let i = 0; i < detailCount; i++) {
        let detailAngle = (TWO_PI / detailCount) * i + frameCount * planet.rotationSpeed;
        let detailRadius = radius * 0.7;
        let detailX = x + cos(detailAngle) * detailRadius;
        let detailY = y + sin(detailAngle) * detailRadius;

        // 根据行星类型添加不同的表面特征
        let detailColor = [...planet.color];
        detailColor[2] *= 0.8; // 稍微暗一些

        fill(detailColor[0], detailColor[1], detailColor[2], map(audioResponse, 0, 255, 80, 150));
        noStroke();

        // 不同行星的特征
        switch (planet.name) {
            case "Earth":
                // 地球：大陆轮廓
                if (i % 3 === 0) {
                    fill(120, 60, 70, 120); // 绿色大陆
                    ellipse(detailX, detailY, 2, 2);
                }
                break;
            case "Mars":
                // 火星：极地冰帽和峡谷
                if (i % 4 === 0) {
                    fill(0, 0, 90, 100); // 白色极地
                    ellipse(detailX, detailY, 1.5, 1.5);
                }
                break;
            case "Jupiter":
                // 木星：大红斑和条纹
                if (i % 2 === 0) {
                    fill(15, 90, 80, 130); // 红色条纹
                    ellipse(detailX, detailY, 3, 1);
                }
                break;
            default:
                ellipse(detailX, detailY, 1, 1);
        }
    }
}

// 绘制行星轨道和粒子震动效果
function drawPlanetaryOrbitsWithVibration(spectrum, freqData) {
    let centerX = width / 2;
    let centerY = height / 2;

    // 绘制每个行星的轨道
    for (let i = 0; i < SOLAR_SYSTEM_DATA.planets.length; i++) {
        let planet = SOLAR_SYSTEM_DATA.planets[i];

        // 轨道基础属性
        let orbitRadius = planet.orbitRadius;
        let orbitAlpha = map(freqData.totalEnergy, 0, 255, 30, 100);

        // 音频响应的轨道震动
        let spectrumIndex = Math.floor(map(i, 0, SOLAR_SYSTEM_DATA.planets.length, 0, spectrum.length));
        let audioResponse = spectrum[spectrumIndex] || 0;
        let vibrationIntensity = map(audioResponse, 0, 255, 0, 8);

        // 绘制轨道线
        noFill();
        stroke(planet.color[0], planet.color[1] * 0.4, planet.color[2] * 0.6, orbitAlpha);
        strokeWeight(1);

        // 添加震动效果到轨道
        beginShape();
        let orbitPoints = 60;
        for (let p = 0; p < orbitPoints; p++) {
            let angle = (TWO_PI / orbitPoints) * p;
            let vibration = sin(frameCount * 0.05 + p * 0.1) * vibrationIntensity;
            let x = centerX + cos(angle) * (orbitRadius + vibration);
            let y = centerY + sin(angle) * (orbitRadius + vibration);
            vertex(x, y);
        }
        endShape(CLOSE);

        // 轨道粒子系统（随音频震动）
        let particleCount = Math.floor(orbitRadius / 15);
        for (let p = 0; p < particleCount; p++) {
            let particleAngle = (TWO_PI / particleCount) * p + frameCount * 0.01;

            // 粒子震动效果
            let particleVibration = sin(frameCount * 0.08 + p * 0.2) * vibrationIntensity * 0.5;
            let particleRadius = orbitRadius + particleVibration;

            let particleX = centerX + cos(particleAngle) * particleRadius;
            let particleY = centerY + sin(particleAngle) * particleRadius;

            // 粒子大小基于音频强度
            let particleSize = map(audioResponse, 0, 255, 1, 4);
            let particleAlpha = map(audioResponse, 0, 255, 100, 255);

            fill(planet.color[0], planet.color[1], planet.color[2], particleAlpha);
            noStroke();
            ellipse(particleX, particleY, particleSize, particleSize);

            // 高能量时添加粒子尾迹
            if (audioResponse > 150) {
                let trailLength = 5;
                for (let t = 1; t <= trailLength; t++) {
                    let trailAngle = particleAngle - t * 0.05;
                    let trailX = centerX + cos(trailAngle) * particleRadius;
                    let trailY = centerY + sin(trailAngle) * particleRadius;
                    let trailAlpha = map(t, 1, trailLength, particleAlpha * 0.7, 0);

                    fill(planet.color[0], planet.color[1], planet.color[2], trailAlpha);
                    ellipse(trailX, trailY, particleSize * 0.5, particleSize * 0.5);
                }
            }
        }

        // 轨道共振效果（行星间的引力影响）
        if (i > 0 && audioResponse > 100) {
            let prevPlanet = SOLAR_SYSTEM_DATA.planets[i - 1];
            let resonanceStrength = map(audioResponse, 100, 255, 0, 1);

            // 绘制共振连线
            let currentAngle = planetAngles[i];
            let prevAngle = planetAngles[i - 1];

            let currentX = centerX + cos(currentAngle) * planet.orbitRadius;
            let currentY = centerY + sin(currentAngle) * planet.orbitRadius;
            let prevX = centerX + cos(prevAngle) * prevPlanet.orbitRadius;
            let prevY = centerY + sin(prevAngle) * prevPlanet.orbitRadius;

            stroke(planet.color[0], 30, 70, resonanceStrength * 100);
            strokeWeight(1);
            line(currentX, currentY, prevX, prevY);
        }
    }
}

// 绘制小行星带
function drawAsteroidBelt(spectrum, freqData) {
    let centerX = width / 2;
    let centerY = height / 2;

    // 小行星带位置（火星和木星之间）
    let innerRadius = SOLAR_SYSTEM_DATA.planets[3].orbitRadius + 20; // 火星轨道外
    let outerRadius = SOLAR_SYSTEM_DATA.planets[4].orbitRadius - 20; // 木星轨道内

    // 更新和绘制小行星
    for (let asteroid of asteroids) {
        asteroid.update();
        asteroid.display();
    }

    let asteroidCount = responsiveLayout.isMobile ? 50 : 100;

    for (let i = 0; i < asteroidCount; i++) {
        // 小行星位置
        let angle = (TWO_PI / asteroidCount) * i + frameCount * 0.002;
        let radius = random(innerRadius, outerRadius);

        // 音频响应的小行星震动
        let spectrumIndex = Math.floor(map(i, 0, asteroidCount, 0, spectrum.length));
        let audioResponse = spectrum[spectrumIndex] || 0;
        let vibration = map(audioResponse, 0, 255, 0, 3);

        let asteroidX = centerX + cos(angle) * (radius + sin(frameCount * 0.03 + i) * vibration);
        let asteroidY = centerY + sin(angle) * (radius + cos(frameCount * 0.03 + i) * vibration);

        // 小行星大小和颜色
        let asteroidSize = random(0.5, 2);
        let brightness = map(audioResponse, 0, 255, 40, 80);

        fill(30, 50, brightness);
        noStroke();
        ellipse(asteroidX, asteroidY, asteroidSize, asteroidSize);

        // 高能量时的小行星碰撞效果
        if (audioResponse > 200) {
            drawingContext.shadowColor = `rgba(255, 150, 100, 0.6)`;
            drawingContext.shadowBlur = 5;
            ellipse(asteroidX, asteroidY, asteroidSize * 2, asteroidSize * 2);
            drawingContext.shadowBlur = 0;
        }
    }
}

// 绘制彗星轨迹
function drawCometTrails(spectrum, freqData) {
    let centerX = width / 2;
    let centerY = height / 2;

    let cometCount = responsiveLayout.isMobile ? 3 : 5;

    for (let i = 0; i < cometCount; i++) {
        // 彗星轨道（椭圆形，高度偏心）
        let semiMajorAxis = width * 0.4;
        let eccentricity = 0.7; // 高偏心率
        let orbitAngle = (TWO_PI / cometCount) * i;

        // 彗星在轨道上的位置
        let cometPhase = frameCount * 0.003 + i * PI;
        let r = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * cos(cometPhase));

        let cometX = centerX + cos(cometPhase + orbitAngle) * r;
        let cometY = centerY + sin(cometPhase + orbitAngle) * r * 0.6; // 压扁椭圆

        // 音频响应的彗星亮度
        let spectrumIndex = Math.floor(map(i, 0, cometCount, 0, spectrum.length));
        let audioResponse = spectrum[spectrumIndex] || 0;
        let cometBrightness = map(audioResponse, 0, 255, 0.3, 1);

        if (cometBrightness > 0.4) {
            // 彗星尾迹
            let tailLength = map(audioResponse, 0, 255, 20, 80);
            let velocity = createVector(cos(cometPhase + orbitAngle), sin(cometPhase + orbitAngle) * 0.6);
            velocity.mult(-1); // 尾迹方向相反

            stroke(200, 80, 90, cometBrightness * 200);
            strokeWeight(3);
            noFill();

            beginShape();
            for (let t = 0; t < tailLength; t += 3) {
                let tailX = cometX + velocity.x * t;
                let tailY = cometY + velocity.y * t;
                let tailAlpha = map(t, 0, tailLength, cometBrightness * 255, 0);

                stroke(200, 80, 90, tailAlpha);
                vertex(tailX, tailY);
            }
            endShape();

            // 彗星核心
            fill(60, 100, 100, cometBrightness * 255);
            noStroke();
            ellipse(cometX, cometY, 6, 6);

            // 彗星光晕
            drawingContext.shadowColor = `rgba(255, 200, 100, ${cometBrightness * 0.8})`;
            drawingContext.shadowBlur = 15;
            ellipse(cometX, cometY, 12, 12);
            drawingContext.shadowBlur = 0;
        }
    }
}

// 绘制银河系粒子流
function drawGalaxyParticleStream(spectrum, freqData) {
    let streamCount = responsiveLayout.isMobile ? 20 : 40;

    for (let i = 0; i < streamCount; i++) {
        let spectrumIndex = Math.floor(map(i, 0, streamCount, 0, spectrum.length));
        let amp = spectrum[spectrumIndex];

        if (amp > 80) {
            let angle = map(i, 0, streamCount, 0, TWO_PI);
            let spiralRadius = map(amp, 80, 255, width * 0.05, width * 0.3);
            let spiralAngle = angle + frameCount * 0.008;

            let x = width / 2 + cos(spiralAngle) * spiralRadius;
            let y = height / 2 + sin(spiralAngle) * spiralRadius;

            // 粒子颜色
            let hue = map(amp, 80, 255, 180, 300);
            let saturation = 90;
            let brightness = map(amp, 80, 255, 70, 100);

            fill(hue, saturation, brightness, 200);
            noStroke();

            // 粒子大小
            let particleSize = map(amp, 80, 255, 1, 4);
            ellipse(x, y, particleSize, particleSize);

            // 添加拖尾效果
            let trailLength = 8;
            for (let t = 1; t <= trailLength; t++) {
                let trailAngle = spiralAngle - t * 0.1;
                let trailRadius = spiralRadius - t * 2;
                let trailX = width / 2 + cos(trailAngle) * trailRadius;
                let trailY = height / 2 + sin(trailAngle) * trailRadius;
                let trailAlpha = map(t, 1, trailLength, 200, 0);

                fill(hue, saturation, brightness, trailAlpha);
                ellipse(trailX, trailY, particleSize * 0.5, particleSize * 0.5);
            }
        }
    }
}

// 绘制中央星系核心
function drawGalaxyCore(spectrum, freqData) {
    let coreX = width / 2;
    let coreY = height / 2;
    let coreSize = map(freqData.totalEnergy, 0, 255, 20, 50);

    // 核心光晕
    drawingContext.save();
    let coreGradient = drawingContext.createRadialGradient(
        coreX, coreY, 0,
        coreX, coreY, coreSize * 2
    );

    let hue = map(freqData.dominantFreq, 20, 22050, 240, 300);
    coreGradient.addColorStop(0, `hsla(${hue}, 80%, 70%, 0.8)`);
    coreGradient.addColorStop(0.5, `hsla(${hue + 30}, 70%, 60%, 0.4)`);
    coreGradient.addColorStop(1, `hsla(${hue + 60}, 60%, 50%, 0)`);

    drawingContext.fillStyle = coreGradient;
    drawingContext.fillRect(coreX - coreSize * 2, coreY - coreSize * 2, coreSize * 4, coreSize * 4);
    drawingContext.restore();

    // 核心主体
    fill(hue, 90, 80);
    ellipse(coreX, coreY, coreSize, coreSize);

    // 核心脉动效果
    let pulseSize = coreSize * (1 + sin(frameCount * 0.05) * 0.2);
    noFill();
    stroke(hue, 70, 90, 150);
    strokeWeight(2);
    ellipse(coreX, coreY, pulseSize, pulseSize);

    // 添加旋转的能量环
    let ringCount = 3;
    for (let r = 0; r < ringCount; r++) {
        let ringRadius = coreSize * (1.5 + r * 0.3);
        let ringAngle = frameCount * 0.02 * (r + 1);

        noFill();
        stroke(hue + r * 20, 60, 80, 100);
        strokeWeight(1);
        ellipse(coreX, coreY, ringRadius * 2, ringRadius * 2);
    }
}

// 整合plant.js的行星信息显示和控制面板
function drawSolarSystemInfoPanel(freqData) {
    // 绘制悬停的行星信息（plant.js风格）
    if (hoveredPlanet && showPlanetInfo) {
        drawPlanetInfoPanel(hoveredPlanet);
    }

    // 绘制太阳系控制面板
    drawSolarSystemControlPanel(freqData);
}

// plant.js风格的行星信息面板
function drawPlanetInfoPanel(planet) {
    let infoX = mouseX + 10;
    let infoY = mouseY - 10;

    // 确保信息框不超出屏幕
    if (infoX + 220 > width) {
        infoX = mouseX - 230;
    }
    if (infoY - 140 < 0) {
        infoY = mouseY + 20;
    }

    // 绘制信息框背景
    fill(0, 0, 0, 220);
    stroke(255);
    strokeWeight(1);
    rect(infoX, infoY - 130, 220, 160, 8); // 增加高度以适应轨道进度

    // 绘制行星信息
    fill(255);
    noStroke();
    textSize(16);
    textAlign(LEFT);
    text(planet.name, infoX + 10, infoY - 110);

    textSize(12);
    fill(200);
    text("Type: " + planet.type, infoX + 10, infoY - 90);
    text("Moons: " + planet.moons, infoX + 10, infoY - 75);
    text("Distance: " + planet.orbitRadius + " AU", infoX + 10, infoY - 60);

    // 绘制描述（分行显示）
    fill(180);
    textSize(10);
    let description = planet.description || "A fascinating celestial body";
    let words = description.split('，');
    let yOffset = infoY - 45;
    for (let i = 0; i < words.length && i < 3; i++) {
        text(words[i], infoX + 10, yOffset + i * 12);
    }

    // 音频响应指示器
    fill(100, 200, 255);
    textSize(10);
    text("Audio Response: " + planet.audioFreqRange[0] + "-" + planet.audioFreqRange[1] + " Hz",
        infoX + 10, infoY - 10);
}

// Solar System Control Panel
function drawSolarSystemControlPanel(freqData) {
    if (!responsiveLayout) return;

    let panelWidth = responsiveLayout.panelWidth * 0.5;
    let panelHeight = responsiveLayout.panelHeight * 0.35;
    let panelX = 10;
    let panelY = 10;

    // No background panel - only text
    // fill(0, 0, 0, 180);
    // noStroke();
    // rect(panelX, panelY, panelWidth, panelHeight, 5);

    // Draw title
    fill(255);
    noStroke();
    textSize(14);
    textAlign(LEFT);
    text("Solar System Control Panel", panelX + 10, panelY + 25);

    // Draw control options
    textSize(12);
    let yPos = panelY + 45;

    fill(showOrbits ? 255 : 150);
    text("Orbit Display: " + (showOrbits ? "ON" : "OFF"), panelX + 10, yPos);

    fill(showPlanetInfo ? 255 : 150);
    text("Info Display: " + (showPlanetInfo ? "ON" : "OFF"), panelX + 10, yPos + 20);

    fill(showPlanetNames ? 255 : 150);
    text("Planet Names: " + (showPlanetNames ? "ON" : "OFF"), panelX + 10, yPos + 40);

    fill(255);
    text("Animation Speed: " + animationSpeed.toFixed(1) + "x", panelX + 10, yPos + 60);

    // Draw operation hints
    textSize(10);
    fill(180);
    text("Click to toggle options, scroll wheel for speed", panelX + 10, yPos + 80);
    text("Shortcuts: O-Orbits, I-Info, N-Names", panelX + 10, yPos + 95);
}

// 银河系能量波纹
function drawGalaxyEnergyRipples(spectrum, freqData) {
    let energy = freqData.totalEnergy / 255;

    if (energy < 0.3) return;

    let rippleCount = Math.floor(map(energy, 0.3, 1, 2, 6));

    for (let r = 0; r < rippleCount; r++) {
        let rippleRadius = (frameCount * 2 + r * 50) % (width * 0.8);
        let alpha = map(rippleRadius, 0, width * 0.8, 100, 0);

        noFill();
        stroke(100, 200, 255, alpha);
        strokeWeight(2);
        ellipse(width / 2, height / 2, rippleRadius * 2, rippleRadius * 2);
    }
}

// 动态背景绘制
function drawDynamicBackground(spectrum) {
    // 响应式背景渐变
    let bgGrad = drawingContext.createLinearGradient(0, 0, width, height);

    // 根据频谱强度动态调整颜色
    let energy = spectrum.reduce((sum, amp) => sum + amp, 0) / spectrum.length;
    let intensity = map(energy, 0, 255, 0.7, 1.0);

    bgGrad.addColorStop(0, `rgba(15, 23, 42, ${intensity})`);
    bgGrad.addColorStop(0.3, `rgba(30, 58, 138, ${intensity * 0.8})`);
    bgGrad.addColorStop(0.7, `rgba(67, 56, 202, ${intensity * 0.9})`);
    bgGrad.addColorStop(1, `rgba(147, 51, 234, ${intensity * 0.85})`);

    drawingContext.fillStyle = bgGrad;
    drawingContext.fillRect(0, 0, width, height);

    // 添加星空效果背景
    drawStarryBackground();
}

// 星空背景效果
function drawStarryBackground() {
    noStroke();
    for (let i = 0; i < 50; i++) {
        let x = (i * 37) % width;
        let y = (i * 23) % height;
        let twinkle = sin(frameCount * 0.05 + i) * 0.5 + 0.5;
        fill(255, 255, 255, twinkle * 100);
        ellipse(x, y, 1, 1);
    }
}

// 现代化信息面板
function drawModernInfoPanel(freqData) {
    if (!responsiveLayout) return;

    let panelWidth = responsiveLayout.panelWidth;
    let panelHeight = responsiveLayout.panelHeight * (responsiveLayout.isMobile ? 1.2 : 1.1); // 减少面板高度，移除歌名显示
    let panelX = (width - panelWidth) / 2;
    let panelY = responsiveLayout.isMobile ? 10 : 20;

    // 玻璃质感面板背景
    drawingContext.save();
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.3)';
    drawingContext.shadowBlur = responsiveLayout.getResponsiveValue(20);
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = responsiveLayout.getResponsiveValue(5);

    fill(0, 0, 0, 150);
    rect(panelX, panelY, panelWidth, panelHeight, responsiveLayout.getResponsiveValue(20));

    // 玻璃边框发光效果
    drawingContext.shadowColor = 'rgba(102, 126, 234, 0.6)';
    drawingContext.shadowBlur = responsiveLayout.getResponsiveValue(15);
    stroke(102, 126, 234, 100);
    strokeWeight(1);
    noFill();
    rect(panelX, panelY, panelWidth, panelHeight, responsiveLayout.getResponsiveValue(20));
    drawingContext.shadowBlur = 0;

    // 频谱数据 - 响应式布局
    let dataY = panelY + responsiveLayout.getResponsiveValue(25);
    let colWidth = (panelWidth - responsiveLayout.getResponsiveValue(40)) / (responsiveLayout.isMobile ? 3 : 4);

    // 根据设备类型显示不同数量的指标，使用平滑值
    let indicators = responsiveLayout.isMobile ?
        [
            { value: spectrumAnimations ? spectrumAnimations.getSmoothValue('bass') : freqData.avgBass, label: "BASS", color: color(255, 100, 100) },
            { value: spectrumAnimations ? spectrumAnimations.getSmoothValue('mid') : freqData.avgMid, label: "MID", color: color(100, 255, 100) },
            { value: spectrumAnimations ? spectrumAnimations.getSmoothValue('energy') : freqData.totalEnergy, label: "ENERGY", color: color(255, 100, 255) }
        ] :
        [
            { value: spectrumAnimations ? spectrumAnimations.getSmoothValue('bass') : freqData.avgBass, label: "BASS", color: color(255, 100, 100) },
            { value: spectrumAnimations ? spectrumAnimations.getSmoothValue('mid') : freqData.avgMid, label: "MID", color: color(100, 255, 100) },
            { value: spectrumAnimations ? spectrumAnimations.getSmoothValue('treble') : freqData.avgTreble, label: "TREBLE", color: color(100, 100, 255) },
            { value: spectrumAnimations ? spectrumAnimations.getSmoothValue('energy') : freqData.totalEnergy, label: "ENERGY", color: color(255, 100, 255) }
        ];

    for (let i = 0; i < indicators.length; i++) {
        drawFrequencyBar(infoX + colWidth * i, dataY, colWidth, indicators[i].value, indicators[i].label, indicators[i].color);
    }

    // 音频分析指标显示
    let analysisY = dataY + responsiveLayout.getResponsiveValue(35);

    // 根据设备类型决定显示的指标数量，使用平滑值
    let analysisIndicators = responsiveLayout.isMobile ?
        [
            { value: spectrumAnimations ? spectrumAnimations.getSmoothValue('peak') : freqData.peakLevel, label: "PEAK", unit: "dB", color: color(255, 150, 0) },
            { value: spectrumAnimations ? spectrumAnimations.getSmoothValue('rms') : freqData.rmsLevel, label: "RMS", unit: "dB", color: color(0, 200, 255) },
            { value: freqData.snr, label: "SNR", unit: "dB", color: color(150, 255, 150) }
        ] :
        [
            { value: spectrumAnimations ? spectrumAnimations.getSmoothValue('peak') : freqData.peakLevel, label: "PEAK", unit: "dB", color: color(255, 150, 0) },
            { value: spectrumAnimations ? spectrumAnimations.getSmoothValue('rms') : freqData.rmsLevel, label: "RMS", unit: "dB", color: color(0, 200, 255) },
            { value: freqData.dynamicRange, label: "DR", unit: "dB", color: color(255, 100, 200) },
            { value: freqData.snr, label: "SNR", unit: "dB", color: color(150, 255, 150) }
        ];

    // 音频分析标题
    fill(255, 255, 255, 180);
    textSize(responsiveLayout.fontSize * 0.8);
    text("AUDIO ANALYSIS", infoX, analysisY - responsiveLayout.getResponsiveValue(15));

    for (let i = 0; i < analysisIndicators.length; i++) {
        drawAudioAnalysisBar(infoX + colWidth * i, analysisY, colWidth,
            analysisIndicators[i].value,
            analysisIndicators[i].label,
            analysisIndicators[i].unit,
            analysisIndicators[i].color);
    }

    drawingContext.restore();
}

// 频率条形图绘制
function drawFrequencyBar(x, y, width, value, label, barColor) {
    let barHeight = 20;
    let barWidth = map(value, 0, 255, 0, width * 0.8);

    // 背景条
    fill(50, 50, 50, 100);
    rect(x, y - barHeight / 2, width * 0.8, barHeight, 3);

    // 数据条
    fill(barColor);
    rect(x, y - barHeight / 2, barWidth, barHeight, 3);

    // 数值标签
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(min(width * 0.015, 10));
    text(label, x + width * 0.4, y - barHeight - 8);
    text(nf(value, 3, 0), x + width * 0.4, y + barHeight + 8);
}

// 音频分析指标条形图绘制
function drawAudioAnalysisBar(x, y, width, value, label, unit, barColor) {
    let barHeight = 18;
    let maxValue = label === 'SNR' ? 120 : (label === 'DR' ? 100 : 255);
    let barWidth = map(value, 0, maxValue, 0, width * 0.8);

    // 背景条
    fill(40, 40, 40, 120);
    rect(x, y - barHeight / 2, width * 0.8, barHeight, 2);

    // 数据条
    fill(barColor);
    rect(x, y - barHeight / 2, barWidth, barHeight, 2);

    // 数值和单位标签
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(min(width * 0.012, 9));

    // 标签
    text(label, x + width * 0.4, y - barHeight - 6);

    // 数值和单位
    let displayValue = label === 'SNR' || label === 'DR' || label === 'RMS' || label === 'PEAK' ?
        nf(value, 3, 1) : nf(value, 3, 0);
    text(displayValue + unit, x + width * 0.4, y + barHeight + 6);
}

// Canvas优化的频谱可视化
function drawOptimizedSpectrum(spectrum, dominantFreq) {
    if (!responsiveLayout) return;

    let barCount = min(spectrum.length, responsiveLayout.barCount);
    let barWidth = width / barCount;
    let spacing = barWidth * responsiveLayout.spacingMultiplier;

    // 使用Canvas直接绘制以提高性能
    drawingContext.save();

    for (let i = 0; i < barCount; i++) {
        let spectrumIndex = Math.floor(map(i, 0, barCount, 0, spectrum.length));
        let amp = spectrum[spectrumIndex];
        let freq = map(spectrumIndex, 0, spectrum.length, 20, 22050);

        // 增强的颜色映射算法
        let hue = map(freq, 20, 22050, 240, 0);
        let saturation = map(amp, 0, 255, 40, 100);
        let brightness = map(amp, 0, 255, 30, 95);

        // 根据主频率调整颜色
        if (Math.abs(freq - dominantFreq) < 1000) {
            saturation = min(saturation + 20, 100);
            brightness = min(brightness + 10, 100);
        }

        let barColor = `hsl(${hue}, ${saturation}%, ${brightness}%)`;
        let glowColor = `hsl(${hue}, ${saturation}%, ${brightness + 20}%)`;

        // 响应式高度计算
        let maxHeight = responsiveLayout.maxBarHeight;
        let bottomHeight = map(amp, 0, 255, 0, maxHeight);
        let topHeight = map(amp, 0, 255, 0, maxHeight);

        let x = i * barWidth;

        // 底部频谱条
        drawingContext.fillStyle = barColor;
        drawingContext.fillRect(x + spacing / 2, height - bottomHeight, barWidth - spacing, bottomHeight);

        // 顶部频谱条（倒置）
        drawingContext.save();
        drawingContext.translate(x + barWidth / 2, topHeight);
        drawingContext.rotate(Math.PI);
        drawingContext.fillRect(-barWidth / 2 + spacing / 2, 0, barWidth - spacing, topHeight);
        drawingContext.restore();

        // 智能发光效果 - 响应式发光强度
        let glowIntensity = responsiveLayout.getGlowIntensity();
        if (amp > 120 || Math.abs(freq - dominantFreq) < 500) {
            let glowStrength = map(amp, 120, 255, glowIntensity.min, glowIntensity.max);
            drawingContext.shadowColor = glowColor;
            drawingContext.shadowBlur = glowStrength;

            drawingContext.fillRect(x + spacing / 2, height - bottomHeight, barWidth - spacing, bottomHeight);
            drawingContext.shadowBlur = 0;
        }
    }

    drawingContext.restore();
}

// 增强的粒子效果系统
function drawAdvancedParticles(spectrum, waveform, freqData) {
    // 频谱粒子
    drawSpectrumParticlesAdvanced(spectrum, freqData);

    // 波形粒子
    drawWaveformParticlesAdvanced(waveform, freqData);

    // 能量粒子
    drawEnergyParticles(freqData);
}

// 高级频谱粒子
function drawSpectrumParticlesAdvanced(spectrum, freqData) {
    // 使用优化的版本
    drawOptimizedSpectrumParticles(spectrum, freqData);
}

// 高级波形粒子
function drawWaveformParticlesAdvanced(waveform, freqData) {
    if (!responsiveLayout) return;

    let particleCount = min(waveform.length / responsiveLayout.getResponsiveValue(50, 60, 50, 40),
        responsiveLayout.particleCount);

    for (let i = 0; i < particleCount; i++) {
        let index = Math.floor(map(i, 0, particleCount, 0, waveform.length));
        let x = map(index, 0, waveform.length,
            responsiveLayout.getResponsiveValue(20, 15, 18, 25),
            width - responsiveLayout.getResponsiveValue(20, 15, 18, 25));
        let y = map(waveform[index], -1, 1,
            height * responsiveLayout.getResponsiveValue(0.2, 0.25, 0.2, 0.15),
            height * responsiveLayout.getResponsiveValue(0.8, 0.75, 0.8, 0.85));

        // 粒子大小和颜色随能量变化
        let size = map(freqData.totalEnergy, 0, 255,
            responsiveLayout.particleSizeMin,
            responsiveLayout.particleSizeMax);
        let hue = map(freqData.dominantFreq, 20, 22050, 200, 280);

        fill(hue, 70, 80, 120);
        noStroke();
        ellipse(x, y, size, size);
    }
}

// 能量粒子效果
function drawEnergyParticles(freqData) {
    if (!responsiveLayout || freqData.totalEnergy <= 150) return;

    let particleCount = Math.floor(map(freqData.totalEnergy, 150, 255,
        responsiveLayout.getResponsiveValue(5, 3, 4, 6),
        responsiveLayout.getResponsiveValue(15, 10, 12, 18)));

    for (let i = 0; i < particleCount; i++) {
        let x = random(width * responsiveLayout.getResponsiveValue(0.2, 0.25, 0.2, 0.15),
            width * responsiveLayout.getResponsiveValue(0.8, 0.75, 0.8, 0.85));
        let y = random(height * responsiveLayout.getResponsiveValue(0.3, 0.35, 0.3, 0.25),
            height * responsiveLayout.getResponsiveValue(0.7, 0.65, 0.7, 0.75));

        let hue = map(freqData.dominantFreq, 20, 22050, 0, 360);
        let size = random(responsiveLayout.particleSizeMin, responsiveLayout.particleSizeMax);

        fill(hue, 100, 80, 100);
        noStroke();
        ellipse(x, y, size, size);
    }
}

function drawWaveform() {
    let waveform = fft.waveform(4096); // 采样点数提升，填满全屏
    let grad = drawingContext.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, 'rgba(102,126,234,0.12)');
    grad.addColorStop(1, 'rgba(118,75,162,0.18)');
    drawingContext.save();
    drawingContext.fillStyle = grad;
    drawingContext.fillRect(0, 0, width, height);
    drawingContext.restore();
    noFill();
    strokeWeight(2);
    for (let glow = 8; glow > 0; glow -= 2) {
        let alpha = map(glow, 8, 0, 30, 200);
        stroke(102, 126, 234, alpha);
        beginShape();
        for (let i = 0; i < waveform.length; i++) {
            let px = map(i, 0, waveform.length, 0, width);
            let py = map(waveform[i], -1, 1, height, 0);
            vertex(px, py);
        }
        endShape();
    }
    // 主体波形
    let mainGrad = drawingContext.createLinearGradient(0, 0, width, 0);
    mainGrad.addColorStop(0, '#667eea');
    mainGrad.addColorStop(1, '#764ba2');
    drawingContext.save();
    drawingContext.shadowColor = '#764ba2';
    drawingContext.shadowBlur = 12;
    drawingContext.strokeStyle = mainGrad;
    drawingContext.lineWidth = 2.5;
    drawingContext.beginPath();
    for (let i = 0; i < waveform.length; i++) {
        let px = map(i, 0, waveform.length, 0, width);
        let py = map(waveform[i], -1, 1, 0, 0);
        if (i === 0) drawingContext.moveTo(px, py);
        else drawingContext.lineTo(px, py);
    }
    drawingContext.stroke();
    drawingContext.restore();
}

function drawMenu() {
    if (!showMenu) return;

    // 固定在画面底部，60%透明度
    fill(0, 0, 0, 153); // 153 = 255 * 0.6 (60%透明度)
    rect(0, height - 120, width, 120);

    // 添加顶部边框
    stroke(255, 255, 255, 0.3);
    strokeWeight(1);
    line(0, height - 120, width, height - 120);
    noStroke();

    fill(255);
    textSize(24);
    text("Audio Visualizer System", width / 2, height - 90);

    textSize(18);
    for (let i = 0; i < visualModes.length; i++) {
        if (i === currentMode) {
            fill(100, 255, 100);
        } else {
            fill(255);
        }
        text(visualModes[i], width / 2, height - 60 + i * 30);
    }


}

function drawPlayPrompt() {
    // 播放提示功能已移除
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);

    // 更新响应式布局
    if (responsiveLayout) {
        responsiveLayout.updateLayout();
    }
}

function keyPressed() {
    // 重新加载音频文件快捷键 (R键)
    if (key === 'r' || key === 'R') {
        reloadAudioFiles();
        return false;
    }

    // 播放控制快捷键 - 空格键播放/暂停
    if (key === ' ') {
        togglePlay();
        return false;
    }

    // 上一首 (左箭头键)
    if (keyCode === LEFT_ARROW) {
        previousSong();
        return false;
    }

    // 下一首 (右箭头键)
    if (keyCode === RIGHT_ARROW) {
        nextSong();
        return false;
    }

    // 静音切换 (M键)
    if (key === 'm' || key === 'M') {
        toggleMute();
        return false;
    }

    // 切换播放模式 (L键)
    if (key === 'l' || key === 'L') {
        togglePlaybackMode();
        return false;
    }

    if (showMenu) {
        if (keyCode === UP_ARROW) {
            currentMode = (currentMode - 1 + visualModes.length) % visualModes.length;
            updateModeButtons();
        }
        if (keyCode === DOWN_ARROW) {
            currentMode = (currentMode + 1) % visualModes.length;
            updateModeButtons();
        }
        if (keyCode === ENTER) {
            showMenu = false;
        }
    }

    // 太阳系控制快捷键
    if (key === 'o' || key === 'O') {
        showOrbits = !showOrbits;
        return false;
    }

    if (key === 'i' || key === 'I') {
        showPlanetInfo = !showPlanetInfo;
        return false;
    }

    if (key === 'n' || key === 'N') {
        showPlanetNames = !showPlanetNames;
        return false;
    }

    if (key === 'n' || key === 'N') {
        nextSong();
    }

    if (key === 'p' || key === 'P') {
        previousSong();
    }

    // Play/pause with any key (except space, n, p)
    if (isReady && key !== ' ' && key !== 'n' && key !== 'N' && key !== 'p' && key !== 'P') {
        togglePlay();
    }

    return false; // Prevent default key behavior
}

function doubleClicked() {
    // Switch visualization mode on double click
    currentMode = (currentMode + 1) % visualModes.length;
    updateModeButtons();
}

// ===== 整合plant.js的鼠标交互功能 =====

function mousePressed() {
    if (hasError) return;

    // 检查是否点击了太阳系控制面板
    if (mouseX < 230 && mouseY < 250) {
        if (mouseY > 55 && mouseY < 75) {
            showOrbits = !showOrbits;
        } else if (mouseY > 75 && mouseY < 95) {
            showPlanetInfo = !showPlanetInfo;
        } else if (mouseY > 95 && mouseY < 115) {
            showPlanetNames = !showPlanetNames;
        }
    }
}

// 鼠标滚轮控制动画速度
function mouseWheel(event) {
    // 调节太阳系动画速度
    animationSpeed += event.delta * 0.001;
    animationSpeed = constrain(animationSpeed, 0.1, 3.0);
    return false;
}

// 鼠标移动检测悬停
function mouseMoved() {
    // 悬停检测在drawSolarSystemPlanets函数中处理
    return false;
}

class Particle {
    constructor() {
        this.reset();
        this.originalSize = baseParticleSize;
        this.maxSpeed = random(1, 2);
        this.freqBin = int(random(5, 100));
        this.assignColorByFrequency();

        // 音乐响应属性
        this.bassResponse = random(0.5, 1.5);    // 低音响应系数
        this.trebleResponse = random(0.5, 1.5);  // 高音响应系数
        this.pulsePhase = random(TWO_PI);        // 脉冲相位
        this.ripplePhase = random(TWO_PI);       // 涟漪相位
        this.lastKickTime = 0;
        this.kickVelocity = createVector(0, 0);
    }

    assignColorByFrequency() {
        if (this.freqBin < 30) {
            this.color = color(100, 150, 255, 200);
        } else if (this.freqBin < 60) {
            this.color = color(200, 100, 255, 200);
        } else {
            this.color = color(255, 180, 50, 200);
        }
    }

    reset() {
        this.pos = createVector(random(width), random(height));
        this.vel = p5.Vector.random2D().mult(random(0.2, 0.8));
        this.acc = createVector(0, 0);
        this.size = baseParticleSize;
        this.sizeFactor = 1;
        this.sizeVelocity = 0;
        this.sizeAcceleration = 0;
        this.wanderAngle = random(TWO_PI);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update(level, spectrum) {
        let freqAmp = spectrum[this.freqBin] || 0;
        this.influence(level, freqAmp);
        this.interactWithMouse();
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.edges();
    }

    influence(level, freqAmp) {
        // 基础频率响应
        let targetSizeFactor = map(freqAmp, 0, 255, 1, 3.5);
        this.sizeAcceleration = (targetSizeFactor - this.sizeFactor) * 0.1;
        this.sizeVelocity += this.sizeAcceleration;
        this.sizeVelocity *= 0.8;
        this.sizeFactor += this.sizeVelocity;
        this.size = this.originalSize * this.sizeFactor;

        // 音乐响应增强
        this.respondToMusic(level, freqAmp);

        // 颜色变化
        this.updateColor(freqAmp);

        // 基础游荡行为
        let wanderForce = p5.Vector.fromAngle(this.wanderAngle).mult(0.02);
        this.applyForce(wanderForce);
        this.wanderAngle += random(-0.05, 0.05);
    }

    // 音乐响应增强方法
    respondToMusic(level, freqAmp) {
        // 低音重击响应
        if (level > musicResponseConfig.bassKickThreshold) {
            this.respondToBassKick(level);
        }

        // 高音响应
        if (this.freqBin > 50) {
            this.respondToTreble(freqAmp);
        }

        // 脉冲效果
        if (musicResponseConfig.pulseEffect) {
            this.applyPulseEffect(level);
        }

        // 涟漪效果
        if (musicResponseConfig.rippleEffect) {
            this.applyRippleEffect(level);
        }
    }

    // 低音重击响应
    respondToBassKick(level) {
        let kickForce = level * musicResponseConfig.bassKickForce * this.bassResponse;
        let center = createVector(width / 2, height / 2);
        let toCenter = p5.Vector.sub(center, this.pos);
        let distance = toCenter.mag();

        if (distance < musicResponseConfig.bassKickRadius) {
            // 向外跳跃
            let outwardForce = p5.Vector.sub(this.pos, center);
            outwardForce.normalize();
            outwardForce.mult(kickForce * (1 - distance / musicResponseConfig.bassKickRadius));

            // 添加随机性
            let randomAngle = random(-PI / 4, PI / 4);
            outwardForce.rotate(randomAngle);

            this.applyForce(outwardForce);
            this.kickVelocity.add(outwardForce);

            // 记录重击时间
            this.lastKickTime = millis();
        }
    }

    // 高音响应
    respondToTreble(freqAmp) {
        let trebleForce = freqAmp * musicResponseConfig.trebleResponse * this.trebleResponse / 255;
        let randomDirection = p5.Vector.random2D();
        randomDirection.mult(trebleForce);
        this.applyForce(randomDirection);
    }

    // 脉冲效果
    applyPulseEffect(level) {
        let pulse = sin(millis() * 0.01 + this.pulsePhase) * level * 0.5;
        this.sizeFactor += pulse * 0.1;
        this.sizeFactor = constrain(this.sizeFactor, 0.5, 4.0);
    }

    // 涟漪效果
    applyRippleEffect(level) {
        let ripple = sin(millis() * 0.005 + this.ripplePhase) * level * 0.3;
        let rippleForce = p5.Vector.random2D().mult(ripple * 0.5);
        this.applyForce(rippleForce);
    }

    // 更新颜色 - 保持原有颜色，只调整透明度
    updateColor(freqAmp) {
        // 保持原有颜色，只调整透明度
        let alpha = map(freqAmp, 0, 255, 100, 255);
        this.color.setAlpha(alpha);
    }

    interactWithMouse() {
        let mousePos = createVector(mouseX, mouseY);
        let distanceToMouse = p5.Vector.dist(this.pos, mousePos);

        if (distanceToMouse < repulsionRadius) {
            let repelForce = p5.Vector.sub(this.pos, mousePos);
            repelForce.normalize();
            let strength = mouseIsPressed ? repulsionStrength * 1.5 : repulsionStrength;
            repelForce.mult(strength * (1 - distanceToMouse / repulsionRadius));
            this.applyForce(repelForce);
        }

        let center = createVector(width / 2, height / 2);
        let toCenter = p5.Vector.sub(center, this.pos);
        toCenter.normalize().mult(attractionStrength);
        this.applyForce(toCenter);

        this.vel.mult(dampingFactor);
    }

    show() {
        // 计算重击后的发光效果
        let kickGlow = 0;
        if (millis() - this.lastKickTime < 200) {
            kickGlow = map(millis() - this.lastKickTime, 0, 200, 1, 0);
        }

        // 绘制发光效果
        if (kickGlow > 0) {
            drawingContext.shadowBlur = 20 * kickGlow;
            drawingContext.shadowColor = this.color;
        }

        // 绘制粒子
        noStroke();
        fill(this.color);
        ellipse(this.pos.x, this.pos.y, this.size);

        // 重击后的额外光晕
        if (kickGlow > 0) {
            fill(this.color);
            ellipse(this.pos.x, this.pos.y, this.size * (1 + kickGlow * 0.5));
        }

        // 重置阴影
        drawingContext.shadowBlur = 0;

        // 绘制连接线时的发光效果
        if (kickGlow > 0) {
            stroke(this.color);
            strokeWeight(2 * kickGlow);
            noFill();
            ellipse(this.pos.x, this.pos.y, this.size * 2);
        }
    }

    connect(other) {
        const d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        if (d < maxDistance) {
            // 计算连接线的强度
            let connectionStrength = map(d, 0, maxDistance, 1, 0);
            let alpha = map(d, 0, maxDistance, 255, 0);

            // 重击后的连接线增强
            let kickEnhancement = 0;
            if (millis() - this.lastKickTime < 300 || millis() - other.lastKickTime < 300) {
                kickEnhancement = 1;
            }

            // 绘制连接线
            if (kickEnhancement > 0) {
                // 发光连接线
                stroke(red(this.color), green(this.color), blue(this.color), alpha);
                strokeWeight(3);
                line(this.pos.x, this.pos.y, other.pos.x, other.pos.y);

                // 额外的光晕线
                stroke(red(this.color), green(this.color), blue(this.color), alpha * 0.3);
                strokeWeight(1);
                line(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            } else {
                // 普通连接线
                stroke(red(this.color), green(this.color), blue(this.color), alpha);
                strokeWeight(1);
                line(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            }
        }
    }

    edges() {
        if (this.pos.x < 0 || this.pos.x > width) {
            this.vel.x *= -0.8;
            this.pos.x = constrain(this.pos.x, 0, width);
        }
        if (this.pos.y < 0 || this.pos.y > height) {
            this.vel.y *= -0.8;
            this.pos.y = constrain(this.pos.y, 0, height);
        }
    }
}

class Needles {
    constructor() {
        this.freqs = ["bass", "lowMid", "mid", "highMid", "treble"];
        this.colors = [
            color(255, 80, 80),    // Red for bass
            color(255, 160, 60),   // Orange for lowMid
            color(100, 220, 100),  // Green for mid
            color(80, 180, 255),   // Blue for highMid
            color(180, 100, 255)   // Purple for treble
        ];

        this.fft = new p5.FFT();
        this.smoothEnergy = new Array(this.freqs.length).fill(0);
        this.ecgData = this.freqs.map(() => []);
        this.ecgMaxLength = 200;

        this.needleLength = 100;  // Increased length for better visibility
        this.scaleRadius = 80;
        this.scaleStartAngle = -PI / 2;
        this.scaleEndAngle = PI / 2;

        this.alarmThresholds = [220, 210, 200, 190, 180];
        this.alarmStates = new Array(this.freqs.length).fill(false);
        this.alarmTimers = new Array(this.freqs.length).fill(0);

        // Add frequency labels
        this.freqLabels = ["60-250Hz", "250-500Hz", "500-2kHz", "2k-4kHz", "4k-16kHz"];
    }

    draw() {
        this.fft.analyze();

        let panelWidth = width / this.freqs.length;
        let panelHeight = height * 0.75;
        let panelBottom = height * 0.9;
        let ecgHeight = 80;  // Increased ECG height

        for (let i = 0; i < this.freqs.length; i++) {
            let panelX = panelWidth * i;
            let panelCenterX = panelX + panelWidth / 2;

            let rawEnergy = this.fft.getEnergy(this.freqs[i]);
            this.smoothEnergy[i] = lerp(this.smoothEnergy[i], rawEnergy, 0.1);

            this.checkAlarm(i, rawEnergy);
            this.drawPanelBackground(panelX, panelBottom - panelHeight, panelWidth, panelHeight, i);
            this.drawMedicalDial(panelCenterX, panelBottom, i);
            this.drawNeedle(panelCenterX, panelBottom, i);
            this.updateECGData(i, this.smoothEnergy[i]);
            this.drawECG(panelX + 20, panelBottom - panelHeight + 30, panelWidth - 40, ecgHeight, i);
            this.drawPanelLabels(panelCenterX, panelBottom - panelHeight + 20, i);
        }
    }

    drawPanelBackground(x, y, w, h, index) {
        push();
        // Gradient background
        let gradient = drawingContext.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, color(20, 20, 30));
        gradient.addColorStop(1, color(10, 10, 15));
        drawingContext.fillStyle = gradient;
        noStroke();
        rect(x, y, w, h, 10);

        // Alarm glow effect
        if (this.alarmStates[index]) {
            this.alarmTimers[index] = (this.alarmTimers[index] + 0.1) % TWO_PI;
            let pulseAlpha = 100 + 50 * sin(this.alarmTimers[index] * 5);
            fill(255, 0, 0, pulseAlpha);
            noStroke();
            rect(x, y, w, h, 10);
        }

        // Colored header
        fill(this.colors[index]);
        noStroke();
        rect(x, y, w, 10, 10, 10, 0, 0);
        pop();
    }

    drawMedicalDial(cx, cy, index) {
        push();
        translate(cx, cy);

        // Outer glow
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = color(red(this.colors[index]),
            green(this.colors[index]),
            blue(this.colors[index]), 100);

        // Dial background
        noFill();
        stroke(40);
        strokeWeight(12);
        arc(0, 0, this.scaleRadius * 2 + 20, this.scaleRadius * 2 + 20,
            this.scaleStartAngle, this.scaleEndAngle);

        // Ticks
        stroke(120);
        strokeWeight(2);
        for (let a = this.scaleStartAngle; a <= this.scaleEndAngle; a += PI / 12) {
            let inner = this.scaleRadius - 10;
            let outer = this.scaleRadius + 10;
            line(cos(a) * inner, sin(a) * inner, cos(a) * outer, sin(a) * outer);
        }

        // Labels
        fill(200);
        noStroke();
        textSize(12);
        textAlign(CENTER, CENTER);
        for (let p = 0; p <= 100; p += 20) {
            let angle = map(p, 0, 100, this.scaleStartAngle, this.scaleEndAngle);
            let r = this.scaleRadius + 25;
            text(p, cos(angle) * r, sin(angle) * r);
        }

        // Center dot
        fill(80);
        ellipse(0, 0, 10);

        drawingContext.shadowBlur = 0;
        pop();
    }

    drawNeedle(cx, cy, index) {
        push();
        translate(cx, cy);

        let energy = this.smoothEnergy[index];
        let angle = map(energy, 0, 255, this.scaleStartAngle, this.scaleEndAngle);

        // Needle glow
        drawingContext.shadowBlur = 10;
        drawingContext.shadowColor = this.colors[index];

        // Needle
        stroke(this.colors[index]);
        strokeWeight(3);
        line(0, 0, cos(angle) * this.needleLength, sin(angle) * this.needleLength);

        // Needle tip
        fill(this.colors[index]);
        noStroke();
        ellipse(cos(angle) * this.needleLength, sin(angle) * this.needleLength, 10);

        // Center
        fill(180);
        ellipse(0, 0, 15);

        drawingContext.shadowBlur = 0;
        pop();
    }

    checkAlarm(index, energy) {
        if (energy > this.alarmThresholds[index]) {
            if (!this.alarmStates[index]) {
                this.alarmStates[index] = true;
            }
        } else if (this.alarmStates[index]) {
            this.alarmStates[index] = false;
            this.alarmTimers[index] = 0;
        }
    }

    updateECGData(index, energy) {
        let ecgValue = this.calculateECGValue(index, energy);
        this.ecgData[index].push(ecgValue);

        if (this.ecgData[index].length > this.ecgMaxLength) {
            this.ecgData[index].shift();
        }
    }

    calculateECGValue(index, energy) {
        let frameCountMod = frameCount % 120;
        let baseValue = 0;

        // More realistic ECG pattern
        if (frameCountMod < 10) baseValue = 0;
        else if (frameCountMod < 15) baseValue = -5;
        else if (frameCountMod < 20) baseValue = 30;
        else if (frameCountMod < 25) baseValue = 10;
        else if (frameCountMod < 30) baseValue = 25;
        else if (frameCountMod < 40) baseValue = -10;
        else if (frameCountMod < 50) baseValue = 5;
        else baseValue = 0;

        // Audio reactivity
        let energyFactor = map(energy, 0, 255, 0.7, 1.5);
        baseValue *= energyFactor;

        // Add some noise
        baseValue += random(-2, 2);

        return baseValue;
    }

    drawECG(x, y, w, h, index) {
        push();
        translate(x, y);

        // Grid background
        stroke(40);
        strokeWeight(1);
        for (let i = 0; i <= w; i += w / 10) line(i, 0, i, h);
        for (let j = 0; j <= h; j += h / 5) line(0, j, w, j);

        // Center line
        stroke(80, 100);
        line(0, h / 2, w, h / 2);

        // ECG line
        beginShape();
        stroke(this.colors[index]);
        strokeWeight(2);
        noFill();
        for (let i = 0; i < this.ecgData[index].length; i++) {
            let px = map(i, 0, this.ecgData[index].length - 1, 0, w);
            let py = map(this.ecgData[index][i], -15, 35, h, 0);
            vertex(px, py);
        }
        endShape();

        // Current position indicator
        if (this.ecgData[index].length > 1) {
            let lastX = map(this.ecgData[index].length - 1, 0, this.ecgMaxLength - 1, 0, w);
            let lastY = map(this.ecgData[index][this.ecgData[index].length - 1], -15, 35, h, 0);

            // Glow effect
            drawingContext.shadowBlur = 10;
            drawingContext.shadowColor = this.colors[index];

            fill(this.colors[index]);
            noStroke();
            ellipse(lastX, lastY, 8);

            drawingContext.shadowBlur = 0;
        }

        // Label
        fill(200);
        noStroke();
        textSize(12);
        textAlign(LEFT);
        text("HZ", 5, 15);
        pop();
    }

    drawPanelLabels(cx, y, index) {
        push();

        // Frequency range label
        fill(180);
        textSize(12);
        textAlign(CENTER);
        text(this.freqLabels[index], cx, y);

        // Frequency name
        fill(this.colors[index]);
        textSize(16);
        text(this.freqs[index], cx, y + 20);

        // Energy value
        let energy = this.smoothEnergy[index];
        fill(255);
        textSize(20);
        text(nf(energy, 3, 0), cx, y + 45);

        // Unit label
        fill(180);
        textSize(12);
        text("Energy Level", cx, y + 65);

        // Alert indicator
        if (this.alarmStates[index]) {
            let pulse = 100 + 50 * sin(this.alarmTimers[index] * 5);
            fill(255, 0, 0, pulse);
            textSize(18);
            text("PEAK!", cx, y + 90);
        }

        pop();
    }
}

// 添加错误恢复和状态检查功能

// 检查系统状态
function checkSystemStatus() {
    const status = {
        equalizer: {
            initialized: eqFilters.length > 0,
            controls: document.querySelectorAll('.eq-slider').length,
            values: eqValues.filter(v => !isNaN(v) && v >= -12 && v <= 12).length
        },

        audio: {
            ready: isReady,
            playing: isPlaying,
            sample: !!sample,
            fft: !!fft
        }
    };

    console.log('System status check:', status);
    return status;
}

// 错误恢复机制
function recoverFromError() {
    console.log('Attempting to recover from error...');

    try {
        // Reinitialize equalizer
        if (eqFilters.length === 0) {
            console.log('Reinitializing equalizer...');
            initEqualizer();
        }



        // Reset abnormal values
        eqValues = eqValues.map(value => {
            if (isNaN(value) || value < -12 || value > 12) {
                return 0;
            }
            return value;
        });

        // Update UI
        updateEqualizerUI();

        console.log('Error recovery completed');

    } catch (error) {
        console.error('Error recovery failed:', error);
    }
}

// Periodic status check
setInterval(() => {
    if (isReady && isPlaying) {
        const status = checkSystemStatus();

        // If problems detected, try to recover
        if (status.equalizer.values < 10) {
            console.warn('Equalizer anomaly detected, attempting recovery...');
            recoverFromError();
        }
    }
}, 10000); // Check every 10 seconds

// Equalizer test function
function testEqualizer() {
    console.log('=== Equalizer Test Started ===');

    // Test variables
    console.log('eqValues:', eqValues);
    console.log('eqFrequencies:', eqFrequencies);
    console.log('eqFilters:', eqFilters);
    console.log('eqInteractionState:', eqInteractionState);

    // Test DOM elements
    const elements = {
        triggerArea: document.getElementById('eqTriggerArea'),
        equalizerContainer: document.getElementById('equalizerContainer'),
        iconHint: document.getElementById('eqIconHint'),
        closeBtn: document.getElementById('eqCloseBtn'),
        sliders: [],
        values: [],
        presetButtons: []
    };

    // Check sliders
    for (let i = 1; i <= 10; i++) {
        elements.sliders.push(document.getElementById(`eqSlider${i}`));
        elements.values.push(document.getElementById(`eqValue${i}`));
    }

    // Check preset buttons
    const presetIds = ['eqReset', 'eqBass', 'eqTreble', 'eqVocal'];
    presetIds.forEach(id => {
        elements.presetButtons.push(document.getElementById(id));
    });

    console.log('DOM element check results:', elements);

    // Test slider functionality
    console.log('Testing slider functionality...');
    elements.sliders.forEach((slider, index) => {
        if (slider) {
            console.log(`Slider ${index + 1} exists, current value: ${slider.value}`);
            // Simulate value change
            const testValue = Math.floor(Math.random() * 25) - 12;
            slider.value = testValue;
            slider.dispatchEvent(new Event('input'));
        }
    });

    console.log('=== Equalizer Test Completed ===');
}

// 在调试接口中添加测试函数
window.audioSystem = {
    checkStatus: checkSystemStatus,
    recover: recoverFromError,
    resetEqualizer: resetEqualizer,
    applyBassPreset: applyBassPreset,
    applyTreblePreset: applyTreblePreset,
    applyVocalPreset: applyVocalPreset,
    // 均衡器交互控制
    showEqualizer: showEqualizer,
    hideEqualizer: hideEqualizer,
    fixEqualizer: fixEqualizer,
    toggleEqualizer: () => {
        if (eqInteractionState.isVisible) {
            hideEqualizer();
        } else {
            showEqualizer();
        }
    },
    // 音乐响应控制
    musicResponse: {
        config: musicResponseConfig,
        reset: resetMusicResponseConfig,
        setBassKick: (threshold, force, radius) => {
            musicResponseConfig.bassKickThreshold = threshold;
            musicResponseConfig.bassKickForce = force;
            musicResponseConfig.bassKickRadius = radius;
        },
        setTrebleResponse: (response, radius) => {
            musicResponseConfig.trebleResponse = response;
            musicResponseConfig.trebleRadius = radius;
        },
        toggleEffects: (pulse, ripple, colorShift) => {
            musicResponseConfig.pulseEffect = pulse;
            musicResponseConfig.rippleEffect = ripple;
            musicResponseConfig.colorShift = colorShift;
        }
    },
    // 测试函数
    testEqualizer: testEqualizer
};

// 高级音频系统
class AdvancedAudioSystem {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.filters = {
            lowpass: null,
            highpass: null,
            compressor: null
        };
        this.effects = {
            reverb: null,
            delay: null,
            distortion: null
        };
        this.config = {
            playbackSpeed: 1.0,
            fadeTime: 1.0,
            reverb: 20,
            lowpass: 20000,
            highpass: 20,
            compressor: -20
        };
        this.visualizationConfig = {
            particleCount: 300,
            particleSize: 3,
            connectionDistance: 100,
            colorSpeed: 1.0,
            musicResponse: 1.0
        };
        this.audioData = {
            level: 0,
            bassEnergy: 0,
            trebleEnergy: 0,
            peakLevel: -60,
            rmsLevel: -60,
            dynamicRange: 0,
            snr: 0
        };
        this.init();
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;

            this.setupFilters();
            this.setupEffects();

            console.log('Advanced audio system initialized successfully');
        } catch (error) {
            console.error('Advanced audio system initialization failed:', error);
        }
    }

    setupFilters() {
        // 低通滤波器
        this.filters.lowpass = this.audioContext.createBiquadFilter();
        this.filters.lowpass.type = 'lowpass';
        this.filters.lowpass.frequency.value = this.config.lowpass;
        this.filters.lowpass.Q.value = 1;

        // 高通滤波器
        this.filters.highpass = this.audioContext.createBiquadFilter();
        this.filters.highpass.type = 'highpass';
        this.filters.highpass.frequency.value = this.config.highpass;
        this.filters.highpass.Q.value = 1;

        // 压缩器
        this.filters.compressor = this.audioContext.createDynamicsCompressor();
        this.filters.compressor.threshold.value = this.config.compressor;
        this.filters.compressor.knee.value = 40;
        this.filters.compressor.ratio.value = 12;
        this.filters.compressor.attack.value = 0;
        this.filters.compressor.release.value = 0.25;
    }

    setupEffects() {
        // 混响效果
        this.effects.reverb = this.audioContext.createConvolver();
        this.createReverbImpulse();

        // 延迟效果
        this.effects.delay = this.audioContext.createDelay(5.0);
        this.effects.delay.delayTime.value = 0.3;

        // 失真效果
        this.effects.distortion = this.audioContext.createWaveShaper();
        this.createDistortionCurve();
    }

    createReverbImpulse() {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * 2; // 2秒混响
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.5));
            }
        }

        this.effects.reverb.buffer = impulse;
    }

    createDistortionCurve() {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;

        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + 20) * x * 20 * deg) / (Math.PI + 20 * Math.abs(x));
        }

        this.effects.distortion.curve = curve;
        this.effects.distortion.oversample = '4x';
    }

    connectAudioNode(node) {
        if (this.audioContext && node) {
            // 连接音频节点链
            node.connect(this.filters.highpass);
            this.filters.highpass.connect(this.filters.lowpass);
            this.filters.lowpass.connect(this.filters.compressor);
            this.filters.compressor.connect(this.effects.reverb);
            this.effects.reverb.connect(this.effects.delay);
            this.effects.delay.connect(this.effects.distortion);
            this.effects.distortion.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
        }
    }

    updateAudioData() {
        if (this.analyser) {
            const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            const timeArray = new Uint8Array(this.analyser.frequencyBinCount);

            this.analyser.getByteFrequencyData(dataArray);
            this.analyser.getByteTimeDomainData(timeArray);

            // 计算音频级别
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            this.audioData.level = sum / (dataArray.length * 255);

            // 计算低音能量 (20Hz - 250Hz)
            let bassSum = 0;
            const bassStart = Math.floor(20 * this.analyser.frequencyBinCount / (this.audioContext.sampleRate / 2));
            const bassEnd = Math.floor(250 * this.analyser.frequencyBinCount / (this.audioContext.sampleRate / 2));
            for (let i = bassStart; i < bassEnd && i < dataArray.length; i++) {
                bassSum += dataArray[i];
            }
            this.audioData.bassEnergy = bassSum / ((bassEnd - bassStart) * 255);

            // 计算高音能量 (4kHz - 20kHz)
            let trebleSum = 0;
            const trebleStart = Math.floor(4000 * this.analyser.frequencyBinCount / (this.audioContext.sampleRate / 2));
            const trebleEnd = Math.floor(20000 * this.analyser.frequencyBinCount / (this.audioContext.sampleRate / 2));
            for (let i = trebleStart; i < trebleEnd && i < dataArray.length; i++) {
                trebleSum += dataArray[i];
            }
            this.audioData.trebleEnergy = trebleSum / ((trebleEnd - trebleStart) * 255);

            // 计算峰值和RMS
            let peak = -60;
            let rms = 0;
            for (let i = 0; i < timeArray.length; i++) {
                const amplitude = (timeArray[i] - 128) / 128;
                const db = 20 * Math.log10(Math.abs(amplitude));
                if (db > peak) peak = db;
                rms += amplitude * amplitude;
            }
            this.audioData.peakLevel = peak;
            this.audioData.rmsLevel = 20 * Math.log10(Math.sqrt(rms / timeArray.length));
            this.audioData.dynamicRange = this.audioData.peakLevel - this.audioData.rmsLevel;
            this.audioData.snr = this.audioData.rmsLevel - (-90); // 假设噪声底为-90dB
        }
    }

    // 配置方法
    setPlaybackSpeed(speed) {
        this.config.playbackSpeed = speed;
        if (this.source && this.source.playbackRate) {
            this.source.playbackRate.value = speed;
        }
    }

    setFadeTime(time) {
        this.config.fadeTime = time;
    }

    setReverb(level) {
        this.config.reverb = level;
        if (this.effects.reverb) {
            this.effects.reverb.gain = this.audioContext.createGain();
            this.effects.reverb.gain.gain.value = level / 100;
        }
    }

    setLowpass(freq) {
        this.config.lowpass = freq;
        if (this.filters.lowpass) {
            this.filters.lowpass.frequency.value = freq;
        }
    }

    setHighpass(freq) {
        this.config.highpass = freq;
        if (this.filters.highpass) {
            this.filters.highpass.frequency.value = freq;
        }
    }

    setCompressor(threshold) {
        this.config.compressor = threshold;
        if (this.filters.compressor) {
            this.filters.compressor.threshold.value = threshold;
        }
    }

    // 可视化配置方法
    setParticleCount(count) {
        this.visualizationConfig.particleCount = count;
        if (window.particleSystem) {
            window.particleSystem.setParticleCount(count);
        }
    }

    setParticleSize(size) {
        this.visualizationConfig.particleSize = size;
        if (window.particleSystem) {
            window.particleSystem.setParticleSize(size);
        }
    }

    setConnectionDistance(distance) {
        this.visualizationConfig.connectionDistance = distance;
        if (window.particleSystem) {
            window.particleSystem.setConnectionDistance(distance);
        }
    }

    setColorSpeed(speed) {
        this.visualizationConfig.colorSpeed = speed;
        if (window.particleSystem) {
            window.particleSystem.setColorSpeed(speed);
        }
    }

    setMusicResponse(response) {
        this.visualizationConfig.musicResponse = response;
        if (window.particleSystem) {
            window.particleSystem.setMusicResponse(response);
        }
    }

    // 获取方法
    getAudioData() {
        return this.audioData;
    }

    getAudioConfig() {
        return this.config;
    }

    getVisualizationConfig() {
        return this.visualizationConfig;
    }

    // 音频处理
    processAudio(audioBuffer) {
        if (this.audioContext && audioBuffer) {
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = audioBuffer;
            this.source.playbackRate.value = this.config.playbackSpeed;

            this.connectAudioNode(this.source);

            // 应用淡入淡出
            if (this.config.fadeTime > 0) {
                const gainNode = this.audioContext.createGain();
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + this.config.fadeTime);
                gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + audioBuffer.duration - this.config.fadeTime);

                this.source.connect(gainNode);
                gainNode.connect(this.filters.highpass);
            }

            return this.source;
        }
        return null;
    }
}

// 增强的粒子系统
class EnhancedParticleSystem {
    constructor() {
        this.particles = [];
        this.config = {
            count: 300,
            size: 3,
            connectionDistance: 100,
            colorSpeed: 1.0,
            musicResponse: 1.0
        };
        this.audioData = null;
        this.init();
    }

    init() {
        this.createParticles();
        console.log('Enhanced particle system initialization completed');
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.count; i++) {
            this.particles.push(new EnhancedParticle());
        }
    }

    update(audioData) {
        this.audioData = audioData;
        this.particles.forEach(particle => {
            particle.update(audioData, this.config);
        });
    }

    draw() {
        this.particles.forEach(particle => {
            particle.draw();
        });
        this.drawConnections();
    }

    drawConnections() {
        const ctx = drawingContext;
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].pos.x - this.particles[j].pos.x;
                const dy = this.particles[i].pos.y - this.particles[j].pos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.config.connectionDistance) {
                    const opacity = (1 - distance / this.config.connectionDistance) * 0.3;
                    ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(this.particles[i].pos.x, this.particles[i].pos.y);
                    ctx.lineTo(this.particles[j].pos.x, this.particles[j].pos.y);
                    ctx.stroke();
                }
            }
        }
    }

    // 配置方法
    setParticleCount(count) {
        this.config.count = count;
        this.createParticles();
    }

    setParticleSize(size) {
        this.config.size = size;
        this.particles.forEach(particle => {
            particle.setSize(size);
        });
    }

    setConnectionDistance(distance) {
        this.config.connectionDistance = distance;
    }

    setColorSpeed(speed) {
        this.config.colorSpeed = speed;
        this.particles.forEach(particle => {
            particle.setColorSpeed(speed);
        });
    }

    setMusicResponse(response) {
        this.config.musicResponse = response;
    }
}

// 增强的粒子类
class EnhancedParticle {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(random(-2, 2), random(-2, 2));
        this.acc = createVector(0, 0);
        this.size = 3;
        this.life = 1;
        this.decay = random(0.01, 0.03);
        this.color = color(random(360), 70, 60);
        this.colorSpeed = 1.0;
        this.musicResponse = 1.0;
        this.phase = random(TWO_PI);
    }

    update(audioData, config) {
        if (audioData) {
            // 音乐响应
            const response = config.musicResponse;
            const level = audioData.level * response;
            const bass = audioData.bassEnergy * response;
            const treble = audioData.trebleEnergy * response;

            // 低音响应 - 向外扩散
            if (bass > 0.3) {
                const center = createVector(width / 2, height / 2);
                const direction = p5.Vector.sub(this.pos, center).normalize();
                this.acc.add(direction.mult(bass * 0.5));
            }

            // 高音响应 - 快速振动
            if (treble > 0.4) {
                this.vel.add(createVector(
                    random(-treble, treble) * 0.3,
                    random(-treble, treble) * 0.3
                ));
            }

            // 整体音量响应
            if (level > 0.5) {
                this.size = config.size * (1 + level * 0.5);
                this.life = min(1, this.life + level * 0.1);
            }
        }

        // 物理更新
        this.vel.add(this.acc);
        this.vel.limit(3);
        this.pos.add(this.vel);
        this.acc.mult(0);

        // 边界检查
        if (this.pos.x < 0 || this.pos.x > width) this.vel.x *= -1;
        if (this.pos.y < 0 || this.pos.y > height) this.vel.y *= -1;

        // 生命周期
        this.life -= this.decay;
        if (this.life <= 0) {
            this.reset();
        }

        // 颜色变化
        this.updateColor();
    }

    updateColor() {
        this.phase += 0.02 * this.colorSpeed;
        const hue = (this.phase * 50) % 360;
        this.color = color(hue, 70, 60, this.life * 255);
    }

    draw() {
        const ctx = drawingContext;
        ctx.save();
        ctx.globalAlpha = this.life;

        // 绘制发光效果
        ctx.shadowColor = this.color.toString();
        ctx.shadowBlur = this.size * 2;

        ctx.fillStyle = this.color.toString();
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, TWO_PI);
        ctx.fill();

        ctx.restore();
    }

    reset() {
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(random(-2, 2), random(-2, 2));
        this.acc = createVector(0, 0);
        this.life = 1;
        this.decay = random(0.01, 0.03);
        this.phase = random(TWO_PI);
    }

    setSize(size) {
        this.size = size;
    }

    setColorSpeed(speed) {
        this.colorSpeed = speed;
    }
}

// 初始化高级系统
let advancedAudioSystem;
let enhancedParticleSystem;

function initAdvancedSystems() {
    advancedAudioSystem = new AdvancedAudioSystem();
    enhancedParticleSystem = new EnhancedParticleSystem();

    // 暴露给全局
    window.audioSystem = advancedAudioSystem;
    window.particleSystem = enhancedParticleSystem;

    console.log('Advanced systems initialization completed');
}

// 在setup函数末尾调用
// initAdvancedSystems();

// 在draw函数中更新
function updateAdvancedSystems() {
    if (advancedAudioSystem) {
        advancedAudioSystem.updateAudioData();
    }
    if (enhancedParticleSystem && advancedAudioSystem) {
        enhancedParticleSystem.update(advancedAudioSystem.getAudioData());
    }
}

// 在draw函数末尾调用
// updateAdvancedSystems();

// 在draw函数中绘制增强粒子
function drawEnhancedParticles() {
    if (enhancedParticleSystem) {
        enhancedParticleSystem.draw();
    }
}

// 在draw函数末尾调用
// drawEnhancedParticles();

// 更新可视化信息面板
function updateVisualizerInfo() {
    const info = document.querySelector('.visualizer-info');
    if (!info) return;

    // 获取音频数据
    let audioLevel = 0;
    let bassEnergy = 0;
    let trebleEnergy = 0;

    if (advancedAudioSystem) {
        const audioData = advancedAudioSystem.getAudioData();
        audioLevel = Math.round(audioData.level * 100);
        bassEnergy = Math.round(audioData.bassEnergy * 100);
        trebleEnergy = Math.round(audioData.trebleEnergy * 100);
    }

    // 更新HTML中的显示
    const audioLevelSpan = document.getElementById('audioLevel');
    const bassEnergySpan = document.getElementById('bassEnergy');
    const trebleEnergySpan = document.getElementById('trebleEnergy');

    if (audioLevelSpan) audioLevelSpan.textContent = `${audioLevel}%`;
    if (bassEnergySpan) bassEnergySpan.textContent = `${bassEnergy}%`;
    if (trebleEnergySpan) trebleEnergySpan.textContent = `${trebleEnergy}%`;

    // 更新其他信息
    const currentModeSpan = document.getElementById('currentMode');
    const fpsSpan = document.getElementById('fps');
    const particleCountSpan = document.getElementById('particleCount');

    if (currentModeSpan) {
        const modeNames = ['Particles', 'Spectrum', 'Waveform', 'Needles'];
        currentModeSpan.textContent = modeNames[currentMode] || 'Unknown';
    }

    if (fpsSpan) {
        const currentFPS = Math.round(frameRate());
        fpsSpan.textContent = currentFPS;
    }

    if (particleCountSpan) {
        const count = enhancedParticleSystem ? enhancedParticleSystem.config.count : particles.length;
        particleCountSpan.textContent = count;
    }

    // 更新左侧侧边栏信息
    if (window.updateLeftSidebar) {
        const sidebarData = {
            isPlaying: isPlaying,
            currentSong: songs[currentSongIndex] ? songs[currentSongIndex].name : '无',
            volume: Math.round(volume * 100)
        };
        window.updateLeftSidebar(sidebarData);
    }
}

// 在draw函数中调用updateVisualizerInfo
// updateVisualizerInfo();

// ===== 性能优化函数 =====

// 动态性能调整
function adjustPerformanceMode() {
    let currentFPS = frameRate();

    // 根据当前帧率调整性能模式
    if (currentFPS < 30) {
        // 低性能模式
        performanceMode.reduceParticles = true;
        performanceMode.simplifyBackground = true;
        performanceMode.limitSpectrumBars = true;
        targetFPS = 30;
    } else if (currentFPS < 45) {
        // 中等性能模式
        performanceMode.reduceParticles = true;
        performanceMode.simplifyBackground = false;
        performanceMode.limitSpectrumBars = false;
        targetFPS = 45;
    } else {
        // 高性能模式
        performanceMode.reduceParticles = false;
        performanceMode.simplifyBackground = false;
        performanceMode.limitSpectrumBars = false;
        targetFPS = 60;
    }

    frameInterval = 1000 / targetFPS;
}

// 优化的性能信息更新
function updatePerformanceInfoOptimized() {
    frameCount++;
    let currentTime = performance.now();

    // 只在需要时更新FPS（每秒一次）
    if (frameCount % 60 === 0) {
        fps = Math.round(frameRate());
        lastTime = currentTime;
    }
}

// 优化的粒子系统 - 减少计算量
function drawOptimizedParticles() {
    if (!responsiveLayout || performanceMode.reduceParticles) {
        // 在低性能模式下减少粒子数量
        let particleStep = performanceMode.reduceParticles ? 3 : 1;

        for (let i = 0; i < particles.length; i += particleStep) {
            particles[i].update();
            particles[i].display();
        }
    } else {
        // 正常模式
        for (let particle of particles) {
            particle.update();
            particle.display();
        }
    }
}

// 优化的频谱粒子系统
function drawOptimizedSpectrumParticles(spectrum, freqData) {
    if (!responsiveLayout) return;

    let step = performanceMode.reduceParticles ?
        responsiveLayout.isMobile ? 30 : responsiveLayout.isTablet ? 20 : 15 :
        responsiveLayout.isMobile ? 20 : responsiveLayout.isTablet ? 15 : 10;

    let threshold = performanceMode.reduceParticles ?
        responsiveLayout.isMobile ? 100 : 90 :
        responsiveLayout.isMobile ? 90 : 80;

    for (let i = 0; i < spectrum.length; i += step) {
        let amp = spectrum[i];
        if (amp > threshold) {
            let x = map(i, 0, spectrum.length,
                responsiveLayout.getResponsiveValue(30, 20, 25, 30),
                width - responsiveLayout.getResponsiveValue(30, 20, 25, 30));
            let y = map(amp, threshold, 255, height * 0.6, height * responsiveLayout.getResponsiveValue(0.15, 0.2, 0.15, 0.1));

            let hue = map(i, 0, spectrum.length, 240, 0);
            let size = map(amp, threshold, 255,
                responsiveLayout.particleSizeMin * (performanceMode.reduceParticles ? 0.7 : 1),
                responsiveLayout.particleSizeMax * (performanceMode.reduceParticles ? 0.7 : 1));

            let colorShift = Math.abs(map(i, 0, spectrum.length, 20, 22050) - freqData.dominantFreq) < 1000 ? 30 : 0;

            fill(hue + colorShift, 85, 75, 180);
            noStroke();
            ellipse(x, y, size, size);

            // 在低性能模式下减少拖尾效果
            if (!performanceMode.reduceParticles) {
                for (let j = 1; j < responsiveLayout.trailSteps; j++) {
                    let alpha = 180 - j * responsiveLayout.getResponsiveValue(25, 30, 25, 20);
                    let trailSize = size * (1 - j * responsiveLayout.getResponsiveValue(0.15, 0.2, 0.15, 0.12));
                    let trailY = y + j * responsiveLayout.getResponsiveValue(6, 4, 5, 7);
                    fill(hue + colorShift, 85, 75, alpha);
                    ellipse(x, trailY, trailSize, trailSize);
                }
            }
        }
    }
}

// ===== 动态播放列表管理 =====

// 更新播放列表显示
function updatePlaylistDisplay() {
    const playlistContent = document.querySelector('.playlist-content');
    if (!playlistContent) {
        console.warn('⚠️ 未找到播放列表容器');
        return;
    }

    // 清空现有内容
    playlistContent.innerHTML = '';

    // 生成新的播放列表项
    songNames.forEach((songName, index) => {
        const playlistItem = document.createElement('div');
        playlistItem.className = `playlist-item${index === currentSongIndex ? ' active' : ''}`;
        playlistItem.setAttribute('data-index', index);

        // 创建显示名称（截断长文件名）
        const displayName = songName.length > 30 ?
            songName.substring(0, 27) + '...' :
            songName;

        playlistItem.setAttribute('title', songName);
        playlistItem.textContent = displayName;

        // 添加点击事件
        playlistItem.addEventListener('click', () => {
            selectSong(index);
        });

        playlistContent.appendChild(playlistItem);
    });

    console.log(`📋 Playlist updated, total ${songNames.length} songs`);
}

// 选择歌曲
function selectSong(index) {
    if (index < 0 || index >= songs.length) {
        console.error('❌ 无效的歌曲索引:', index);
        return;
    }

    // 停止当前播放
    if (isPlaying && songs[currentSongIndex]) {
        songs[currentSongIndex].stop();
    }

    // 更新当前歌曲索引
    currentSongIndex = index;

    // 更新UI
    updatePlaylistSelection();
    updatePlayerUI();

    // 开始播放新歌曲
    if (isReady && songs[currentSongIndex]) {
        sample = songs[currentSongIndex];
        sample.setVolume(volume);
        amplitude.setInput(sample);
        fft.setInput(sample);
        if (needles && needles.fft) {
            needles.fft.setInput(sample);
        }

        // 设置单曲循环（如果当前是单曲循环模式）
        if (currentPlaybackMode === PLAYBACK_MODES.LOOP_SINGLE && sample) {
            sample.onended(() => {
                // 重新播放当前歌曲
                if (isReady && songs[currentSongIndex]) {
                    sample = songs[currentSongIndex];
                    sample.setVolume(volume);
                    amplitude.setInput(sample);
                    fft.setInput(sample);
                    if (needles && needles.fft) {
                        needles.fft.setInput(sample);
                    }
                    if (isPlaying) {
                        songs[currentSongIndex].play();
                    }
                }
            });
        } else if (sample) {
            // 为其他模式设置歌曲结束处理
            sample.onended(() => {
                if (currentPlaybackMode === PLAYBACK_MODES.LOOP_LIST) {
                    // Loop list: Auto play next song
                    nextSong();
                } else if (currentPlaybackMode === PLAYBACK_MODES.SHUFFLE) {
                    // Shuffle: Play next random song
                    nextSong();
                } else if (currentPlaybackMode === PLAYBACK_MODES.LOOP_SINGLE) {
                    // Single loop: Replay current song
                    if (isReady && songs[currentSongIndex]) {
                        songs[currentSongIndex].play();
                    }
                }
            });
        }

        if (isPlaying) {
            songs[currentSongIndex].play();
        }
    }

    console.log(`🎵 Switched to song: ${songNames[currentSongIndex]}`);
}

// 更新播放列表选中状态
function updatePlaylistSelection() {
    const playlistItems = document.querySelectorAll('.playlist-item');

    playlistItems.forEach((item, index) => {
        if (index === currentSongIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// 重新加载音频文件（手动调用）
function reloadAudioFiles() {
    console.log('🔄 Manually reloading audio files...');

    // 停止当前播放
    if (isPlaying && songs[currentSongIndex]) {
        songs[currentSongIndex].stop();
        isPlaying = false;
    }

    // 重新加载配置文件
    loadAudioConfig().then(config => {
        if (config) {
            audioFilesConfig = config;
            loadAudioFilesFromConfig();
            updatePlaylistDisplay();
            updatePlayerUI();
            console.log('✅ Audio files reload completed');
        } else {
            console.warn('⚠️ Cannot reload config file');
        }
    });
}

// ===== 整合plant.js的彗星和小行星类 =====

class Comet {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = random(-200, width + 200);
        this.y = random(-200, height + 200);
        this.vx = random(-2, 2);
        this.vy = random(-2, 2);
        this.size = random(1, 3);
        this.life = 255;
        this.trail = [];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 1;

        // 添加轨迹点
        this.trail.push({ x: this.x, y: this.y, life: 255 });

        // 限制轨迹长度
        if (this.trail.length > 20) {
            this.trail.shift();
        }

        // 更新轨迹生命值
        for (let point of this.trail) {
            point.life -= 5;
        }

        // 如果彗星消失或离开屏幕，重置
        if (this.life <= 0 || this.x < -100 || this.x > width + 100 ||
            this.y < -100 || this.y > height + 100) {
            this.reset();
        }
    }

    display() {
        // 绘制轨迹
        for (let i = 0; i < this.trail.length - 1; i++) {
            let alpha = map(this.trail[i].life, 0, 255, 0, 100);
            stroke(255, 255, 255, alpha);
            strokeWeight(1);
            line(this.trail[i].x, this.trail[i].y,
                this.trail[i + 1].x, this.trail[i + 1].y);
        }

        // 绘制彗星头部
        fill(255, 255, 255, this.life);
        noStroke();
        ellipse(this.x, this.y, this.size);
    }
}

class Asteroid {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = random(400, 600);
        this.y = random(height / 2 - 100, height / 2 + 100);
        this.vx = random(-0.5, 0.5);
        this.vy = random(-0.5, 0.5);
        this.size = random(1, 4);
        this.rotation = random(TWO_PI);
        this.rotationSpeed = random(-0.02, 0.02);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        // 边界检查
        if (this.x < 350 || this.x > 650) {
            this.vx *= -1;
        }
        if (this.y < height / 2 - 150 || this.y > height / 2 + 100) {
            this.vy *= -1;
        }
    }

    display() {
        push();
        translate(this.x, this.y);
        rotate(this.rotation);

        fill(150, 150, 150, 150);
        noStroke();
        ellipse(0, 0, this.size);

        // 添加一些细节
        fill(100, 100, 100, 100);
        ellipse(0, 0, this.size * 0.6);

        pop();
    }
}

// ===== 加载页面控制系统 =====

let loadingProgress = 0;
let currentLoadingStep = 0;
const loadingSteps = [
    { name: "Initializing System", duration: 1000, progress: 25 },
    { name: "Loading Planetary Data", duration: 1500, progress: 50 },
    { name: "Preparing Audio Engine", duration: 2000, progress: 75 },
    { name: "Launching Visualization", duration: 1000, progress: 100 }
];

function startLoadingSequence() {
    console.log('🚀 Starting loading sequence...');

    // Show first status item
    updateLoadingStatus(0, true);

    // Start loading sequence
    setTimeout(() => {
        updateLoadingStep(0);
    }, 500);
}

function updateLoadingStep(stepIndex) {
    if (stepIndex >= loadingSteps.length) {
        completeLoading();
        return;
    }

    const step = loadingSteps[stepIndex];
    currentLoadingStep = stepIndex;

    console.log(`📋 Loading step ${stepIndex + 1}: ${step.name}`);

    // Update status item
    updateLoadingStatus(stepIndex, true);

    // Update progress bar
    updateLoadingProgress(step.progress);

    // Delay before next step
    setTimeout(() => {
        // Mark current step as completed
        updateLoadingStatus(stepIndex, false, true);

        // Go to next step
        updateLoadingStep(stepIndex + 1);
    }, step.duration);
}

function updateLoadingStatus(stepIndex, isActive, isCompleted = false) {
    const statusItem = document.getElementById(`statusItem${stepIndex + 1}`);
    if (!statusItem) return;

    if (isCompleted) {
        statusItem.classList.add('completed');
        statusItem.classList.remove('active');
        // Add completion mark
        const icon = statusItem.querySelector('.status-icon');
        if (icon) icon.textContent = '✅';
    } else if (isActive) {
        statusItem.classList.add('active');
        statusItem.classList.remove('completed');
    }
}

function updateLoadingProgress(progress) {
    loadingProgress = progress;

    // 更新进度条
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }

    if (progressText) {
        progressText.textContent = `${progress}%`;
    }

    console.log(`📊 Loading progress: ${progress}%`);
}

function completeLoading() {
    console.log('🎉 Loading completed!');

    // Update final progress
    updateLoadingProgress(100);

    // Delay before hiding loading page
    setTimeout(() => {
        hideLoadingPage();
    }, 1000);
}

function hideLoadingPage() {
    const loadingPage = document.getElementById('loadingPage');
    if (loadingPage) {
        loadingPage.classList.add('hidden');

        // Completely remove loading page
        setTimeout(() => {
            loadingPage.remove();
            console.log('✅ Loading page removed');
        }, 1000);
    }
}

// ===== Enhanced Galaxy Effects =====

// Draw distant galaxies
function drawDistantGalaxies(freqData) {
    let energy = freqData.totalEnergy / 255;

    // Draw 3-5 distant galaxies
    let galaxyCount = responsiveLayout.isMobile ? 3 : 5;

    for (let i = 0; i < galaxyCount; i++) {
        let x = (i * 200 + frameCount * 0.5) % (width + 100) - 50;
        let y = (i * 150 + frameCount * 0.3) % (height + 100) - 50;

        // Galaxy size and brightness
        let size = random(20, 60);
        let brightness = map(energy, 0, 1, 0.3, 0.8);

        // Galaxy types (elliptical, spiral, irregular)
        let galaxyType = i % 3;

        if (galaxyType === 0) {
            // Elliptical galaxy
            drawEllipticalGalaxy(x, y, size, brightness);
        } else if (galaxyType === 1) {
            // Spiral galaxy
            drawSpiralGalaxy(x, y, size, brightness);
        } else {
            // Irregular galaxy
            drawIrregularGalaxy(x, y, size, brightness);
        }
    }
}

// 绘制椭圆星系
function drawEllipticalGalaxy(x, y, size, brightness) {
    drawingContext.save();

    // 创建径向渐变
    let gradient = drawingContext.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, `rgba(255, 200, 100, ${brightness * 0.8})`);
    gradient.addColorStop(0.5, `rgba(200, 150, 80, ${brightness * 0.6})`);
    gradient.addColorStop(1, `rgba(150, 100, 60, ${brightness * 0.2})`);

    drawingContext.fillStyle = gradient;
    drawingContext.beginPath();
    drawingContext.ellipse(x, y, size, size * 0.7, 0, 0, TWO_PI);
    drawingContext.fill();

    drawingContext.restore();
}

// 绘制螺旋星系
function drawSpiralGalaxy(x, y, size, brightness) {
    drawingContext.save();

    // 星系核心
    let coreGradient = drawingContext.createRadialGradient(x, y, 0, x, y, size * 0.3);
    coreGradient.addColorStop(0, `rgba(255, 220, 150, ${brightness * 0.9})`);
    coreGradient.addColorStop(1, `rgba(200, 180, 100, ${brightness * 0.4})`);

    drawingContext.fillStyle = coreGradient;
    drawingContext.beginPath();
    drawingContext.arc(x, y, size * 0.3, 0, TWO_PI);
    drawingContext.fill();

    // 螺旋臂
    for (let arm = 0; arm < 3; arm++) {
        let armAngle = (TWO_PI / 3) * arm + frameCount * 0.01;

        drawingContext.strokeStyle = `rgba(150, 200, 255, ${brightness * 0.6})`;
        drawingContext.lineWidth = 2;
        drawingContext.beginPath();

        for (let r = size * 0.3; r < size; r += 5) {
            let spiralAngle = armAngle + r * 0.02;
            let px = x + cos(spiralAngle) * r;
            let py = y + sin(spiralAngle) * r;

            if (r === size * 0.3) {
                drawingContext.moveTo(px, py);
            } else {
                drawingContext.lineTo(px, py);
            }
        }

        drawingContext.stroke();
    }

    drawingContext.restore();
}

// 绘制不规则星系
function drawIrregularGalaxy(x, y, size, brightness) {
    drawingContext.save();

    // 创建不规则形状
    let gradient = drawingContext.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, `rgba(255, 150, 200, ${brightness * 0.7})`);
    gradient.addColorStop(0.6, `rgba(200, 100, 150, ${brightness * 0.5})`);
    gradient.addColorStop(1, `rgba(150, 50, 100, ${brightness * 0.2})`);

    drawingContext.fillStyle = gradient;
    drawingContext.beginPath();

    // 绘制不规则多边形
    let points = 6;
    for (let i = 0; i < points; i++) {
        let angle = (TWO_PI / points) * i + random(-0.3, 0.3);
        let radius = size * (0.5 + random(0.3, 0.8));
        let px = x + cos(angle) * radius;
        let py = y + sin(angle) * radius;

        if (i === 0) {
            drawingContext.moveTo(px, py);
        } else {
            drawingContext.lineTo(px, py);
        }
    }

    drawingContext.closePath();
    drawingContext.fill();

    drawingContext.restore();
}

// 绘制星团
function drawStarClusters(freqData) {
    let energy = freqData.totalEnergy / 255;

    // 绘制2-4个星团
    let clusterCount = responsiveLayout.isMobile ? 2 : 4;

    for (let i = 0; i < clusterCount; i++) {
        let x = (i * 300 + frameCount * 0.2) % (width + 100) - 50;
        let y = (i * 250 + frameCount * 0.15) % (height + 100) - 50;

        let clusterSize = random(30, 80);
        let starCount = random(15, 30);

        drawStarCluster(x, y, clusterSize, starCount, energy);
    }
}

// 绘制单个星团
function drawStarCluster(x, y, size, starCount, energy) {
    drawingContext.save();

    // 星团背景光晕
    let haloGradient = drawingContext.createRadialGradient(x, y, 0, x, y, size);
    haloGradient.addColorStop(0, `rgba(255, 255, 255, ${energy * 0.1})`);
    haloGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

    drawingContext.fillStyle = haloGradient;
    drawingContext.beginPath();
    drawingContext.arc(x, y, size, 0, TWO_PI);
    drawingContext.fill();

    // 绘制星团中的星星
    for (let j = 0; j < starCount; j++) {
        let starX = x + random(-size * 0.8, size * 0.8);
        let starY = y + random(-size * 0.8, size * 0.8);
        let starSize = random(1, 3);
        let starBrightness = random(0.5, 1) * energy;

        // 星星颜色变化
        let starHue = random(200, 300);
        let starColor = `hsla(${starHue}, 80%, 70%, ${starBrightness})`;

        drawingContext.fillStyle = starColor;
        drawingContext.beginPath();
        drawingContext.arc(starX, starY, starSize, 0, TWO_PI);
        drawingContext.fill();

        // 星星光晕
        if (starSize > 2) {
            drawingContext.shadowColor = starColor;
            drawingContext.shadowBlur = 8;
            drawingContext.beginPath();
            drawingContext.arc(starX, starY, starSize * 2, 0, TWO_PI);
            drawingContext.fill();
            drawingContext.shadowBlur = 0;
        }
    }

    drawingContext.restore();
}