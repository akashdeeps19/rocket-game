// Game constants
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 4000;
const NUM_ASTEROIDS = 100;
const TARGET_FPS = 60;
const TARGET_FRAME_TIME = 1000 / TARGET_FPS;

// Game variables
let rocket;
let lastTouchX = 0;
let camera;
let starfield;
let bullets = [];
let asteroids = [];
let flockingRocket;
let followingRocket;
let beacon;
let lastTime = 0;

function setup() {
    // Create canvas that fills the window
    createCanvas(windowWidth, windowHeight);
    background(0);
    
    // Set frame rate to 60 FPS
    frameRate(TARGET_FPS);
    
    // Initialize game objects
    rocket = new Rocket();
    flockingRocket = new FlockingRocket();
    followingRocket = new FollowingRocket();
    camera = new Camera();
    starfield = new Starfield(1000, WORLD_WIDTH, WORLD_HEIGHT);
    beacon = new Beacon();
    
    // Create asteroids
    for (let i = 0; i < NUM_ASTEROIDS; i++) {
        asteroids.push(new Asteroid(WORLD_WIDTH, WORLD_HEIGHT));
    }
}

function draw() {
    // Calculate delta time and scale to target FPS
    let currentTime = millis();
    let deltaTime = (currentTime - lastTime) / TARGET_FRAME_TIME; // Scale to target FPS
    lastTime = currentTime;
    
    // Clear the background
    background(0);
    
    // Update camera to follow rocket
    camera.update(rocket);
    
    // Apply camera transformation
    camera.apply();
    
    // Draw stars
    starfield.draw();
    
    // Update and draw beacon
    beacon.update(deltaTime);
    beacon.draw();
    
    // Check if rockets reached the beacon
    let beaconReachDistance = 50; // Distance at which rockets are considered to have reached the beacon
    if (p5.Vector.dist(rocket.pos, beacon.pos) < beaconReachDistance || 
        p5.Vector.dist(flockingRocket.pos, beacon.pos) < beaconReachDistance ||
        p5.Vector.dist(followingRocket.pos, beacon.pos) < beaconReachDistance) {
        // Reset all rockets
        rocket.pos = new p5.Vector(-50, 1975); // Reset player rocket to base
        rocket.vel = new p5.Vector(0, 0);
        rocket.heading = -PI/2; // Point upward
        
        flockingRocket.pos = new p5.Vector(50, 1975); // Reset flocking rocket to base
        flockingRocket.vel = new p5.Vector(0, 0);
        flockingRocket.heading = -PI/2; // Point upward
        
        followingRocket.pos = new p5.Vector(100, 1975); // Reset following rocket to base
        followingRocket.vel = new p5.Vector(0, 0);
        followingRocket.heading = -PI/2; // Point upward
    }
    
    // Update and draw asteroids, check for collisions
    for (let asteroid of asteroids) {
        asteroid.update(deltaTime);
        asteroid.draw();
        
        // Check collision with player rocket
        if (rocket.checkCollision(asteroid)) {
            rocket.disableThrust();
        }
        
        // Check collision with flocking rocket
        if (flockingRocket.checkCollision(asteroid)) {
            flockingRocket.disableThrust();
        }
        
        // Check collision with following rocket
        if (followingRocket.checkCollision(asteroid)) {
            followingRocket.disableThrust();
        }
    }
    
    // Update and draw flocking rocket
    flockingRocket.update(deltaTime);
    flockingRocket.draw();
    
    // Update and draw following rocket
    followingRocket.update(deltaTime);
    followingRocket.draw();
    
    // Update and draw bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update(deltaTime);
        bullets[i].draw();
        if (bullets[i].isDead()) {
            bullets.splice(i, 1);
        }
    }
    
    // Update and draw rocket
    rocket.update(deltaTime);
    rocket.draw();
    
    // Draw the ground line
    stroke(255);
    strokeWeight(2);
    line(-WORLD_WIDTH/2, 2000, WORLD_WIDTH/2, 2000);

    // Draw the ground line
    stroke(255,255,0);
    strokeWeight(2);
    line(-WORLD_WIDTH/2, -WORLD_HEIGHT/2 + 100, WORLD_WIDTH/2, -WORLD_HEIGHT/2 + 100);
    
    // Reset camera transformation
    camera.reset();
}

function touchStarted(e) {
    e.preventDefault();
    lastTouchX = mouseX;
    rocket.startThrust();
    // Shoot a bullet when tapping
    bullets.push(rocket.shoot());
    return false;
}

function touchMoved(e) {
    e.preventDefault();
    let dragX = mouseX - lastTouchX;
    lastTouchX = mouseX;
    rocket.steer(dragX);
    return false;
}

function touchEnded(e) {
    e.preventDefault();
    rocket.stopThrust();
    return false;
}

function windowResized() {
    // Resize canvas when window is resized
    resizeCanvas(windowWidth, windowHeight);
    background(0);
    
    // Recreate stars for new canvas size
    starfield.resize();
}

// Prevent default touch behaviors
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

// Handle orientation changes
window.addEventListener('orientationchange', function() {
    setTimeout(function() {
        resizeCanvas(windowWidth, windowHeight);
    }, 100);
}); 