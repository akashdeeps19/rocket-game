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