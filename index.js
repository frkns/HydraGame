window.addEventListener('DOMContentLoaded', () => {

    // KaTeX
    if (window.renderMathInElement) {
        window.renderMathInElement(document.body, {
            delimiters: [
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
        });
    }

    const canvas = document.getElementById('hydra');
    const ctx = canvas.getContext('2d');
    const status = document.getElementById('status');

    let step = 0;
    const radius = 10;
    const hSpacing = 40;
    const vSpacing = 80;
    let reducedGrowth = false; // when true, N = 1

    // transform state
    let scale = 1;
    let offsetX = canvas.width / 2;
    let offsetY = canvas.height - 50;

    // pan state
    let isPanning = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let justPanned = false;
    let dragged = false;

    class Node {
        constructor(id, children = []) {
            this.id = id;
            this.children = children;
            this.parent = null;
            this.x = 0;
            this.y = 0;
            this.width = 0;
            for (let child of children) {
                child.parent = this;
            }
        }
    }

    let idCounter = 0;
    function newId() {
        return idCounter++;
    }

    let root = new Node(0);

    function initHydra(length, { preserveView = false } = {}) {
        step = 0;
        idCounter = length + 1;
        let current = new Node(length);
        for (let i = length - 1; i >= 1; i--) {
            current = new Node(i, [current]);
        }
        root.children = [current];
        root.children[0].parent = root;
        canvas.removeEventListener('click', handleClick);
        canvas.addEventListener('click', handleClick);
        if (!preserveView) {
            // Reset view
            scale = 1;
            offsetX = canvas.width / 2;
            offsetY = canvas.height - 50;
        }
        redraw();
    }

    function initRandomHydra({ preserveView = false } = {}) {
        step = 0;
        idCounter = 1;
        const maxDepth = 2 + Math.floor(Math.random() * 3);
        function buildRandom(depth) {
            const node = new Node(newId());
            if (depth <= 0) {
                return node;
            }
            const r = Math.random();
            let count = r < 0.5 ? 1 : (r < 0.85 ? 2 : 3);
            for (let i = 0; i < count; i++) {
                const child = buildRandom(depth - (Math.random() < 0.3 ? 2 : 1));
                child.parent = node;
                node.children.push(child);
            }
            return node;
        }
        const randomTop = buildRandom(maxDepth);
        root.children = [randomTop];
        randomTop.parent = root;
        canvas.removeEventListener('click', handleClick);
        canvas.addEventListener('click', handleClick);
        if (!preserveView) {
            // Reset view
            scale = 1;
            offsetX = canvas.width / 2;
            offsetY = canvas.height - 50;
        }
        redraw();
    }

    function deepCopy(node, newParent) {
        const newNode = new Node(newId());
        newNode.parent = newParent;
        for (let child of node.children) {
            const newChild = deepCopy(child, newNode);
            newNode.children.push(newChild);
        }
        return newNode;
    }

    function isLeaf(node) {
        return node.children.length === 0 && node !== root;
    }

    function computeWidths(node) {
        let sum = 0;
        for (let child of node.children) {
            computeWidths(child);
            sum += child.width;
        }
        node.width = node.children.length === 0 ? hSpacing : Math.max(hSpacing, sum);
    }

    function placeNodes(node, x, y) {
        node.x = x;
        node.y = y;
        let sumChildWidth = 0;
        for (let child of node.children) {
            sumChildWidth += child.width;
        }
        let currentX = x - sumChildWidth / 2;
        for (let child of node.children) {
            placeNodes(child, currentX + child.width / 2, y - vSpacing);
            currentX += child.width;
        }
    }

    function drawTree(node) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = isLeaf(node) ? 'red' : 'blue';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.id, node.x, node.y);

        for (let child of node.children) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y - radius);
            ctx.lineTo(child.x, child.y + radius);
            ctx.stroke();
            drawTree(child);
        }
    }

    // relabel nodes; this also lets us count easily
    function relabelTree() {  
        let next = 0;
        function traverse(node) {
            node.id = next++;
            for (let c of node.children) {
                traverse(c);
            }
        }
        traverse(root);
        idCounter = next;
    }

    function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        relabelTree();
        computeWidths(root);
        // root at (0,0) in world
        placeNodes(root, 0, 0);
        // transform and draw
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        drawTree(root);
        ctx.restore();
        status.innerText = `t = ${step + 1}`;
        if (root.children.length === 0) {
            status.innerText += ' - Hydra slain!';
        }
        const n = reducedGrowth ? 1 : step + 1;
        ctx.fillStyle = 'black';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Regrowth n = ${n}${reducedGrowth ? ' (reduced)' : ''}`, canvas.width - 8, 8);
        const nodesList = getAllNodes();
        ctx.fillText(`Nodes = ${nodesList.length}`, canvas.width - 8, 28);
    }

    function chop(leaf) {
        step++;
        const P = leaf.parent;
        P.children = P.children.filter(c => c !== leaf);
        if (P !== root) {
            const G = P.parent;
            const N = reducedGrowth ? 1 : step; // growth factor
            for (let i = 0; i < N; i++) {
                const copy = deepCopy(P, G);
                G.children.push(copy);
            }
        }
        redraw();
        if (root.children.length === 0) {
            canvas.removeEventListener('click', handleClick);
        }
    }

    function handleClick(e) {
        // Suppress click if we were dragging/panning
        if (justPanned || dragged || e.button !== 0) {
            justPanned = false;
            dragged = false;
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        // Convert to world coords
        const wx = (mx - offsetX) / scale;
        const wy = (my - offsetY) / scale;
        const nodes = getAllNodes();
        for (let node of nodes) {
            if (isLeaf(node)) {
                const dx = wx - node.x;
                const dy = wy - node.y;
                if (dx * dx + dy * dy < radius * radius) {
                    chop(node);
                    break;
                }
            }
        }
        justPanned = false;
        dragged = false;
    }

    function getAllNodes() {
        const list = [];
        function traverse(node) {
            list.push(node);
            for (let c of node.children) {
                traverse(c);
            }
        }
        traverse(root);
        return list;
    }

    function toggleReducedGrowth() {
        reducedGrowth = !reducedGrowth;
        const btn = document.getElementById('reducedBtn');
        btn.textContent = `Reduced Growth: ${reducedGrowth ? 'On' : 'Off'}`;
        redraw();
    }

    document.getElementById('btnL3').addEventListener('click', () => initHydra(3, { preserveView: true }));
    document.getElementById('btnL4').addEventListener('click', () => initHydra(4, { preserveView: true }));
    document.getElementById('btnL5').addEventListener('click', () => initHydra(5, { preserveView: true }));
    document.getElementById('btnRandom').addEventListener('click', () => initRandomHydra({ preserveView: true }));
    document.getElementById('reducedBtn').addEventListener('click', toggleReducedGrowth);

    // panning with left mouse drag; zoom with wheel
    canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // left button only for panning
        const rect = canvas.getBoundingClientRect();
        lastMouseX = e.clientX - rect.left;
        lastMouseY = e.clientY - rect.top;
        isPanning = true;
        dragged = false;
        canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const dx = mx - lastMouseX;
        const dy = my - lastMouseY;
        if (dx !== 0 || dy !== 0) {
            offsetX += dx;
            offsetY += dy;
            lastMouseX = mx;
            lastMouseY = my;
            dragged = true;
            justPanned = true;
            redraw();
        }
    });

    function endPan() {
        if (isPanning) {
            isPanning = false;
            canvas.style.cursor = 'default';
            setTimeout(() => { justPanned = false; }, 50);
        }
    }

    canvas.addEventListener('mouseup', endPan);
    canvas.addEventListener('mouseleave', endPan);

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const zoomFactor = Math.exp(-e.deltaY * 0.001);
        const newScale = Math.max(0.2, Math.min(6, scale * zoomFactor));
        // world point under cursor before zoom
        const wx = (mx - offsetX) / scale;
        const wy = (my - offsetY) / scale;
        scale = newScale;
        offsetX = mx - wx * scale;
        offsetY = my - wy * scale;
        redraw();
    }, { passive: false });

    canvas.addEventListener('click', handleClick);
    // initial load: reset view
    initHydra(3, { preserveView: false });
});

