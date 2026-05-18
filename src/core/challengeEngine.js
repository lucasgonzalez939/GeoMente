import {
  areaShoelace,
  hasDiagonalEdge,
  hasSelfIntersection,
  interiorBoundaryCounts,
  isDegenerate,
  isVerticallySymmetric,
  perimeter,
} from "./geometry.js";
import { t } from "./i18n.js";

export function evaluateChallenge(challenge, points, isClosed, gridSize, locale = "en") {
  const area = areaShoelace(points, isClosed);
  const per = perimeter(points, isClosed);
  const selfIntersect = hasSelfIntersection(points, isClosed);
  const degenerate = isDegenerate(points, isClosed);
  const pickCounts = interiorBoundaryCounts(points, isClosed, gridSize);
  const picksResidual = Math.abs(area - (pickCounts.interior + pickCounts.boundary / 2 - 1));

  const feedback = [
    t(locale, "feedback.shapeStatus", { state: t(locale, `feedback.shape.${isClosed ? "closed" : "open"}`) }),
    t(locale, "feedback.verticesSelected", { count: points.length }),
    t(locale, "feedback.areaPerimeter", { area: area.toFixed(2), perimeter: per.toFixed(2) }),
  ];
  if (selfIntersect) feedback.push(t(locale, "feedback.edgesIntersect"));
  if (degenerate) feedback.push(t(locale, "feedback.degenerate"));
  feedback.push(t(locale, "feedback.interiorBoundary", {
    interior: pickCounts.interior,
    boundary: pickCounts.boundary,
  }));

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
    feedback.push(`${item.ok ? "✓" : "✗"} ${describeCriterion(item.criterion, locale)}`);
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

function describeCriterion(criterion, locale) {
  switch (criterion.type) {
    case "closed":
      return t(locale, `criterion.closed.${String(criterion.expected)}`);
    case "minVertices":
      return t(locale, "criterion.minVertices", { value: criterion.value });
    case "areaEquals":
      return t(locale, "criterion.areaEquals", { value: criterion.value });
    case "perimeterEquals":
      return t(locale, "criterion.perimeterEquals", { value: criterion.value });
    case "nonDegenerate":
      return t(locale, "criterion.nonDegenerate");
    case "nonSelfIntersecting":
      return t(locale, "criterion.nonSelfIntersecting");
    case "hasDiagonalEdge":
      return t(locale, "criterion.hasDiagonalEdge");
    case "verticalSymmetry":
      return t(locale, "criterion.verticalSymmetry");
    case "satisfiesPicksTheorem":
      return t(locale, "criterion.satisfiesPicksTheorem");
    default:
      return t(locale, "criterion.unknown", { type: criterion.type });
  }
}
