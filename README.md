# GeoMente

GeoMente is an interactive geoboard for learning geometry with a pedagogical progression, actionable feedback, and classroom-friendly tooling.

## Educational scope

### Target audiences
- Upper primary learners (ages 9–11)
- Middle school learners (ages 12–14)
- Teacher-led classroom and homework practice

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

- Curriculum map with challenge metadata:
  - concept tags, difficulty, prerequisites
  - hints, misconceptions, guided prompts, reflection questions
  - richer success criteria (closure, area/perimeter constraints, diagonals, symmetry, non-self-intersection, Pick’s theorem)
- Robust geometry checks:
  - duplicate detection
  - self-intersection detection
  - degeneracy checks
  - interior/boundary lattice point counting
- Step-by-step feedback panel that explains pass/fail criteria
- Visual aids:
  - segment length labels
  - interior/boundary counters
- Interaction and UX improvements:
  - touch-friendly hit targets
  - undo/redo
  - edit mode for vertex repositioning
  - keyboard shortcuts
- Accessibility/UI updates:
  - semantic regions and labels
  - focus-visible states
  - non-color status cues
  - consistent English localization
- New information architecture:
  - board zone
  - objective zone
  - feedback zone
  - progress/history zone
- Onboarding dialog for first-time users
- Progress and motivation:
  - challenge completion/mastery state
  - streak and best streak tracking
  - attempt history
- Teacher mode:
  - assignment filtering by level
- Persistence and data model:
  - schema-versioned local storage
  - profile support
  - import/export JSON for challenge progress/attempts
- Share/print/playback tools:
  - copy result summary
  - browser print
  - replay latest construction sequence

## Project architecture

- `index.html` — application layout and semantic zones
- `styles.css` — design tokens and responsive styles
- `src/data/curriculum.js` — learning model + challenge repository
- `src/core/geometry.js` — geometric computations and validators
- `src/core/challengeEngine.js` — criteria engine and pedagogical feedback
- `src/core/state.js` — undo/redo runtime state model
- `src/core/persistence.js` — schema-backed save/load/import/export
- `src/ui/render.js` — SVG board rendering and status visualization
- `src/main.js` — app orchestration and interaction flow
- `tests/*.test.js` — unit and flow tests

## Development

```bash
npm run lint
npm test
```

No build step is required; open `index.html` directly in a modern browser.
