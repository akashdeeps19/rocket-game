class Bullet {
    constructor(x, y, heading) {
        this.pos = new p5.Vector(x, y);
        this.vel = p5.Vector.fromAngle(heading);
        this.vel.mult(10);
        this.size = 5;
        this.lifetime = 100; // Frames before bullet disappears
    }

    update(deltaTime) {
        this.pos.add(p5.Vector.mult(this.vel, deltaTime));
        this.lifetime -= deltaTime;
    }

    draw() {
        fill(255, 0, 0);
        noStroke();
        circle(this.pos.x, this.pos.y, this.size);
    }

    isDead() {
        return this.lifetime <= 0 || 
               this.pos.x < -WORLD_WIDTH/2 || 
               this.pos.x > WORLD_WIDTH/2 ||
               this.pos.y < -WORLD_HEIGHT/2 ||
               this.pos.y > WORLD_HEIGHT/2;
    }
}

class Camera {
    constructor() {
        this.offset = new p5.Vector(0, 0);
        this.targetOffset = new p5.Vector(0, 0);
        this.smoothness = 0.8;
        this.verticalPositionPercentage = 0.45; // 45% from bottom of screen
    }

    update(target) {
        // Calculate target camera position to keep player at specified percentage from bottom
        this.targetOffset.x = width/2 - target.pos.x;
        this.targetOffset.y = height * (1 - this.verticalPositionPercentage) - target.pos.y;
        
        // Smoothly interpolate camera position
        this.offset.x = lerp(this.offset.x, this.targetOffset.x, this.smoothness);
        this.offset.y = lerp(this.offset.y, this.targetOffset.y, this.smoothness);
    }

    apply() {
        push();
        translate(this.offset.x, this.offset.y);
    }

    reset() {
        pop();
    }
}

class Rocket {
    constructor() {
        this.pos = new p5.Vector(-50, 1975); // Start at base, slightly to the left
        this.vel = new p5.Vector(0, 0);
        this.width = 30;
        this.height = 50;
        this.gravity = 0.2;
        this.thrust = 0.3;
        this.isThrusting = false;
        this.maxSpeed = 5;
        this.heading = -PI/2; // -90 degrees points upward in p5.js
        this.rotationSpeed = 0.006;
        this.thrustDisabled = false;
        this.thrustDisableTime = 0;
        this.thrustDisableDuration = 100; // Frames to disable thrust
    }

    update(deltaTime) {
        // Apply gravity
        this.vel.y += this.gravity * deltaTime;
        
        // Apply thrust if user is touching and thrust is not disabled
        if (this.isThrusting && !this.thrustDisabled) {
            let thrustForce = p5.Vector.fromAngle(this.heading);
            thrustForce.mult(this.thrust * deltaTime);
            this.vel.add(thrustForce);
        }
        
        // Update position
        this.pos.add(p5.Vector.mult(this.vel, deltaTime));
        
        // Limit speed
        this.vel.limit(this.maxSpeed);
        
        // Ground collision
        if (this.pos.y > 2000) {
            this.pos.y = 2000;
            this.vel.y = 0;
        }

        // Update thrust disable timer
        if (this.thrustDisabled) {
            this.thrustDisableTime -= deltaTime;
            if (this.thrustDisableTime <= 0) {
                this.thrustDisabled = false;
            }
        }
    }

    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.heading + PI/2);
        
        // Draw rocket with red tint if thrust is disabled
        if (this.thrustDisabled) {
            stroke(255, 0, 0);
        } else {
            stroke(255);
        }
        strokeWeight(2);
        noFill();
        triangle(
            0, -this.height/2,
            -this.width/2, this.height/2,
            this.width/2, this.height/2
        );
        
        // Draw thruster flame when thrusting and not disabled
        if (this.isThrusting && !this.thrustDisabled) {
            fill(255, 100, 0);
            noStroke();
            triangle(
                -this.width/3, this.height/2,
                0, this.height/2 + 20,
                this.width/3, this.height/2
            );
        }
        pop();
    }

    startThrust() {
        this.isThrusting = true;
    }

    stopThrust() {
        this.isThrusting = false;
    }

    steer(dragX) {
        // Rotate the rocket based on drag amount
        this.heading += dragX * this.rotationSpeed;
    }

    shoot() {
        // Calculate the tip position of the rocket
        let tipOffset = p5.Vector.fromAngle(this.heading);
        tipOffset.mult(this.height/2);
        let tipPos = p5.Vector.add(this.pos, tipOffset);
        
        // Calculate heading as vector from tip to rocket center
        let direction = p5.Vector.sub(tipPos, this.pos);
        let bulletHeading = direction.heading();
        
        // Create bullet at the tip of the rocket
        return new Bullet(tipPos.x, tipPos.y, bulletHeading);
    }

    checkCollision(asteroid) {
        // Simple circle-rectangle collision
        let rocketRadius = this.width/2;
        let asteroidRadius = asteroid.size/2;
        let distance = p5.Vector.dist(this.pos, asteroid.pos);
        return distance < (rocketRadius + asteroidRadius);
    }

    disableThrust() {
        this.thrustDisabled = true;
        this.thrustDisableTime = this.thrustDisableDuration;
    }
}

class FlockingRocket extends Rocket {
    constructor() {
        super();
        // Start at base, slightly to the right of the player rocket
        this.pos = new p5.Vector(50, 1975);
        this.vel = new p5.Vector(0, 0);
        this.maxSpeed = 4; // Slower than player rocket
        this.thrust = 0.3;
        this.followDistance = 10; // How far to stay from beacon
        this.followStrength = 0.15;
        this.avoidDistance = 80; // Distance to start avoiding asteroids
        this.avoidStrength = 0.25;
    }

    follow(target) {
        let toTarget = p5.Vector.sub(beacon.pos, this.pos);
        let distance = toTarget.mag();
        
        // Calculate desired heading to beacon
        let desiredHeading = toTarget.heading();
        
        // Calculate current heading
        let currentHeading = this.heading;
        
        // Calculate heading difference
        let headingDiff = desiredHeading - currentHeading;
        
        // Normalize heading difference to [-PI, PI]
        while (headingDiff > PI) headingDiff -= TWO_PI;
        while (headingDiff < -PI) headingDiff += TWO_PI;
        
        // Check for nearby asteroids
        let avoidForce = new p5.Vector(0, 0);
        for (let asteroid of asteroids) {
            let toAsteroid = p5.Vector.sub(asteroid.pos, this.pos);
            let asteroidDist = toAsteroid.mag();
            
            if (asteroidDist < this.avoidDistance) {
                // Calculate avoidance force (away from asteroid)
                let avoidDir = toAsteroid.copy().mult(-1);
                avoidDir.normalize();
                avoidDir.mult(this.avoidStrength * (1 - asteroidDist/this.avoidDistance));
                avoidForce.add(avoidDir);
            }
        }
        
        // If we have an avoidance force, use it to modify our heading
        if (avoidForce.mag() > 0) {
            let avoidHeading = avoidForce.heading();
            let avoidDiff = avoidHeading - currentHeading;
            
            // Normalize avoid difference to [-PI, PI]
            while (avoidDiff > PI) avoidDiff -= TWO_PI;
            while (avoidDiff < -PI) avoidDiff += TWO_PI;
            
            // Blend between following and avoiding
            headingDiff = lerp(headingDiff, avoidDiff, 0.7);
        }
        
        // Adjust heading gradually
        this.heading += headingDiff * 0.1;
        
        // Apply thrust if we're not at the target
        if (distance > this.followDistance) {
            this.isThrusting = true;
        } else {
            this.isThrusting = false;
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.follow(beacon); // Follow the beacon
    }

    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.heading + PI/2);
        
        // Draw rocket with light green color if thrust is disabled
        if (this.thrustDisabled) {
            stroke(144, 238, 144); // Light green color
        } else {
            stroke(0, 255, 0); // Original green color
        }
        strokeWeight(2);
        noFill();
        triangle(
            0, -this.height/2,
            -this.width/2, this.height/2,
            this.width/2, this.height/2
        );
        
        // Draw thruster flame only when thrusting and not disabled
        if (this.isThrusting && !this.thrustDisabled) {
            fill(255, 100, 0);
            noStroke();
            triangle(
                -this.width/3, this.height/2,
                0, this.height/2 + 20,
                this.width/3, this.height/2
            );
        }
        pop();
    }
}

class Star {
    constructor(worldWidth, worldHeight) {
        this.x = random(-worldWidth/2, worldWidth/2);
        this.y = random(-worldHeight/2, worldHeight/2);
        this.size = random(1, 3);
    }

    draw() {
        fill(255);
        noStroke();
        circle(this.x, this.y, this.size);
    }
}

class Starfield {
    constructor(numStars, worldWidth, worldHeight) {
        this.stars = [];
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        for (let i = 0; i < numStars; i++) {
            this.stars.push(new Star(worldWidth, worldHeight));
        }
    }

    draw() {
        for (let star of this.stars) {
            star.draw();
        }
    }

    resize() {
        this.stars = [];
        for (let i = 0; i < 1000; i++) {
            this.stars.push(new Star(this.worldWidth, this.worldHeight));
        }
    }
}

class Asteroid {
    constructor(worldWidth, worldHeight) {
        this.pos = new p5.Vector(
            random(-worldWidth/2, worldWidth/2),
            random(-worldHeight/2, worldHeight/2)
        );
        this.vel = p5.Vector.random2D().mult(random(0.5, 2));
        this.size = random(20, 50);
        this.rotation = random(TWO_PI);
        this.rotationSpeed = random(-0.02, 0.02);
        this.vertices = [];
        this.generateVertices();
    }

    generateVertices() {
        // Generate random vertices for irregular shape
        let numVertices = floor(random(6, 12));
        for (let i = 0; i < numVertices; i++) {
            let angle = (i / numVertices) * TWO_PI;
            let radius = this.size/2 * random(0.7, 1.3);
            this.vertices.push({
                x: cos(angle) * radius,
                y: sin(angle) * radius
            });
        }
    }

    update(deltaTime) {
        this.pos.add(p5.Vector.mult(this.vel, deltaTime));
        this.rotation += this.rotationSpeed * deltaTime;
        
        // Wrap around world boundaries
        if (this.pos.x < -WORLD_WIDTH/2) this.pos.x = WORLD_WIDTH/2;
        if (this.pos.x > WORLD_WIDTH/2) this.pos.x = -WORLD_WIDTH/2;
        if (this.pos.y < -WORLD_HEIGHT/2) this.pos.y = WORLD_HEIGHT/2;
        if (this.pos.y > WORLD_HEIGHT/2) this.pos.y = -WORLD_HEIGHT/2;
    }

    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.rotation);
        
        // Draw asteroid outline
        stroke(255);
        strokeWeight(2);
        noFill();
        beginShape();
        for (let v of this.vertices) {
            vertex(v.x, v.y);
        }
        endShape(CLOSE);
        
        pop();
    }
}

class Beacon {
    constructor() {
        this.pos = new p5.Vector(0, -WORLD_HEIGHT/2 + 100);
        this.size = 40;
        this.pulseSpeed = 0.05;
        this.pulsePhase = 0;
        this.indicatorSize = 30;
    }

    update(deltaTime) {
        this.pulsePhase += this.pulseSpeed * deltaTime;
        if (this.pulsePhase > TWO_PI) {
            this.pulsePhase = 0;
        }
    }

    draw() {
        // Get screen position of beacon (relative to camera)
        let screenX = this.pos.x + camera.offset.x;
        let screenY = this.pos.y + camera.offset.y;
        
        // Check if beacon is on screen with some margin
        let margin = 50;
        let isOnScreen = screenX >= -margin && screenX <= width + margin && 
                        screenY >= -margin && screenY <= height + margin;
        
        if (isOnScreen) {
            // Draw beacon in world space
            push();
            translate(this.pos.x, this.pos.y);
            
            // Draw pulsing circle
            let pulseSize = this.size * (1 + sin(this.pulsePhase) * 0.3);
            noFill();
            stroke(0, 0, 255);
            strokeWeight(3);
            circle(0, 0, pulseSize);
            
            // Draw crosshair
            stroke(0, 0, 255, 200);
            strokeWeight(2);
            line(-pulseSize/2, 0, pulseSize/2, 0);
            line(0, -pulseSize/2, 0, pulseSize/2);
            
            // Draw outer glow
            stroke(0, 0, 255, 100);
            strokeWeight(2);
            circle(0, 0, pulseSize * 1.5);
            
            pop();
        } else {
            // Draw indicator at top of screen
            this.drawIndicator(screenX);
        }
    }

    drawIndicator(screenX) {
        // Calculate screen position relative to camera
        let screenPos = this.pos.x + camera.offset.x;
        // Constrain to screen width
        let indicatorX = constrain(screenPos, this.indicatorSize, width - this.indicatorSize);
        
        // Save current transformation state
        push();
        
        // Reset transformations to draw in screen space
        resetMatrix();
        
        // Draw indicator at top of screen
        translate(indicatorX, this.indicatorSize);
        
        // Draw pulsing indicator circle
        let pulseSize = this.indicatorSize * (1 + sin(this.pulsePhase) * 0.2);
        noFill();
        stroke(255, 255, 0);
        strokeWeight(3);
        circle(0, 0, pulseSize);
        
        // Draw outer glow
        stroke(255, 255, 0, 100);
        strokeWeight(2);
        circle(0, 0, pulseSize * 1.5);
        
        // Restore transformation state
        pop();
    }
}

let rocket;
let lastTouchX = 0;
let camera;
let starfield;
let bullets = [];
let asteroids = [];
let flockingRocket;
let beacon;
const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 4000;
const NUM_ASTEROIDS = 250;
let lastTime = 0;
const TARGET_FPS = 60;
const TARGET_FRAME_TIME = 1000 / TARGET_FPS;

function setup() {
    // Create canvas that fills the window
    createCanvas(windowWidth, windowHeight);
    background(0);
    
    // Set frame rate to 60 FPS
    frameRate(TARGET_FPS);
    
    // Initialize game objects
    rocket = new Rocket();
    flockingRocket = new FlockingRocket();
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
        p5.Vector.dist(flockingRocket.pos, beacon.pos) < beaconReachDistance) {
        // Reset both rockets
        rocket.pos = new p5.Vector(-50, 1975); // Reset player rocket to base
        rocket.vel = new p5.Vector(0, 0);
        rocket.heading = -PI/2; // Point upward
        
        flockingRocket.pos = new p5.Vector(50, 1975); // Reset following rocket to base
        flockingRocket.vel = new p5.Vector(0, 0);
        flockingRocket.heading = -PI/2; // Point upward
    }
    
    // Update and draw asteroids, check for collisions
    for (let asteroid of asteroids) {
        asteroid.update(deltaTime);
        asteroid.draw();
        
        // Check collision with player rocket
        if (rocket.checkCollision(asteroid)) {
            rocket.disableThrust();
        }
        
        // Check collision with following rocket
        if (flockingRocket.checkCollision(asteroid)) {
            flockingRocket.disableThrust();
        }
    }
    
    // Update and draw flocking rocket
    flockingRocket.update(deltaTime);
    flockingRocket.draw();
    
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