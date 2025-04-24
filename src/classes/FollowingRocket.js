class FollowingRocket extends Rocket {
    constructor() {
        super();
        // Start at base, slightly to the right of the player rocket
        this.pos = new p5.Vector(100, 1975);
        this.vel = new p5.Vector(0, 0);
        this.maxSpeed = 4.5;
        this.thrust = 0.22;
        this.followDistance = 0; // Distance to maintain from player rocket
        this.rotationSpeed = 0.06;
    }

    // Override to disable collision with asteroids
    checkCollision(asteroid) {
        return false;
    }

    follow(playerRocket) {
        // Calculate direction to player rocket
        let toPlayer = p5.Vector.sub(playerRocket.pos, this.pos);
        let distanceToPlayer = toPlayer.mag();
        let desiredHeading = toPlayer.heading();
        
        // Calculate steering amount
        let steerAmount = 0;
        
        // Steer towards player rocket
        let headingDiff = desiredHeading - this.heading;
        if (headingDiff > PI) headingDiff -= TWO_PI;
        if (headingDiff < -PI) headingDiff += TWO_PI;
        steerAmount = headingDiff;
        
        // Apply steering
        this.steer(steerAmount);
        
        // Apply thrust if we're not at the target distance
        if (distanceToPlayer > this.followDistance) {
            this.isThrusting = true;
        } else {
            this.isThrusting = false;
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.follow(beacon); // Follow the player rocket
    }

    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.heading + PI/2);
        
        // Draw rocket with blue color
        if (this.thrustDisabled) {
            stroke(100, 100, 255); // Lighter blue when thrust is disabled
        } else {
            stroke(0, 0, 255); // Blue color
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
