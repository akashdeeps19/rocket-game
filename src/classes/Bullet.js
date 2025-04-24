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