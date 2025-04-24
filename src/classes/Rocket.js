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
        this.thrustDisableDuration = 30; // Frames to disable thrust
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