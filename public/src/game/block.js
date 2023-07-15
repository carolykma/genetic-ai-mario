class Block {

  // removed: keyList, colorList, dynamicKeyList

  constructor(world, opts, x, y) {
    this.world = world;
    this.x = x * gridSize;
    this.y = y * gridSize;
    this.size = gridSize;
    this.isActive = true;

    // props
    const { key, color, img, penetrable, init, onCollide } = opts
    this.type = key;
    this.color = color || "grey";
    this.img = sprites[img];
    this.penetrable = penetrable || false;
    this.customOnCollide = onCollide;

    // custom init
    if (init) init(this);
  }

  onBatchEnd() { }
  newFrame() { }
  reset() { }

  onCollide(mario, direction) {
    if (mario.constructor == Mario && this.customOnCollide) {
      this.customOnCollide(mario, direction, this);
    }
  }

  paint() {
    if (this.img) {
      image(this.img, this.x, this.y, gridSize, gridSize);
    } else {
      fill(this.color);
      rect(this.x, this.y, this.size, this.size);
    }
  }
}

class DynamicBlock extends Block {

  // dynamic props
  constructor(world, opts, x, y) {
    super(world, opts, x, y);
    const { key, startFrame, endFrame } = opts;

    // dynamic props
    this.type = key;
    this.startFrame = startFrame;
    this.endFrame = endFrame;
    this.active = false;

    // validate
    if (!startFrame || !endFrame) throw new Error(`startFrame / endFrame missing for dynamic block ${key}`);
    if (startFrame < 1 || startFrame >= batchTime) throw new Error(`invalid startFrame for dynamic block ${key}`);
    if (endFrame <= startFrame || endFrame > batchTime) throw new Error(`invalid endFrame for dynamic block ${key}`);
  }

  newFrame(frame) {
    if (frame == this.startFrame) this.active = true;
    if (frame == this.endFrame) this.active = false;
  }
  reset() {
    this.active = false;
  }

  // TODO:
  // appear() {
  //   // append to blockList
  //   let idx = this.world.blockList[this.type].indexOf(this);
  //   if (idx < 0) this.world.blockList[this.type].push(this);
  // }

  // disappear() {
  //   // remove from blockList
  //   let idx = this.world.blockList[this.type].indexOf(this);
  //   if (idx >= 0) this.world.blockList[this.type].splice(idx, 1);
  // }
}