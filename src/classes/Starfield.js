class Starfield {
    constructor(numStars, worldWidth, worldHeight) {
        this.stars = [];
        this.numStars = numStars || 2000;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.initializeStars();
    }

    initializeStars() {
        for (let i = 0; i < this.numStars; i++) {
            this.stars.push({
                x: random(-this.worldWidth/2, this.worldWidth/2),
                y: random(-this.worldHeight/2, this.worldHeight/2),
                size: random(1, 3),
                brightness: random(100, 255)
            });
        }
    }

    resize() {
        // Reinitialize stars when window is resized
        this.stars = [];
        this.initializeStars();
    }

    draw() {
        push();
        for (let star of this.stars) {
            stroke(star.brightness);
            strokeWeight(star.size);
            point(star.x, star.y);
        }
        pop();
    }
}
