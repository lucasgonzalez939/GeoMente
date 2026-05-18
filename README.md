# GeoMente

GeoMente is an interactive geoboard for learning geometry through **encouragement, exploration, and reflection**.

## Educational scope

### Target audiences
- Upper primary learners (ages 9–11)
- Middle school learners (ages 12–14)
- Individual and classroom practice

### Measurable learning outcomes
- Area: compute and compare polygon area on lattice grids
- Perimeter: compute Euclidean perimeter including diagonal edges
- Polygons: construct/classify polygons under constraints
- Symmetry: satisfy vertical symmetry constraints
- Transformations: reason about equivalent shapes via movement/reflection
- Pick’s theorem: relate area to interior and boundary lattice points

### Learner journey
- **Intro**: closure and valid polygon construction
- **Guided**: target area/perimeter and strategy prompts
- **Mastery**: extra constraints (e.g., symmetry)
- **Challenge**: theorem-level verification (Pick’s theorem)

## Features implemented

- Curriculum map with pedagogical metadata:
  - concept tags, difficulty, prerequisites
  - hints, misconceptions, guided prompts, reflection questions
  - richer criteria (closure, area/perimeter, diagonals, symmetry, non-self-intersection, Pick’s theorem)
- Robust geometry checks:
  - duplicate detection
  - self-intersection detection
  - degeneracy checks
  - interior/boundary lattice point counting
- Step-by-step feedback explaining what is satisfied and what to revise
- Visual decomposition aids:
  - segment length labels
  - interior/boundary counters
- Interaction and accessibility improvements:
  - touch-friendly hit targets
  - undo/redo
  - edit mode for vertex repositioning
  - keyboard shortcuts
  - semantic labels and focus-visible states
- UI information architecture:
  - board zone
  - objective zone
  - feedback zone
  - encouragement/reflection zone
- Onboarding tutorial for first-time users
- Encouragement-first design:
  - supportive status messages
  - reflection log and reflective sharing text
  - no teacher mode and no grading dashboard
- Session persistence:
  - schema-versioned local storage
  - session import/export
  - playback snapshots

## Project architecture

- `index.html` — application layout and semantic zones
- `styles.css` — design tokens and responsive styles
- `src/data/curriculum.js` — learning model + challenge repository
- `src/core/geometry.js` — geometric computations and validators
- `src/core/challengeEngine.js` — criteria engine and pedagogical feedback
- `src/core/state.js` — undo/redo runtime state model
- `src/core/persistence.js` — local session save/load/import/export
- `src/ui/render.js` — SVG board rendering and status visualization
- `src/main.js` — app orchestration and interaction flow
- `tests/*.test.js` — unit and flow tests

## Development

```bash
npm run lint
npm test
```

No build step is required; open `index.html` in a modern browser.
