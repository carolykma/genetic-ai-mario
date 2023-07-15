# genetic-ai-mario
This project consists of a **genetic algorithm** that trains **AI Marios** to play a platformer game. The genetic algorithm has been tested and modified to support various modes & configurations that optimize for different scenarios. I have documented **my thought process** and how I have tried different approaches to improve the algorithm in the [section](#genetic-algorithm) below.

The demo website executes the algorithm in real-time, and provides a visualization of how the Mario population evolves with different algorithms and maps (it also provides a chart that shows the **evolution progress**). You can also **draw your own map** with the [Map Editor](https://genetic-ai-mario.surge.sh/draw.html) and let the AI play it!

The platformer game itself is built with a physics engine that I wrote in vanilla Javascript. It comes with a **player-controlled Mario** that is controlled by your keyboard, so you can **play the game alongside the hundreds of AI Marios** to see how you compare!

**Demo website is hosted live at: https://genetic-ai-mario.surge.sh/**

*Note: This project was initially built in 2021 as one of my first coding practices. It has been partially revamped, but some code might still be pretty messy! 🙃*

## Genetic Algorithm
**Genetic algorithm**, inspired by evolution and natural selection, is a type of algorithm that searches for optimized solutions of a problem by creating a pool of candidates (randomly generated at first), evaluating the candidates' performance, selecting the best candidates to "breed" the next generation, and repeating the process to let the pool of candidates evolve and eventually learn to solve the problem. It involves the following processes:

1. **Initialize** pool of candidates
2. **Play game** with candidates
3. **Evaluate** candidate performance
4. **Select** best candidates
5. **Breed** next generation (**mutation** & **crossover**)
6. (Repeat 2-5)

### Gene Type
To define the initial pool of candidates, the first thing is to define what their *genes* consist of, i.e. **What will be passed to the next generation if they excel?**

Initially, I tried using an array of *action* per frame as the Marios' *gene*. The platformer game detects player's *action* every frame, which translates to an *acceleration*, which it uses to calculate the subsequent movement and collisions of the Mario. This *action* consists of:
| Variable | Value | Keyboard Control(s) |
| -------- | ----- | ---------------- |
| Direction | `-1`, `0`, `1` (x-direction) | `ArrowLeft`, `ArrowRight` |
| Jump | `boolean` (Mario is jumping or not) | `ArrowUp` |

The initial idea is to randomly generate the *direction* & *jump* values for every frame (with mild probability weighting) for each Mario candidate. However, the result was that the Marios kept wiggling at more or less the same position. They did evolve to move further from the starting point, but the learning progress was very slow and the movement seemed very unnatural.

Thus, I tried modifying the gene definition so that an *action* is no longer defined by frame, but by *clicks* (or *pauses*) which last for a flexible number of frames. This is more similar to the way we actually play platformer games as a human - you don't change your action every frame, instead you move towards the left for a few frames, jump towards the right, pause for a few seconds to wait for the enemy mushroom, etc. Now, our *gene* looks like this:
| Variable | Value |
| -------- | ----- |
| Direction | `-1`, `0`, `1` (x-direction) |
| Jump | `boolean` (Mario is jumping or not) |
| Duration | `integer` (number of frames) |

The second definition of course turned out to be a lot better than the first one, but I still kept it configurable in the UI with both options, so you can try it out and see the difference for yourself.

### Selection Mode

#### Pick the Strongest
The most straightforward way of implementing selection in a genetic algorithm is to choose the best `n%` (the *strongest* based on the [evaluation mode](#evaluation-mode)) of the candidates, and breed the next generation based on their genes. This model is very effective on most of the maps where *instant gratification* is advantageous.

However, for maps that, for instance, require more zig-zagging or going backwards to reach the next platform, this model might cause the whole population to be *stuck* at a dead end. This is because a candidate finishing the game at a dead end that is closer to the target is still evaluated as *stronger*, while candidates trying to go backwards - not having evolved enough to reach the next platform - are eliminated by the algorithm due to poor evaluation scores. This selection mode also tends to generate a more homogenous population, so non-fatal behaviors might remain in the population forever even if they are not the most optimized.

To tackle these problems, I tried two other approaches:
1. Diversity Algorithm
2. Anti-Stuck Mutation

#### Diversity Algorithm
To provide a brief summary, the *Diversity Algorithm* allows comparison and elimination only when the candidates' genes are *similar* enough (how to calculate *similarity* for such complicated *gene* data is of course another long story). It assigns candidates into groups of 2, and eliminates the weaker candidate only if they are *similar* enough. If the 2 candidates are too different from each other, they will remain untouched. This allows candidates to compete and improve within the same *species* (in a sense) without killing off the rest of the population. The inspiration comes from [@beenotung](https://github.com/beenotung)'s project [ga-island](https://github.com/beenotung/ga-island), with some modifications to fit with the platformer game scenario.

#### Anti-Stuck Mutation
This approach is more straightforward - keep track of how each surviving species' performance has improved over multiple generations. If it has been *stuck* - that is, its *history best* has not improved by a certain amount over a certain number of generations - then force it to drop and re-randomize the *last 10 moves* before its death / finish. If it is still *stuck*, then extend the forced randomization further backwards, and so on.

#### Performance of Each Model
I intuitively thought the Anti-Stuck algorithm might work better, but my test results seem to show that *Diversity Algorithm* is the most effective model to produce a population that is able to break through dead ends and other bottlenecks in most of the maps. While for more straightforward maps that do not have these bottlenecks, the basic algorithm (*Pick the Strongest*) still results in a faster learning curve than the other two. All three options are available in the UI configurations for you to try it out.

### Mutation & Crossover
In order for the population to evolve, and thus have the ability to improve in performance, we need to induce variations by *mutation* or *crossover*.

(Detailed documentation on mutation & crossover will be added later)

It is also important to keep only the genes that were relevant to the candidate Marios' success in the previous round of evaluation. That is, if a Mario **dies during the run**, the *clicks* after his death should not be brought into the new generation. In fact, I decided to generate the candidate's *clicks* on the go, instead of pre-generating the full set of *clicks* when initializing the candidates. New *clicks* will be generated whenever the previous *clicks* are used up, until time runs out or the Mario dies. All the *clicks* generated will then be mutated and passed to the next generation.

### Evaluation Mode
The initial implementation is to use the distance traveled in x-direction to evaluate how well a Mario performed. This decision was made partly due to the initial gene definition (using action per frame) which causes the Marios to [wiggle a lot](#gene-type).

After improving the gene definition, and in order to try the algorithm on a larger variety of maps (which might not be purely horizontal), I wrote a **path-finding algorithm** to calculate the shortest path distance from the Mario's finish position to the map's target position (the little green flag), and used this to evaluate each candidate Mario's performance.

I run the path-finding algorithm on every position on the map whenever a new map is loaded, and store the shortest path distances from each position in a 2D array. That way, we won't have to do the heavy calculation every time we evaluate a candidate.

## Other Configurations
#### Total Number of Marios
Size of the gene pool - it proves to be crucial to the population's learning speed, as a larger population significantly increases the chance of an advantageous mutation.

#### Number of Generation per Round
To increase calculation speed, I added a configuration to calculate multiple generations of Marios in the background before each display. This way, the calculation speed will not be limited by the browser's frame rate, and user can visualize the learning progress without having to watch hundreds of generations play the game one by one.

(This part of the documentations is under progress)

<a href="https://www.freepik.com/search?format=search&last_filter=query&last_value=line+chart&query=line+chart&sort=relevance&type=icon">Icon by ibobicon</a>