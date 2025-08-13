/*
  Kirby–Paris Hydra (Playable Variant) in vanilla JS + SVG
  - Tree stored as nested objects; each node has id, children[], parent, depth
  - Clicking a leaf cuts it. If parent is root, just remove. Else, copy the parent's subtree
    some number of times onto the grandparent (depth-based counter), then remove the leaf.
  - Layout is computed via a tidy tree algorithm (Reingold–Tilford-ish simplified)
*/

(function() {
  const svg = document.getElementById('tree');
  const statusEl = document.getElementById('status');
  const btnSimple = document.getElementById('btnSimple');
  const btnMedium = document.getElementById('btnMedium');
  const btnRandom = document.getElementById('btnRandom');
  const btnReset = document.getElementById('btnReset');

  const WIDTH = () => svg.clientWidth || 1000;
  const HEIGHT = () => svg.clientHeight || 650;
  const NODE_R = 14;
  const LEVEL_GAP = 90;
  const SIBLING_GAP = 24; // base spacing; effective width depends on subtree size

  // State
  let hydra = null; // root node
  let moveCount = 0;
  const depthCounters = new Map(); // depth -> count used for regrowth multiplier C(d)
  let initialSeed = null; // to allow reset

  let nextId = 1;
  const newId = () => nextId++;

  // Node helpers
  function makeNode(children = []) {
    const node = { id: newId(), children, parent: null, depth: 0 };
    for (const c of children) c.parent = node;
    return node;
  }
  function cloneSubtree(node) {
    const map = new Map();
    function rec(n) {
      const copy = { id: newId(), children: [], parent: null, depth: 0 };
      map.set(n, copy);
      for (const c of n.children) {
        const cc = rec(c);
        cc.parent = copy;
        copy.children.push(cc);
      }
      return copy;
    }
    return rec(node);
  }

  function assignDepths(node, d = 0) {
    node.depth = d;
    for (const c of node.children) assignDepths(c, d + 1);
  }

  function isLeaf(n) { return n.children.length === 0; }
  function isRoot(n) { return n.parent === null; }

  // Kirby–Paris inspired rule
  function cutLeaf(leaf) {
    if (!isLeaf(leaf)) return;
    const p = leaf.parent;
    if (!p) return; // can't cut root

    // Remove leaf from parent
    p.children = p.children.filter(c => c !== leaf);

    // If parent is root, done (no regrowth)
    if (isRoot(p)) {
      moveCount++;
      afterMutation();
      return;
    }

    // Otherwise, regrow: copy parent's subtree at grandparent multiple times
    const g = p.parent;
    const d = p.depth; // depth(P) >= 1

    const prev = depthCounters.get(d) || 0;
    const k = prev + 1; // C(d)

    // Attach k copies of subtree rooted at P to G
    for (let i = 0; i < k; i++) {
      const copy = cloneSubtree(p);
      copy.parent = g;
      g.children.push(copy);
    }

    depthCounters.set(d, k);

    moveCount++;
    afterMutation();
  }

  function afterMutation() {
    assignDepths(hydra);
    render();
    updateStatus();
    checkWin();
  }

  function checkWin() {
    if (hydra.children.length === 0) {
      statusEl.textContent = `Moves: ${moveCount} — You slayed the hydra!`;
    }
  }

  function updateStatus() {
    statusEl.textContent = `Moves: ${moveCount}`;
  }

  // Layout: compute x positions using subtree sizes to prevent overlap
  function subtreeSize(n) {
    if (n.children.length === 0) return 1;
    let sum = 0;
    for (const c of n.children) sum += subtreeSize(c);
    return sum;
  }

  function computeLayout(root) {
    const W = WIDTH();
    const H = HEIGHT();

    // First pass: compute sizes
    const sizeCache = new Map();
    function size(n) {
      if (sizeCache.has(n)) return sizeCache.get(n);
      const s = n.children.length ? n.children.map(size).reduce((a,b)=>a+b,0) : 1;
      sizeCache.set(n, s);
      return s;
    }
    size(root);

    // Second pass: assign x based on sizes
    const coords = new Map();
    function place(n, xLeft, xRight, depth) {
      const x = (xLeft + xRight) / 2;
      const y = 40 + depth * LEVEL_GAP;
      coords.set(n, { x, y });
      if (n.children.length === 0) return;
      const total = n.children.map(ch => sizeCache.get(ch)).reduce((a,b)=>a+b,0);
      let cur = xLeft;
      for (const ch of n.children) {
        const w = (sizeCache.get(ch) / total) * (W - 120);
        place(ch, cur, cur + w, depth + 1);
        cur += w;
      }
    }
    place(root, 60, W - 60, 0);
    return coords;
  }

  // Rendering
  function clearSVG() { while (svg.firstChild) svg.removeChild(svg.firstChild); }

  function render() {
    clearSVG();
    assignDepths(hydra);
    const coords = computeLayout(hydra);

    // edges first
    for (const [n, pos] of coords.entries()) {
      if (!n.parent) continue;
      const p = coords.get(n.parent);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const mx = p.x, my = p.y + NODE_R;
      const tx = pos.x, ty = pos.y - NODE_R;
      const cx = (mx + tx) / 2;
      path.setAttribute('d', `M ${mx} ${my} C ${cx} ${my}, ${cx} ${ty}, ${tx} ${ty}`);
      path.setAttribute('class', 'link');
      svg.appendChild(path);
    }

    // nodes
    for (const [n, pos] of coords.entries()) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `node ${isRoot(n) ? 'root' : isLeaf(n) ? 'leaf' : 'internal'}`);
      g.setAttribute('transform', `translate(${pos.x},${pos.y})`);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', NODE_R);

      if (isLeaf(n) && !isRoot(n)) {
        circle.style.cursor = 'pointer';
        circle.addEventListener('click', e => {
          e.stopPropagation();
          cutLeaf(n);
        });
      }

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dy', '4');
      label.textContent = `${n.depth}`;

      g.appendChild(circle);
      g.appendChild(label);

      // badge showing number of children
      if (n.children.length) {
        const bx = NODE_R + 10, by = -NODE_R;
        const badge = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        badge.setAttribute('x', bx);
        badge.setAttribute('y', by);
        badge.setAttribute('rx', '4');
        badge.setAttribute('ry', '4');
        badge.setAttribute('width', '20');
        badge.setAttribute('height', '16');
        badge.setAttribute('class', 'badge');
        const btxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        btxt.setAttribute('x', bx + 10);
        btxt.setAttribute('y', by + 12);
        btxt.setAttribute('text-anchor', 'middle');
        btxt.setAttribute('class', 'badge-text');
        btxt.textContent = `${n.children.length}`;
        g.appendChild(badge);
        g.appendChild(btxt);
      }

      svg.appendChild(g);
    }
  }

  // Hydra generators
  function lineHydra(length) {
    // root with a chain of single children, ending in leaf
    let root = makeNode([]);
    let cur = root;
    for (let i = 0; i < length; i++) {
      const child = makeNode([]);
      child.parent = cur;
      cur.children.push(child);
      cur = child;
    }
    assignDepths(root);
    return root;
  }

  function balancedHydra(depth, branching = 2) {
    function rec(d) {
      if (d === 0) return makeNode([]);
      const kids = Array.from({ length: branching }, () => rec(d - 1));
      const n = makeNode(kids);
      return n;
    }
    const r = rec(depth);
    assignDepths(r);
    return r;
  }

  function randomHydra(maxDepth = 5, maxBranch = 3, leafBias = 0.4) {
    function rec(d) {
      if (d === maxDepth || Math.random() < leafBias) return makeNode([]);
      const k = 1 + Math.floor(Math.random() * maxBranch);
      const kids = Array.from({ length: k }, () => rec(d + 1));
      return makeNode(kids);
    }
    const r = makeNode([rec(1), rec(1)]);
    assignDepths(r);
    return r;
  }

  function resetCounters() { depthCounters.clear(); }

  function setHydra(root, seed = null) {
    hydra = root;
    assignDepths(hydra);
    moveCount = 0;
    resetCounters();
    initialSeed = seed;
    render();
    updateStatus();
  }

  // Controls
  btnSimple.addEventListener('click', () => {
    nextId = 1;
    setHydra(balancedHydra(3, 2), { type: 'simple' });
  });
  btnMedium.addEventListener('click', () => {
    nextId = 1;
    setHydra(balancedHydra(4, 3), { type: 'medium' });
  });
  btnRandom.addEventListener('click', () => {
    nextId = 1;
    const seed = Math.random().toString(36).slice(2, 8);
    // Not using true seeded RNG; capture seed for display only
    setHydra(randomHydra(5, 3, 0.35), { type: 'random', seed });
  });
  btnReset.addEventListener('click', () => {
    if (!initialSeed) return;
    // Recreate based on seed.type; seed.seed not used deterministically here
    nextId = 1;
    switch (initialSeed.type) {
      case 'simple': setHydra(balancedHydra(3, 2), initialSeed); break;
      case 'medium': setHydra(balancedHydra(4, 3), initialSeed); break;
      case 'random': setHydra(randomHydra(5, 3, 0.35), initialSeed); break;
    }
  });

  // Initialize
  setHydra(balancedHydra(3, 2), { type: 'simple' });

  // Resize handling
  window.addEventListener('resize', () => render());
})();

