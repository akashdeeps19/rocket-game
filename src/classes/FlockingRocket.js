class FlockingRocket extends Rocket {
    constructor() {
        super();
        // Start at base, slightly to the right of the player rocket
        this.pos = new p5.Vector(50, 1975);
        this.vel = new p5.Vector(0, 0);
        this.maxSpeed = 5;
        this.thrust = 0.3;
        this.followDistance = 10;
        this.avoidDistance = 250;
        this.avoidStrength = 0.4;
        this.rotationSpeed = 0.3; // Increased from 0.006 to 0.03 for faster turning
    }

    follow(beacon, asteroids) {
        // Calculate direction to beacon
        let toBeacon = p5.Vector.sub(beacon.pos, this.pos);
        let distanceToBeacon = toBeacon.mag();
        let desiredHeading = toBeacon.heading();
        
        // Find the closest asteroid in our path
        let closestAsteroid = null;
        let minDistance = this.avoidDistance;
        let currentHeading = this.heading;
        
        for (let asteroid of asteroids) {
            let toAsteroid = p5.Vector.sub(asteroid.pos, this.pos);
            let distanceToAsteroid = toAsteroid.mag();
            let asteroidHeading = toAsteroid.heading();
            
            // Calculate angle difference between our heading and the asteroid
            let angleDiff = abs(asteroidHeading - currentHeading);
            if (angleDiff > PI) angleDiff = TWO_PI - angleDiff;
            
            // Only consider asteroids that are somewhat in front of us
            if (distanceToAsteroid < minDistance && angleDiff < PI/4) {
                closestAsteroid = asteroid;
                minDistance = distanceToAsteroid;
            }
        }
        
        // Calculate steering amount
        let steerAmount = 0;
        
        if (closestAsteroid) {
            // Calculate relative velocity between rocket and asteroid
            let relativeVel = p5.Vector.sub(this.vel, closestAsteroid.vel);
            
            // Calculate cross product to determine which side to steer
            let toAsteroid = p5.Vector.sub(closestAsteroid.pos, this.pos);
            let crossProduct = toAsteroid.x * relativeVel.y - toAsteroid.y * relativeVel.x;
            
            // Steer left or right based on cross product (reversed direction)
            steerAmount = crossProduct > 0 ? 1 : -1;
            
            // Scale steering based on distance
            let distanceFactor = 1 - (minDistance / this.avoidDistance);
            steerAmount *= distanceFactor * this.avoidStrength;
        } else {
            // Steer towards beacon
            let headingDiff = desiredHeading - currentHeading;
            if (headingDiff > PI) headingDiff -= TWO_PI;
            if (headingDiff < -PI) headingDiff += TWO_PI;
            steerAmount = headingDiff;
        }
        
        // Apply steering
        this.steer(steerAmount);
        
        // Apply thrust if we're not at the target
        if (distanceToBeacon > this.followDistance) {
            this.isThrusting = true;
        } else {
            this.isThrusting = false;
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.follow(beacon, asteroids);
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