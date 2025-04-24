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