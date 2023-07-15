// img for p5
const spriteImgPaths = {
    mario: 'img/mario.png',
    marioOpaque: 'img/mario-opaque.png',
    mushroom: 'img/mushroom.png',
    brick: 'img/brick.png',
    spikes: 'img/spikes.png',
    target: 'img/target.png',
    ice: 'img/ice.png',
    boss1: 'img/boss1.png',
    portalIn: 'img/portal-in.png',
    portalOut: 'img/portal-out.png',
    fakeBlock: "img/fake-block.png"
}
const sprites = {
    // to be setup at p5 setup()
}

// symbol list
const itemKeyList = {
    // solid blocks
    "&": {
        class: Block,
        key: "solid",
        color: "grey",
        img: "brick",
    },
    "T": {
        class: Block,
        key: "target",
        color: "green",
        img: "target",
        penetrable: true,
        onCollide: (mario) => mario.win(),
    },
    "^": {
        class: Block,
        key: "trap1",
        color: "black",
        img: "fakeBlock",
        penetrable: true,
    },
    "p": {
        class: Block,
        key: "trap2",
        color: "purple",
        img: "spikes",
        onCollide: (mario, direction) => {
            if (direction == "bottom") mario.die()
        },
    },
    "i": {
        class: Block,
        key: "portalIn",
        color: "burlywood",
        img: "portalIn",
        onCollide: (mario, direction, instance) => {
            const portalOut = instance.world.itemList.find(item => item.type == 'portalOut');
            mario.x = portalOut.x;
            mario.y = portalOut.y;
        },
    },
    "o": {
        class: Block,
        key: "portalOut",
        color: "aliceblue",
        img: "portalOut",
    },
    "c": {
        class: Block,
        key: "ice",
        color: "lightBlue",
        img: "ice",
        onCollide: (mario) => mario.vx *= 5,
    },

    // dynamic blocks
    "@": {
        class: DynamicBlock,
        key: "solid",
        startFrame: 120,
        endFrame: null,
    },
    "#": {
        class: DynamicBlock,
        key: "solid",
        startFrame: 180,
        endFrame: null,
    },
    "5": {
        class: DynamicBlock,
        key: "solid",
        startFrame: 240,
        endFrame: null,
    },
    "6": {
        class: DynamicBlock,
        key: "solid",
        startFrame: 300,
        endFrame: null,
    },

    // enemies
    "m": {
        class: Enemy,
        key: "mushroom",
        color: "brown",
        img: "mushroom",
        tick: (instance) => {
            instance.direction = instance.world.currentFrame % 60 == 0 ? -1 : 0;
        }
    },
    "b": {
        class: Enemy,
        key: "boss1",
        color: "Ivory",
        img: "boss1",
        size: 3,
        init: (instance) => {
            instance.bossMoveDirection = 1;
        },
        reset: (instance) => {
            instance.bossMoveDirection = -1;
        },
        tick: (instance) => {
            const currentFrame = instance.world.currentFrame;
            if (currentFrame > 1500) {
                instance.die();
            } else if (currentFrame % 30 == 0) {
                if (currentFrame % 600 == 0) instance.bossMoveDirection *= -1;
                instance.direction = instance.bossMoveDirection;
                instance.up = true;
            } else {
                instance.direction = 0;
                instance.up = false;
            }
        }
    },
}


// default maps
const defaultMaps = [
    [
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                             m                    ",
        "                         &&&&&    p               ",
        "                                                  ",
        "                  m                               ",
        "              &&&&&                               ",
        "      &                                           ",
        "      &                                           ",
        "      &                                          T",
        "&&&&& &   &&       ^^   &&   &&&&&  &&   &&&&&&&&&",
        "                                                  ",
        "                                                  ",
        "                                                  ",
    ],
    [
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                           m      ",
        "&&&&&pp&&&p&&&&&&&pp&&&&&&&&&p&&&&&&&&p&&&&&      ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "       &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&p&&&&&&p&&&&",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                 m               T",
        "              &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
        "&&&&&&&&&                                         ",
    ],
    [
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "            &&&&                   pp&&pp         ",
        "            &                                     ",
        "            &i                                    ",
        "            &&&&          cccc           b     o  ",
        "                                                  ",
        "                                                  ",
        "                    &&&&                          ",
        "                                                  ",
        "                                                  ",
        "            &&&&                                  ",
        "                                                  ",
        "                                                 T",
        "&&&&&&&&&&                  &&&&&&&&&&&&&&&&&&&&&&",
        "                                                  ",
    ],
    [
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                        &&&&                      ",
        "                                   &&&&           ",
        "                                                  ",
        "                                                  ",
        "                &&&&                              ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                        &&&&&     ^^^^            ",
        "                                                  ",
        "                                                  ",
        "                                                 T",
        "&&&&&&^^&&^^&&&&&&&&                       &&&&&&&",
        "                                                  ",
        "                       &&&&pp                     ",
    ],
    [
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "    &                                             ",
        "                                                  ",
        "&&&     &                                         ",
        "  pp                                              ",
        "   ppp      &                                     ",
        "     ppp          &                               ",
        "        pppp            &                     &   ",
        "           ppppp             &      &    &        ",
        "               ppppppppppp                        ",
        "                          ppppppppppppppppp       ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
        "                                              &   ",
        "   T                                    &         ",
        "   & &    &    &    &    &    &   &        &      ",
        "                                                  ",
        "                                                  ",
        "                                                  ",
    ],
    // [
    //     "                                                  ",
    //     "                                                  ",
    //     "                                                  ",
    //     "                                                  ",
    //     "                                                 T",
    //     "&&&&&&&&6666666666666666      6666666666666666&&&&",
    //     "                                                  ",
    //     "                                                  ",
    //     "                                                  ",
    //     "&&&&&&&&#######555555555     555555555########&&&&",
    //     "                                                  ",
    //     "                                                  ",
    //     "                                                  ",
    //     "&&&&&&&&@@@@@@@@@@@@@@       @@@@@@@@&&&&&&&&&&&&&",
    //     "                                                  ",
    //     "                                                  ",
    //     "                                                  ",
    //     "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
    //     "                                                  ",
    // ],
    // [
    //     "                                                  ",
    //     "                                          o       ",
    //     "                                                  ",
    //     "                                                  ",
    //     "                                                  ",
    //     "                                                  ",
    //     "                                                  ",
    //     "                                                 T",
    //     "&&&&&@@@@@@@@########5555555566666666&&&&&&&&&&&&&",
    //     "                                                  ",
    //     "                                                  ",
    //     "                                                  ",
    //     "   i                                              ",
    //     "                                                  ",
    // ],
    [
        "                                     &            ",
        "                                     &            ",
        "                                     &           T",
        "&&&&&&    &&&&&&&&&&&&&&&&&&&&&&&&&&&&        &&&&",
        "                                     &            ",
        "i                                    &    &&&     ",
        "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&            ",
        "                                                  ",
        "                                      &&&         ",
        "                                                  ",
        "                                  &&&             ",
        "                                                  ",
        "                              &&&                 ",
        "                                                  ",
        "                          &&&                     ",
        "                                                  ",
        "                      &&&                         ",
        "                  &&&                             ",
        " o                                                ",
        "                                                  ",
        "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
    ],
    [
        "                                                  ",
        "                                                  ",
        "&&&&                                              ",
        "    &&&&&&&                                       ",
        "        &                                         ",
        "        &                                         ",
        "        &    &&&&                                 ",
        "        & p                                       ",
        "        &  p                                      ",
        "        &   p     &&&&&                           ",
        "        &    p                                    ",
        "T       &     p                                   ",
        "&&&     &      p        &&&&                      ",
        "                p                                 ",
        "                 pp            &&&&               ",
        "                   p                           m  ",
        "   &&&&             ppppppppppppppppp cccccc&&&&  ",
        "                                                  ",
        "        &                                         ",
        "        &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
        "                                                  ",
    ],
];