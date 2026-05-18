export const curriculum = {
  audiences: [
    "Upper primary (ages 9–11)",
    "Middle school (ages 12–14)",
    "Teacher-led classroom and homework"
  ],
  outcomes: {
    area: "Compute and compare polygon areas on a lattice.",
    perimeter: "Compute Euclidean perimeter including diagonal segments.",
    polygons: "Classify and construct polygons from constraints.",
    symmetry: "Identify vertical/horizontal symmetry in lattice shapes.",
    transformations: "Use translations/reflections to produce equivalent figures.",
    picksTheorem: "Relate area to interior and boundary lattice points."
  },
  levels: ["intro", "guided", "mastery", "challenge"]
};

export const challenges = [
  {
    id: "intro-1",
    level: "intro",
    concept: ["area", "polygons"],
    difficulty: 1,
    title: "Build a Closed Triangle",
    description: "Create any non-degenerate triangle and close the shape.",
    prerequisites: [],
    hints: ["You need at least 3 vertices.", "Close the shape by returning to the first point."],
    misconceptions: ["Three collinear points do not form a triangle."],
    guidedPrompt: "How can you check your points are not on one straight line?",
    reflectionQuestion: "What changed when the polygon became closed?",
    successCriteria: [
      { type: "closed", expected: true },
      { type: "minVertices", value: 3 },
      { type: "nonDegenerate", expected: true }
    ]
  },
  {
    id: "guided-1",
    level: "guided",
    concept: ["area", "perimeter"],
    difficulty: 2,
    title: "Area 6, many solutions",
    description: "Construct any closed polygon with area exactly 6 square units.",
    prerequisites: ["intro-1"],
    hints: ["Rectangles are valid, but so are many irregular polygons.", "Try decomposing into unit triangles."],
    misconceptions: ["Same perimeter does not imply same area."],
    guidedPrompt: "Find two different polygons that satisfy the same area target.",
    reflectionQuestion: "How many valid solutions can you produce and why?",
    successCriteria: [
      { type: "closed", expected: true },
      { type: "areaEquals", value: 6, tolerance: 0.01 },
      { type: "nonDegenerate", expected: true }
    ]
  },
  {
    id: "guided-2",
    level: "guided",
    concept: ["perimeter", "polygons"],
    difficulty: 2,
    title: "Perimeter 12 with at least one diagonal",
    description: "Build a closed polygon with perimeter 12 and at least one diagonal edge.",
    prerequisites: ["intro-1"],
    hints: ["A diagonal has both x and y changing.", "Try triangles or pentagons."],
    misconceptions: ["Not every side needs to be axis-aligned."],
    guidedPrompt: "How does adding a diagonal affect perimeter compared with grid-only sides?",
    reflectionQuestion: "What tradeoff did you notice between shape complexity and perimeter?",
    successCriteria: [
      { type: "closed", expected: true },
      { type: "perimeterEquals", value: 12, tolerance: 0.05 },
      { type: "hasDiagonalEdge", expected: true },
      { type: "nonSelfIntersecting", expected: true }
    ]
  },
  {
    id: "mastery-1",
    level: "mastery",
    concept: ["symmetry", "area"],
    difficulty: 3,
    title: "Vertical symmetry challenge",
    description: "Create a closed polygon with area 8 that is vertically symmetric.",
    prerequisites: ["guided-1"],
    hints: ["Mirror each point around a vertical line through the center.", "Start from one half then reflect."],
    misconceptions: ["Equal left/right point count alone does not guarantee symmetry."],
    guidedPrompt: "Where is your symmetry axis and how can you verify it?",
    reflectionQuestion: "How did symmetry constraints limit your design options?",
    successCriteria: [
      { type: "closed", expected: true },
      { type: "areaEquals", value: 8, tolerance: 0.01 },
      { type: "verticalSymmetry", expected: true },
      { type: "nonSelfIntersecting", expected: true }
    ]
  },
  {
    id: "challenge-1",
    level: "challenge",
    concept: ["picksTheorem", "area"],
    difficulty: 4,
    title: "Pick's theorem verification",
    description: "Create any simple polygon and satisfy Pick’s theorem exactly.",
    prerequisites: ["mastery-1"],
    hints: ["Use interior and boundary counts shown in feedback.", "Simple polygons (no crossing edges) are easier."],
    misconceptions: ["Pick’s theorem applies to lattice polygons, not arbitrary coordinate systems."],
    guidedPrompt: "Can you predict area from interior and boundary points before calculating?",
    reflectionQuestion: "How did counting interior/boundary points support your reasoning?",
    successCriteria: [
      { type: "closed", expected: true },
      { type: "nonSelfIntersecting", expected: true },
      { type: "satisfiesPicksTheorem", tolerance: 0.001 }
    ]
  }
];
