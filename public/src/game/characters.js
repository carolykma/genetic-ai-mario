// Mario
class Mario {
    constructor(world, x, y) {
        this.world = world
        this.initialX = x ? x * gridSize : 0
        this.initialY = y ? y * gridSize : 0
        this.color = 'red'
        this.img = sprites.marioOpaque;
        this.x = this.initialX // x position
        this.y = this.initialY // y position
        this.vx = 0 // horizontal velocity (+ve: right)
        this.vy = 0 // vertical velocity (+ve: down)
        this.size = gridSize

        // movement
        this.up = false
        this.direction = 0
        this.isActive = true // false when GA simulation is paused

        // performance
        this.isAlive = true // false when mario dies
        this.isWin = false
        this.moves = []
        this.positions = []
        this.clicks = []

        // append to world
        if (this.constructor == Mario) world.marioList.push(this)
    }

    // Moves
    reset() {
        this.x = this.initialX ? this.initialX : 0
        this.y = this.initialY ? this.initialY : 0
        this.vx = 0
        this.vy = 0
        this.up = false
        this.direction = 0
        this.isActive = true
        this.isAlive = true
        this.isWin = false
        this.positions = []
    }

    gravity() {
        this.vy += gravityFactor * gridSize;
    }

    walk(direction) {
        if (
            (this.checkTouch("left") && direction == -1) ||
            (this.checkTouch("right") && direction == 1)
        ) {
            this.vx = 0;
        } else {
            this.vx = direction * (speedFactor * gridSize)
        }
    }

    jump() {
        this.vy = -(jumpFactor * gridSize)
    }

    die() {
        this.isAlive = false;
        this.isActive = false;
        // set last positions before death (to be within canva)
        this.y = Math.min(this.y, canvaHeight - 1);
        // reborn player-controlled mario
        if (this == playerMario) this.reset();
    }

    win() {
        this.isWin = true
        this.x = this.world.target.x // snap to target
    }

    randomMove() {
        let move = GA.randomMove()
        this.up = move[0]
        this.direction = move[1]
    }

    saveMove() {
        // append move to gene
        this.moves.push([this.up, this.direction])
    }

    savePosition() {
        if (!this.isAlive) return
        this.positions.push([this.x, this.y])
    }

    updatePosition() {
        // cap velocity
        this.vx = Math.min(Math.max(this.vx, -maxSpeed), maxSpeed)
        this.vy = Math.min(Math.max(this.vy, -maxSpeed), maxSpeed)
        if (this.isWin) this.vx = 0 // stops at target x if win

        // calc potential positions for collision checking
        let oldX = this.x, oldY = this.y
        let potentialX = this.x + this.vx
        let potentialY = this.y + this.vy
        // check collision & trigger collision events
        let collide = this.checkCollide(potentialX, potentialY)

        // calc new positions if collision event does not involve position change
        if (this.x == oldX && this.y == oldY) {
            let newX = this.x + this.vx
            let newY = this.y + this.vy
            // calc blockage
            if (collide.target) {
                if (!collide.target.penetrable) {
                    if (collide.bottom) {
                        newY = collide.bottom - this.size
                        this.vy = 0
                    }
                    if (collide.top) {
                        newY = collide.top
                        this.vy = -this.vy * 0.3 // bounce
                    }
                    if (collide.right) {
                        newX = collide.right - this.size
                        this.vx = 0
                    }
                    if (collide.left) {
                        newX = collide.left
                        this.vx = 0
                    }
                }
            }
            this.x = newX
            this.y = newY
        }

        // limit positions within canva
        this.x = Math.min(Math.max(this.x, 0), canvaWidth - gridSize); // left | right: blocked
        this.y = Math.max(0, this.y); // top: blocked
        if (this.y >= canvaHeight) this.die() // bottom: dies
    }

    // collision detection & onCollide event
    getTargetList() {
        return this.world.itemList;
    }
    onCollide() { }
    checkCollide(newX, newY) {
        let size = this.size
        let ux = newX - this.x // shouldn't == 0
        let uy = newY - this.y // shouldn't == 0
        let dirX = ux > 0 ? "right" : ux < 0 ? "left" : null
        let dirY = uy > 0 ? "bottom" : uy < 0 ? "top" : null

        let result = { // info needed: direction, wall, t?
            top: null, right: null, bottom: null, left: null,
            tx: null, ty: null,
            target: null, event: null
        };

        let targetX = null
        let targetY = null
        const targetList = this.getTargetList();

        targetList.forEach(block => {
            if (!block.isActive) return;

            let blockSize = block.size
            let wall = {
                left: block.x + blockSize, // left collision, i.e. block's right
                right: block.x,
                top: block.y + blockSize,
                bottom: block.y
            }

            // if new positions overlap
            if (newX + size > wall.right && newX < wall.left && newY + size > wall.bottom && newY < wall.top) {
                let dx, dy, tx, ty // displacement (vector +/-), undefined if no collide
                // horizontal
                if (this.x + size <= wall.right) { // right
                    dx = wall.right - (this.x + size) // +ve
                } else if (this.x >= wall.left) { // left
                    dx = wall.left - this.x // -ve
                }

                // vertical
                if (this.y + size <= wall.bottom) { // bottom
                    dy = wall.bottom - (this.y + size) // +ve
                } else if (this.y >= wall.top) { // top
                    dy = wall.top - this.y // -ve
                }

                // tx|ty: time until x|y collision
                if (dx || dx == 0) tx = dx / ux // always non -ve
                if (dy || dy == 0) ty = dy / uy // always non -ve
                if ((tx || tx == 0) && (ty || ty == 0)) {
                    if (ty < tx) ty = null // collide x only
                    else tx = null // collide y only
                    // TODO: collide both? (i.e. hit corner) now: prioritize y
                }

                // if collide x -> check if it's before other x collisions
                if ((tx || tx == 0) && (!result.dx || tx < result.tx)) {
                    result.tx = tx
                    result[dirX] = wall[dirX]
                    targetX = block
                }
                // if collide y -> check if it's before other y collisions
                if ((ty || ty == 0) && (!result.dy || ty < result.ty)) {
                    result.ty = ty
                    result[dirY] = wall[dirY]
                    targetY = block
                }
            }
        })

        if (result.ty && result.tx) {
            if (result.ty < result.tx) result[dirX] = null // collide y only
            else result[dirY] = null // collide x only
            // TODO: collide both? now: prioritize y
        }

        // return result with the collision target
        if (result[dirY]) {
            result.target = targetY
            targetY.onCollide(this, dirY)
        }
        else if (result[dirX]) {
            result.target = targetX
            targetX.onCollide(this, dirX)
        }
        return result
    }

    checkTouch(direction) {
        let x = this.x;
        let y = this.y;
        if (direction == "top") {
            y--;
        } else if (direction == "bottom") {
            y++;
        } else if (direction == "right") {
            x++;
        } else if (direction == "left") {
            x--;
        }
        let collide = this.checkCollide(x, y)
        if (collide[direction] && !collide.target.penetrable) return true
    }

    /* should be called at the end of every loop, before paint()
    this function:
    1) reads this.up, this.direction to calc new velocities 
    2) calc new this.x|y and check collision & death */
    newFrame() {
        if (!this.isAlive || !this.isActive) return

        // calc velocities
        this.gravity()
        this.walk(this.direction)
        if (this.up) {
            if (this.checkTouch("bottom")) {
                this.jump();
            }
            this.up = false;
        }
        // calc new positions
        this.updatePosition()
        this.savePosition()
    }

    paint() {
        if (!this.isAlive) {
            rect(this.x, this.y, 0, 0); // debug
        } else if (this.img) {
            image(this.img, this.x, this.y, this.size, this.size);
        } else {
            fill(this.color);
            rect(this.x, this.y, this.size, this.size);
        }
    }
}


class Enemy extends Mario {
    // removed: keyList, colorList 

    constructor(world, opts, x, y) {
        const { key, size, color, img, init, tick, reset } = opts;
        super(world, x, y);
        this.type = key;

        // props
        this.size = gridSize * (size || 1);
        this.color = color || "brown";
        this.img = sprites[img];
        this.tick = tick;
        this.customReset = reset;

        // custom init
        if (init) init(this);
    }

    onBatchEnd() {
        this.isActive = false;
    }
    reset() {
        this.x = this.initialX;
        this.y = this.initialY;
        this.isActive = true;
        this.isAlive = true;
        if (this.customReset) this.customReset(this);
    }
    newFrame() {
        if (this.tick) this.tick(this);
        super.newFrame();
    }

    getTargetList() {
        return [
            ...this.world.itemList,
            ...this.world.marioList,
        ];
    }
    onCollide(mario, direction) {
        if (mario.constructor == Mario) mario.die();
    }
}


