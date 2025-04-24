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