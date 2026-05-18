import { segmentLengths } from "../core/geometry.js";

const BOARD = {
  margin: 40,
  spacing: 55,
};

function px(p) {
  return {
    x: BOARD.margin + p.x * BOARD.spacing,
    y: BOARD.margin + p.y * BOARD.spacing,
  };
}

export function renderBoard(svg, state, handlers) {
  svg.innerHTML = "";

  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("fill", "rgba(236, 72, 153, 0.22)");
  polygon.setAttribute("stroke", "var(--band)");
  polygon.setAttribute("stroke-width", "4");
  polygon.setAttribute("stroke-linejoin", "round");
  polygon.setAttribute("id", "rubberband");
  svg.appendChild(polygon);

  const pointsString = state.pathPoints.map((p) => {
    const k = px(p);
    return `${k.x},${k.y}`;
  }).join(" ");
  polygon.setAttribute("points", pointsString);

  for (let x = 0; x < state.gridSize; x++) {
    for (let y = 0; y < state.gridSize; y++) {
      const c = px({ x, y });

      const visual = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      visual.setAttribute("cx", String(c.x));
      visual.setAttribute("cy", String(c.y));
      visual.setAttribute("r", "4");
      visual.setAttribute("class", "pin");
      svg.appendChild(visual);

      const hit = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      hit.setAttribute("cx", String(c.x));
      hit.setAttribute("cy", String(c.y));
      hit.setAttribute("r", "18");
      hit.setAttribute("class", "pin-hit");
      hit.dataset.gridX = String(x);
      hit.dataset.gridY = String(y);
      hit.setAttribute("tabindex", "0");
      hit.setAttribute("role", "button");
      hit.setAttribute("aria-label", `Pin ${x}, ${y}`);
      hit.addEventListener("click", handlers.onPinInteract);
      hit.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handlers.onPinInteract(e);
        }
      });
      svg.appendChild(hit);
    }
  }

  state.pathPoints.forEach((p, idx) => {
    const c = px(p);
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", String(c.x));
    dot.setAttribute("cy", String(c.y));
    dot.setAttribute("r", "6");
    dot.setAttribute("class", idx === state.selectedVertexIndex ? "vertex-dot selected" : "vertex-dot");
    svg.appendChild(dot);
  });

  const lengths = segmentLengths(state.pathPoints, state.isClosed);
  for (let i = 0; i < lengths.length; i++) {
    const a = state.pathPoints[i];
    const b = state.pathPoints[(i + 1) % state.pathPoints.length];
    if (!b) continue;
    const pa = px(a);
    const pb = px(b);
    const tx = (pa.x + pb.x) / 2;
    const ty = (pa.y + pb.y) / 2;
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(tx));
    label.setAttribute("y", String(ty));
    label.setAttribute("class", "segment-label");
    label.textContent = lengths[i].toFixed(2);
    svg.appendChild(label);
  }
}

export function updateStatusBadge(el, status) {
  if (status === "mastered") {
    el.className = "status-badge status-mastered";
    el.textContent = "Mastered ✓";
    return;
  }
  if (status === "completed") {
    el.className = "status-badge status-completed";
    el.textContent = "Completed ✓";
    return;
  }
  if (status === "retry") {
    el.className = "status-badge status-retry";
    el.textContent = "Needs Revision";
    return;
  }
  el.className = "status-badge status-active";
  el.textContent = "Active · In Progress";
}
