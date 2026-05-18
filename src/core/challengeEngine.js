import {
  areaShoelace,
  hasDiagonalEdge,
  hasSelfIntersection,
  interiorBoundaryCounts,
  isDegenerate,
  isVerticallySymmetric,
  perimeter,
} from "./geometry.js";

export function evaluateChallenge(challenge, points, isClosed, gridSize) {
  const area = areaShoelace(points, isClosed);
  const per = perimeter(points, isClosed);
  const selfIntersect = hasSelfIntersection(points, isClosed);
  const degenerate = isDegenerate(points, isClosed);
  const pickCounts = interiorBoundaryCounts(points, isClosed, gridSize);
  const picksResidual = Math.abs(area - (pickCounts.interior + pickCounts.boundary / 2 - 1));

  const feedback = [
    `Shape is ${isClosed ? "closed" : "open"}.`,
    `Vertices selected: ${points.length}.`,
    `Area = ${area.toFixed(2)}, perimeter = ${per.toFixed(2)}.`,
  ];
  if (selfIntersect) feedback.push("Edges intersect: shape is not simple.");
  if (degenerate) feedback.push("Degenerate polygon detected (area near 0).");
  feedback.push(`Interior points: ${pickCounts.interior}, boundary points: ${pickCounts.boundary}.`);

  const criterionResults = challenge.successCriteria.map((criterion) => {
    const ok = criterionPass(criterion, {
      points,
      isClosed,
      area,
      perimeter: per,
      selfIntersect,
      degenerate,
      pickCounts,
      picksResidual,
    });
    return { criterion, ok };
  });

  criterionResults.forEach((item) => {
    feedback.push(`${item.ok ? "✓" : "✗"} ${describeCriterion(item.criterion)}`);
  });

  const passed = criterionResults.every((x) => x.ok);
  return {
    passed,
    area,
    perimeter: per,
    feedback,
    pickCounts,
    criterionResults,
    selfIntersect,
    degenerate,
  };
}

function criterionPass(criterion, context) {
  switch (criterion.type) {
    case "closed":
      return context.isClosed === criterion.expected;
    case "minVertices":
      return context.points.length >= criterion.value;
    case "areaEquals":
      return context.isClosed && Math.abs(context.area - criterion.value) <= (criterion.tolerance ?? 0.01);
    case "perimeterEquals":
      return context.isClosed && Math.abs(context.perimeter - criterion.value) <= (criterion.tolerance ?? 0.05);
    case "nonDegenerate":
      return !context.degenerate;
    case "nonSelfIntersecting":
      return !context.selfIntersect;
    case "hasDiagonalEdge":
      return hasDiagonalEdge(context.points, context.isClosed) === criterion.expected;
    case "verticalSymmetry":
      return isVerticallySymmetric(context.points, context.isClosed) === criterion.expected;
    case "satisfiesPicksTheorem":
      return context.isClosed && !context.selfIntersect && context.picksResidual <= (criterion.tolerance ?? 0.001);
    default:
      return false;
  }
}

function describeCriterion(criterion) {
  switch (criterion.type) {
    case "closed":
      return criterion.expected ? "Close your polygon." : "Keep path open.";
    case "minVertices":
      return `Use at least ${criterion.value} vertices.`;
    case "areaEquals":
      return `Area must be ${criterion.value}.`;
    case "perimeterEquals":
      return `Perimeter must be ${criterion.value}.`;
    case "nonDegenerate":
      return "Polygon must have non-zero area.";
    case "nonSelfIntersecting":
      return "Polygon must not self-intersect.";
    case "hasDiagonalEdge":
      return "Include at least one diagonal edge.";
    case "verticalSymmetry":
      return "Shape should be vertically symmetric.";
    case "satisfiesPicksTheorem":
      return "Satisfy Pick's theorem A = I + B/2 - 1.";
    default:
      return `Unknown criterion ${criterion.type}.`;
  }
}
