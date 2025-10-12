// Planet data - contains detailed information
const planetData = [
  {
    name: "Mercury",
    size: 4,
    color: "#8C7853",
    distance: 50,
    speed: 0.02,
    description: "The planet closest to the Sun, with extremely high surface temperatures",
    moons: 0,
    type: "Rocky Planet"
  },
  {
    name: "Venus",
    size: 9,
    color: "#E7CDCD",
    distance: 175,
    speed: 0.015,
    description: "Known as Earth's sister planet, with a dense atmosphere",
    moons: 0,
    type: "Rocky Planet"
  },
  {
    name: "Earth",
    size: 10,
    color: "#6B93D6",
    distance: 300,
    speed: 0.01,
    description: "Our home, the only known planet with life",
    moons: 1,
    type: "Rocky Planet"
  },
  {
    name: "Mars",
    size: 5,
    color: "#C1440E",
    distance: 425,
    speed: 0.008,
    description: "The Red Planet, humanity's next exploration target",
    moons: 2,
    type: "Rocky Planet"
  },
  {
    name: "Jupiter",
    size: 110,
    color: "#D8CA9D",
    distance: 550,
    speed: 0.005,
    description: "The largest planet in the solar system, famous for its Great Red Spot",
    moons: 79,
    type: "Gas Giant"
  },
  {
    name: "Saturn",
    size: 95,
    color: "#FAD5A5",
    distance: 675,
    speed: 0.004,
    description: "Famous for its beautiful ring system",
    moons: 82,
    type: "Gas Giant"
  },
  {
    name: "Uranus",
    size: 40,
    color: "#4FD0E7",
    distance: 800,
    speed: 0.003,
    description: "Ice giant planet with a highly tilted rotation axis",
    moons: 27,
    type: "Ice Giant"
  },
  {
    name: "Neptune",
    size: 40,
    color: "#4B70DD",
    distance: 925,
    speed: 0.002,
    description: "The farthest planet, with intense storms",
    moons: 14,
    type: "Ice Giant"
  }
];

let planets = [];
let time = 0;
let hoveredPlanet = null;
let showOrbits = true;
let showInfo = true;
let animationSpeed = 1;
let comets = [];
let asteroids = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER);

  // Create planet objects
  for (let i = 0; i < planetData.length; i++) {
    planets.push(new Planet(planetData[i]));
  }

  // Create comets
  for (let i = 0; i < 3; i++) {
    comets.push(new Comet());
  }

  // Create asteroid belt
  for (let i = 0; i < 50; i++) {
    asteroids.push(new Asteroid());
  }
}

function draw() {
  // Create gradient background
  drawStarfield();

  // Draw the Sun
  drawSun();

  // Update and draw asteroid belt
  for (let asteroid of asteroids) {
    asteroid.update();
    asteroid.display();
  }

  // Update and draw all planets
  for (let planet of planets) {
    planet.update();
    planet.display();
  }

  // Update and draw comets
  for (let comet of comets) {
    comet.update();
    comet.display();
  }

  // Draw hover information
  if (hoveredPlanet && showInfo) {
    drawPlanetInfo(hoveredPlanet);
  }

  // Draw control panel
  drawControlPanel();

  time += 0.01 * animationSpeed;
}

function drawStarfield() {
  // Create starfield background
  background(0);

  // Draw stars
  for (let i = 0; i < 200; i++) {
    let x = noise(i * 0.1, time * 0.1) * width;
    let y = noise(i * 0.1 + 100, time * 0.1) * height;
    let brightness = noise(i * 0.1 + 200, time * 0.1) * 255;

    stroke(brightness);
    strokeWeight(1);
    point(x, y);
  }
}

function drawSun() {
  // Draw solar halo
  for (let i = 0; i < 3; i++) {
    let alpha = 50 - i * 15;
    fill(255, 255, 0, alpha);
    noStroke();
    ellipse(width * 0.1, height / 2, 60 + i * 20);
  }

  // Draw solar core
  fill(255, 255, 0);
  noStroke();
  ellipse(width * 0.1, height / 2, 60);
}

function drawPlanetInfo(planet) {
  let infoX = mouseX + 10;
  let infoY = mouseY - 10;

  // Ensure info box doesn't exceed screen bounds
  if (infoX + 200 > width) {
    infoX = mouseX - 210;
  }
  if (infoY - 120 < 0) {
    infoY = mouseY + 20;
  }

  // Draw info box background
  fill(0, 0, 0, 220);
  stroke(255);
  strokeWeight(1);
  rect(infoX, infoY - 110, 200, 120, 8);

  // Draw planet information
  fill(255);
  noStroke();
  textSize(16);
  textAlign(LEFT);
  text(planet.name, infoX + 10, infoY - 90);

  textSize(12);
  fill(200);
  text("Type: " + planet.type, infoX + 10, infoY - 70);
  text("Moons: " + planet.moons + " moons", infoX + 10, infoY - 55);
  text("Distance: " + planet.distance + " AU", infoX + 10, infoY - 40);

  // Draw description (line by line)
  fill(180);
  textSize(10);
  let words = planet.description.split(', ');
  let yOffset = infoY - 25;
  for (let i = 0; i < words.length && i < 2; i++) {
    text(words[i], infoX + 10, yOffset + i * 12);
  }
}

class Planet {
  constructor(data) {
    this.name = data.name;
    this.size = data.size;
    this.color = data.color;
    this.distance = data.distance;
    this.speed = data.speed;
    this.description = data.description;
    this.moons = data.moons;
    this.type = data.type;
    this.angle = random(TWO_PI);
    this.y = height / 2;
    this.hoverRadius = this.size * 1.5;
    this.rotationAngle = 0;
  }

  update() {
    // Update planet position (simple left-right movement)
    this.angle += this.speed;
    this.x = this.distance + sin(this.angle) * 20;

    // Planet rotation
    this.rotationAngle += 0.02;
  }

  display() {
    // Check mouse hover
    let d = dist(mouseX, mouseY, this.x, this.y);
    let isHovered = d < this.hoverRadius;

    if (isHovered) {
      hoveredPlanet = this;
    }

    // Draw orbit
    if (showOrbits) {
      stroke(255, 255, 255, 30);
      strokeWeight(1);
      noFill();
      ellipse(this.distance, this.y, 40);
    }

    // Draw planet
    push();
    translate(this.x, this.y);
    rotate(this.rotationAngle);

    // Add glow effect
    if (isHovered) {
      for (let i = 0; i < 3; i++) {
        fill(red(this.color), green(this.color), blue(this.color), 100 - i * 30);
        ellipse(0, 0, this.size + i * 4);
      }
    }

    // Draw planet body
    fill(this.color);
    noStroke();
    ellipse(0, 0, this.size);

    // Add rings for Saturn
    if (this.name === "Saturn") {
      stroke(200, 180, 150, 150);
      strokeWeight(2);
      noFill();
      ellipse(0, 0, this.size * 1.8);
      ellipse(0, 0, this.size * 1.6);
    }

    // Add stripes for Jupiter
    if (this.name === "Jupiter") {
      stroke(150, 120, 80, 100);
      strokeWeight(1);
      line(-this.size / 2, -this.size / 4, this.size / 2, -this.size / 4);
      line(-this.size / 2, this.size / 4, this.size / 2, this.size / 4);
    }

    pop();

    // Draw planet name
    fill(255);
    noStroke();
    textAlign(CENTER);
    textSize(12);
    text(this.name, this.x, this.y + this.size + 20);

    // Draw moon count (if any)
    if (this.moons > 0) {
      textSize(10);
      fill(200);
      text(this.moons + " moons", this.x, this.y + this.size + 35);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drawControlPanel() {
  // Draw control panel background
  fill(0, 0, 0, 180);
  stroke(255);
  strokeWeight(1);
  rect(10, 10, 200, 120, 5);

  // Draw title
  fill(255);
  noStroke();
  textSize(14);
  textAlign(LEFT);
  text("Solar System Control Panel", 20, 30);

  // Draw control options
  textSize(12);
  fill(showOrbits ? 255 : 150);
  text("Orbit Display: " + (showOrbits ? "ON" : "OFF"), 20, 50);

  fill(showInfo ? 255 : 150);
  text("Info Display: " + (showInfo ? "ON" : "OFF"), 20, 70);

  fill(255);
  text("Animation Speed: " + animationSpeed.toFixed(1) + "x", 20, 90);

  // Draw operation hints
  textSize(10);
  fill(180);
  text("Click to toggle options, scroll wheel to adjust speed", 20, 110);
}

function mouseMoved() {
  // Reset hover state
  hoveredPlanet = null;

  // Check hover state for each planet
  for (let planet of planets) {
    let d = dist(mouseX, mouseY, planet.x, planet.y);
    if (d < planet.hoverRadius) {
      hoveredPlanet = planet;
      break;
    }
  }
}

function mousePressed() {
  // Check if control panel was clicked
  if (mouseX < 220 && mouseY < 140) {
    if (mouseY > 40 && mouseY < 60) {
      showOrbits = !showOrbits;
    } else if (mouseY > 60 && mouseY < 80) {
      showInfo = !showInfo;
    }
  }
}

function mouseWheel(event) {
  // Adjust animation speed
  animationSpeed += event.delta * 0.001;
  animationSpeed = constrain(animationSpeed, 0.1, 3.0);
  return false;
}

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

    // Add trail points
    this.trail.push({ x: this.x, y: this.y, life: 255 });

    // Limit trail length
    if (this.trail.length > 20) {
      this.trail.shift();
    }

    // Update trail life values
    for (let point of this.trail) {
      point.life -= 5;
    }

    // If comet disappears or leaves screen, reset
    if (this.life <= 0 || this.x < -100 || this.x > width + 100 ||
      this.y < -100 || this.y > height + 100) {
      this.reset();
    }
  }

  display() {
    // Draw trail
    for (let i = 0; i < this.trail.length - 1; i++) {
      let alpha = map(this.trail[i].life, 0, 255, 0, 100);
      stroke(255, 255, 255, alpha);
      strokeWeight(1);
      line(this.trail[i].x, this.trail[i].y,
        this.trail[i + 1].x, this.trail[i + 1].y);
    }

    // Draw comet head
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

    // Boundary check
    if (this.x < 350 || this.x > 650) {
      this.vx *= -1;
    }
    if (this.y < height / 2 - 150 || this.y > height / 2 + 150) {
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

    // Add some details
    fill(100, 100, 100, 100);
    ellipse(0, 0, this.size * 0.6);

    pop();
  }
}