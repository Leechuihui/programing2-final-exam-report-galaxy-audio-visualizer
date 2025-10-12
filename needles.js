// Main sketch file - medical_audio_visualizer.js

// Particle System Class
//Final project submission [002]
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.poolSize = 500;
    this.maxParticles = 300;
    this.spawnRate = 3;
    this.lastSpawnFrame = 0;
    this.initializePool();
  }

  initializePool() {
    for (let i = 0; i < this.poolSize; i++) {
      this.particles.push({
        active: false,
        x: 0, y: 0,
        vx: 0, vy: 0,
        size: 0,
        color: [0, 0, 0, 0],
        life: 0, maxLife: 0,
        freqIndex: 0
      });
    }
  }

  spawnParticles(x, y, energy, freqIndex, count = 1) {
    if (frameCount - this.lastSpawnFrame < 2) return;

    let spawned = 0;
    for (let p of this.particles) {
      if (!p.active && this.getActiveCount() < this.maxParticles) {
        this.activateParticle(p, x, y, energy, freqIndex);
        spawned++;
        if (spawned >= count) break;
      }
    }
    this.lastSpawnFrame = frameCount;
  }

  activateParticle(p, x, y, energy, freqIndex) {
    p.active = true;
    p.x = x + random(-10, 10);
    p.y = y + random(-5, 5);

    let angle = random(TWO_PI);
    let speed = map(energy, 0, 255, 0.3, 3) * random(0.7, 1.3);

    p.vx = cos(angle) * speed;
    p.vy = sin(angle) * speed - 0.5;

    p.size = map(energy, 0, 255, 1, 6) * random(0.8, 1.2);
    p.color = this.getParticleColor(freqIndex, energy);

    p.life = 0;
    p.maxLife = map(energy, 0, 255, 20, 80) * random(0.9, 1.1);
    p.freqIndex = freqIndex;
  }

  getParticleColor(freqIndex, energy) {
    const baseColors = [
      [255, 80, 80],   // Red - bass
      [255, 160, 60],  // Orange - lowMid
      [100, 220, 100], // Green - mid
      [80, 180, 255],  // Blue - highMid
      [180, 100, 255]  // Purple - treble
    ];

    let alpha = map(energy, 0, 255, 30, 150);
    return [...baseColors[freqIndex], alpha];
  }

  update() {
    for (let p of this.particles) {
      if (p.active) {
        p.x += p.vx;
        p.y += p.vy;

        switch (p.freqIndex) {
          case 0: p.vy += 0.05; break;
          case 4: p.vy -= 0.03; break;
        }

        p.vx *= 0.97;
        p.vy *= 0.97;

        p.life++;
        if (p.life > p.maxLife || p.y < -50 || p.y > height + 50 || p.x < -50 || p.x > width + 50) {
          p.active = false;
        }
      }
    }
  }

  draw() {
    for (let freq = 0; freq < 5; freq++) {
      beginShape(POINTS);
      for (let p of this.particles) {
        if (p.active && p.freqIndex === freq) {
          stroke(p.color);
          strokeWeight(p.size);
          vertex(p.x, p.y);
        }
      }
      endShape();
    }
  }

  getActiveCount() {
    let count = 0;
    for (let p of this.particles) {
      if (p.active) count++;
    }
    return count;
  }
}

// Main Visualizer Class
class AudioVisualizer {
  constructor() {
    this.freqs = ["bass", "lowMid", "mid", "highMid", "treble"];
    this.colors = [
      color(255, 80, 80),
      color(255, 160, 60),
      color(100, 220, 100),
      color(80, 180, 255),
      color(180, 100, 255)
    ];

    this.fft = new p5.FFT();
    this.smoothEnergy = new Array(this.freqs.length).fill(0);
    this.ecgData = this.freqs.map(() => []);
    this.ecgMaxLength = 200;

    this.needleLength = 80;
    this.scaleRadius = 70;
    this.scaleStartAngle = -PI / 2.5;
    this.scaleEndAngle = PI / 2.5;

    this.alarmThresholds = [220, 210, 200, 190, 180];
    this.alarmStates = new Array(this.freqs.length).fill(false);

    this.particleSystem = new ParticleSystem();
    this.frameTimes = [];
    this.avgFrameTime = 16;
  }

  update() {
    this.fft.analyze();
    this.particleSystem.update();

    // Dynamic performance adjustment
    let currentTime = performance.now();
    let frameTime = currentTime - this.lastUpdateTime;
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > 60) this.frameTimes.shift();

    this.avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

    if (this.avgFrameTime > 18 && this.particleSystem.maxParticles > 100) {
      this.particleSystem.maxParticles -= 5;
    } else if (this.avgFrameTime < 12 && this.particleSystem.maxParticles < 500) {
      this.particleSystem.maxParticles += 2;
    }

    this.lastUpdateTime = currentTime;
  }

  draw() {
    background(0);

    let panelWidth = width / this.freqs.length;
    let panelHeight = height * 0.7;
    let panelBottom = height * 0.9;

    for (let i = 0; i < this.freqs.length; i++) {
      let panelX = panelWidth * i;
      let panelCenterX = panelX + panelWidth / 2;

      let rawEnergy = this.fft.getEnergy(this.freqs[i]);
      this.smoothEnergy[i] = lerp(this.smoothEnergy[i], rawEnergy, 0.1);

      this.checkAlarm(i, rawEnergy);
      this.drawPanel(panelX, panelCenterX, panelWidth, panelHeight, panelBottom, i);
      this.spawnParticles(panelCenterX, panelBottom, i);
    }

    this.particleSystem.draw();
    this.drawPerformanceInfo();
  }

  drawPanel(x, centerX, w, h, bottom, index) {
    this.drawPanelBackground(x, bottom - h, w, h, index);
    this.drawMedicalDial(centerX, bottom, index);
    this.drawNeedle(centerX, bottom, index);
    this.updateECG(index);
    this.drawECG(x + 20, bottom - h + 20, w - 40, 60, index);
    this.drawPanelLabels(centerX, bottom - h + 15, index);
  }

  spawnParticles(centerX, bottom, index) {
    let energy = this.smoothEnergy[index];
    let angle = map(energy, 0, 255, this.scaleStartAngle, this.scaleEndAngle);
    let tipX = centerX + cos(angle) * this.needleLength;
    let tipY = bottom + sin(angle) * this.needleLength;

    let spawnCount = floor(map(energy, 0, 255, 0, this.particleSystem.spawnRate));
    this.particleSystem.spawnParticles(tipX, tipY, energy, index, spawnCount);
  }

  // ... (All other methods from the Needles class remain the same)
  // Including: drawPanelBackground, drawMedicalDial, drawNeedle, 
  // checkAlarm, updateECGData, calculateECGValue, drawECG, drawPanelLabels
}

// Global Variables
let visualizer;

// p5.js Setup
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255, 255, 255, 255);

  visualizer = new AudioVisualizer();

  let mic = new p5.AudioIn();
  mic.start();
  visualizer.fft.setInput(mic);

  smooth();
  frameRate(60);
}

// p5.js Draw Loop
function draw() {
  visualizer.update();
  visualizer.draw();
}

// Window Resize Handler
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Start/Stop Audio
function mousePressed() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    let audioContext = getAudioContext();
    if (audioContext.state !== 'running') {
      audioContext.resume();
    }
  }
}