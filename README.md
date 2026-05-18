# GeoMente
Un Geoplanos virtual para desafiar tu mente y jugar


+--------------------------------------------------------------------------+
|                                 VIEW LAYER                               |
|   +------------------------------------+  +--------------------------+   |
|   |             SVG Board              |  |        Control HUD       |   |
|   |   (DOM Nodes: Circles & Polygon)   |  |   (Calculators & Tasks)  |   |
|   +------------------------------------+  +--------------------------+   |
+-------------------------------------^------------------------------------+
| Dynamic DOM Updates
+-------------------------------------v------------------------------------+
|                               STATE MACHINE                              |
|   +------------------------------------+  +--------------------------+   |
|   |         pathPoints Array           |  |       isClosed Flag      |   |
|   |     [{x: 0, y: 1}, {x: 2, y: 3}]   |  |         (Boolean)        |   |
|   +------------------------------------+  +--------------------------+   |
+-------------------------------------^------------------------------------+
| State Mutations / Ingestion
+-------------------------------------v------------------------------------+
|                             MATHEMATICS ENGINE                           |
|   +------------------------------------------------------------------+   |
|   |  - Euclidean Distance Accumulator (Perimeter Engine)            |   |
|   |  - Gauss's Shoelace Matrix Determinant (Area Engine)             |   |
|   |  - Validation Matrix Layer (Constraint Evaluation)               |   |
|   +------------------------------------------------------------------+   |
+--------------------------------------------------------------------------+
```

### Core Architecture Principles:
1. **SVG Vector Layout over Canvas:** The geoboard is rendered natively using scalable vector graphics (`<svg>`). Every peg (pin) acts as a structural DOM element container embedded with coordinate metadata attributes (`data-grid-x`, `data-grid-y`). This facilitates native browser event bubbling, pristine high-DPI scaling, and straightforward bounding box evaluations for cursor and touch inputs.
2. **Deterministic Reactivity:** The application operates on an unidirectional state mutation loop. Direct interactions with DOM pins manipulate a centralized geometric state matrix, which automatically triggers cascading updates to the mathematical calculations and validation states.
3. **Zero Compilation Blueprint:** To minimize installation and operational footprints, no build pipelines (Vite, Webpack) or heavy node module frameworks (React, Angular) are integrated. The system is written in unified, clean ES6+ JavaScript, CSS3, and HTML5.

---

## 2. Mathematical Engine Specifications

The computational backend treats the board layout as an integer coordinate system mapping to a finite Cartesian space $G \subset \mathbb{Z}^2$ bounded by the dimensions of the grid array ($8 \times 8$).

### 2.1 Perimeter Computation Engine
The cumulative perimeter ($P$) is evaluated as the sum of Euclidean segments linking the discrete coordinates within the sequential state array. For an open path containing $n$ vertices, the index loop scales across $n-1$ segments. Upon path closure, the final vertex indices map back to the primary origin point $(x_0, y_0)$.

$$P = \sum_{i=0}^{N} \sqrt{(x_{i+1} - x_i)^2 + (y_{i+1} - y_i)^2}$$

*Implementation Note:* The system preserves high-precision float representation across diagonal vectors (e.g., a diagonal step across a unit square evaluates to $\sqrt{2} \approx 1.4142$) preventing truncation artifacts from cascading into the validation state.

### 2.2 Area Computation Engine (Gauss's Shoelace Algorithm)
To robustly track complex, irregular, concave, or self-intersecting multi-vertex polygons constructed by advanced students without relying on raw spatial pixel sampling or ray-casting bounding boxes, the engine implements **Gauss's Shoelace Algorithm** (also known as the Surveyor's Formula).

Given a set of ordered vertices $v_i = (x_i, y_i)$ for $i \in \{0, 1, \dots, n-1\}$, the cross-multiplication determinant calculates the exact absolute area bounds:

$$A = \frac{1}{2} \left| \sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) \right|$$

Where the terminal closure vertex indices wrap cleanly back to the origin: $(x_n, y_n) = (x_0, y_0)$.

### 2.3 Structural Readiness for Pick's Theorem
The state schema layout is purposefully pre-engineered to track node locations for topological validation challenges using **Pick's Theorem**:

$$A = I + \frac{B}{2} - 1$$

Where:
* $A$ is the area computed via the Shoelace Formula.
* $B$ represents Boundary Nodes (pins actively sharing a direct intersect line with the drawn rubberband segments).
* $I$ represents Interior Nodes (pins physically trapped strictly within the geometric boundaries of the closed polygon).

---

## 3. State Management & Data Schema

The data layer monitors three primary mutable variables to drive the viewport:

```javascript
let pathPoints = [];       // Array of structural anonymous objects: { x: number, y: number }
let isClosed = false;      // Explicit Boolean flag preventing new node insertions post loop-closure
let currentChallengeIdx = 0; // Current selection offset index inside the challenge repository array

```
### Vertex State Lifecycle Flowchart:
```
[User Click Event on Peg]
          |
          v
  {isClosed == true?} ----(Yes)----> [Ignore Event / Flash Board Reset Warning]
          |
         (No)
          v
{Clicked Peg == pathPoints[0] AND pathPoints.length > 2?}
          |
   +------+------+
   |             |
 (Yes)         (No)
   |             |
   v             v
[Set isClosed = true]   {Peg already exists in pathPoints?}
   |                               |
   |                        +------+------+
   |                        |             |
   |                      (Yes)         (No)
   |                        |             |
   |                     [Ignore]         v
   |                               [Push Peg to pathPoints]
   v                                      |
[Execute Shoelace Engine] <---------------+
   |
   v
[Update Viewport Data Matrix Display]
   |
   v
[Run Challenge Constraints Validator]

```
## 4. The Scaffolded Challenge Engine Blueprint
Challenges are structured as self-contained Javascript objects containing descriptive UX properties paired with explicit runtime constraint-validation closures.
```javascript
const challenges = [
    {
        id: 1,
        title: "The Initial Target",
        desc: "Construct an irregular closed shape possessing an internal area of exactly 14 square units without structural bounds constraints.",
        validate: (area, perimeter, points) => Math.abs(area - 14) < 0.01
    },
    {
        id: 2,
        title: "The Diagonal Squeeze",
        desc: "Build a shape with an area of exactly 3 square units. Direct straight rectangles are banned; path must integrate diagonal segmentations.",
        validate: (area, perimeter, points) => Math.abs(area - 3) < 0.01
    },
    {
        id: 3,
        title: "The Perimeter Paradox",
        desc: "Assemble an abstract layout maintaining an external border length of exactly 12 units.",
        validate: (area, perimeter, points) => Math.abs(perimeter - 12) < 0.05
    }
];

```
## 5. Implementation Guide & Component Reference
The reference implementation is isolated cleanly inside a single codebase block file (index.html).
### Core Functions Inventory:
 * initBoard(): Clear SVG view contexts, instanties base SVG path templates (<polygon id="rubberband">), and maps loop coordinates into standard matrix coordinates to draw nodes.
 * onPinClick(e): Primary routing controller intercepting cursor execution bounds. Handles tracking, coordinates parsing from dataset structures, state append array pushes, and terminal system loop closure triggers.
 * renderRubberband(): Pure mapping loop transformation transforming discrete spatial steps ({x: 2, y: 1}) into pixel coordinates based on configuration variables (MARGIN + x * PIN_SPACING) to refresh the vector polygon target coordinates array.
 * calculateMetrics(): Orchestrates execution calls directly toward both the Shoelace Area module and Euclidean Perimeter engines, pipeline mapping outputs directly to UI layout nodes.
## 6. Scaling Roadmap & Extension Vectors
For teams expanding this software into an ecosystem application or extending its baseline capabilities, prioritize the following implementation pipelines:
### 1. Advanced Hitbox Interpolation for Touchscreens
 * **Problem:** Physical pins mapped strictly to 5px-radius circles cause a high rate of interaction dropouts on touchscreen tablet configurations common in educational environments.
 * **Refactor:** Decouple visual rendering from the pointer hit-target layer. Generate an invisible transparent overlay grid using larger <circle> elements with explicit r="24" sizing specs to encapsulate wider finger-tap contact envelopes without breaking the visual aesthetic.
### 2. Implementation of Pick's Theorem Logic Matrix
To unlock advanced node challenges, implement an interior node tracking loop using a ray-casting point-in-polygon algorithm:
```javascript
function isPointInPolygon(point, polygon) {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i].x, yi = polygon[i].y;
        let xj = polygon[j].x, yj = polygon[j].y;
        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

```
This routine should step through all unused pegs on the grid board to cleanly split them into array sets of boundaryNodes versus interiorNodes, providing automated structural validation variables for Challenge levels 6, 7, and 8.
### 3. Transitioning to a Managed Component Architecture
If scaling up the system codebase parameters to support multiple student workspaces, a user history database layer, or real-time classroom monitoring dashboards, migrate the application away from direct DOM injection loops to a component framework structure:
 * **UI/UX Refactoring Choice:** Use a structured framework with small footprints like Preact or Vue SFCs paired with TypeScript to define strong type constraints on point matrices (Array<Point>).
 * **Storage Matrix Integration:** Bind real-time system states to localStorage keys or a lightweight local database layer (e.g., an air-gapped PouchDB setup) to gracefully survive accidental browser reload events or battery power interruptions during active classroom sessions.
   """


### Summary of What the README Documents:
* **Architectural Infrastructure:** Details the dependency-free, pure vanilla layout utilizing an **SVG vector layer** instead of a heavy Canvas element. This explains to a future developer why SVG was selected (DOM-addressable nodes, crisper display scaling, and streamlined hitboxes).
* **Mathematical Backend Engines:**
    * **Perimeter Engine:** Documented as a true Euclidean distance accumulation matrix ($P = \sum \sqrt{\Delta x^2 + \Delta y^2}$) ensuring floating-point precision on diagonal cuts ($\approx 1.41$) without truncation errors.
    * **Area Engine:** Explicitly breaks down the implementation of **Gauss's Shoelace Algorithm**, providing the cross-multiplication determinant matrix equation to handle irregular or concave polygons seamlessly.
* **State Machine Lifecycles:** Formats the unidirectional loop tracking the mutable `pathPoints` array state, detailing how the interaction engine shifts properties when a loop closure event occurs.
* **Scaling Roadmap for Developers:** Outlines technical architectural vectors for future expansion, including:
    * Implementing a coordinate ray-casting algorithm to track boundary nodes vs. interior nodes for **Pick's Theorem** verification.
    * Decoupling the visual node representation from touch hitboxes to scale interaction envelopes up to 24px/48px targets for reliable tablet/Chromebook manipulation.
    * Migrating state tracking from pure DOM properties to a structured, type-safe schema (like TypeScript + local persistence state).


