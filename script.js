const canvas = document.getElementById('canvas');
const svg = document.getElementById('svg-canvas');
let nodesData = [];

function init() {
    const saved = localStorage.getItem('myMindMapData');
    if (saved && JSON.parse(saved).length > 0) {
        const data = JSON.parse(saved);
        data.forEach(d => createNode(d.text, d.left, d.top, d.className, d.id, d.parentId));
    } else {
        createNode('Sujet Central', '45vw', '45vh', 'node', 'root', null);
    }
}

function createNode(text, left, top, className, id, parentId) {
    const newNode = document.createElement('div');
    newNode.className = className;
    newNode.style.left = left;
    newNode.style.top = top;
    newNode.id = id || 'node-' + Date.now();

    const span = document.createElement('span');
    span.innerText = text;
    span.contentEditable = "true";
    newNode.appendChild(span);

    // Bouton + pour attacher une nouvelle idée
    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn';
    addBtn.innerHTML = '+';
    addBtn.onclick = (e) => {
        e.stopPropagation();
        const x = (parseInt(newNode.style.left) + 180) + 'px';
        const y = (parseInt(newNode.style.top) + 40) + 'px';
        createNode('Nouvelle Idée', x, y, 'node', null, newNode.id);
        saveMap();
    };
    newNode.appendChild(addBtn);

    // Bouton X pour supprimer
    if (newNode.id !== 'root') {
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.innerHTML = '×';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            removeNodeAndChildren(newNode.id);
        };
        newNode.appendChild(delBtn);
    }

    // Événements
    makeDraggable(newNode);
    addColorCycle(newNode);
    span.oninput = () => { drawLines(); saveMap(); };

    canvas.appendChild(newNode);
    nodesData.push({ id: newNode.id, parentId: parentId, element: newNode });
    drawLines();
}

function makeDraggable(el) {
    let x = 0, y = 0;
    el.onmousedown = (e) => {
        if (e.target.tagName === 'SPAN' || e.target.tagName === 'BUTTON') return;
        x = e.clientX - el.offsetLeft;
        y = e.clientY - el.offsetTop;
        document.onmousemove = (e) => {
            el.style.left = (e.clientX - x) + 'px';
            el.style.top = (e.clientY - y) + 'px';
            drawLines();
        };
        document.onmouseup = () => { document.onmousemove = null; saveMap(); };
    };
}

function addColorCycle(el) {
    const colors = ['color-green', 'color-yellow', 'color-red'];
    el.oncontextmenu = (e) => {
        e.preventDefault();
        let idx = colors.findIndex(c => el.classList.contains(c));
        el.classList.remove(...colors);
        if (idx < colors.length - 1) el.classList.add(colors[idx + 1]);
        saveMap();
    };
}

function drawLines() {
    svg.innerHTML = '';
    nodesData.forEach(node => {
        if (!node.parentId) return;
        const parent = nodesData.find(n => n.id === node.parentId);
        if (parent) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", parent.element.offsetLeft + parent.element.offsetWidth / 2);
            line.setAttribute("y1", parent.element.offsetTop + parent.element.offsetHeight / 2);
            line.setAttribute("x2", node.element.offsetLeft + node.element.offsetWidth / 2);
            line.setAttribute("y2", node.element.offsetTop + node.element.offsetHeight / 2);
            line.setAttribute("stroke", "#bdc3c7");
            line.setAttribute("stroke-width", "2");
            svg.appendChild(line);
        }
    });
}

function saveMap() {
    const data = nodesData.map(n => ({
        id: n.id, parentId: n.parentId,
        text: n.element.querySelector('span').innerText,
        left: n.element.style.left, top: n.element.style.top,
        className: n.element.className
    }));
    localStorage.setItem('myMindMapData', JSON.stringify(data));
}

function removeNodeAndChildren(id) {
    const children = nodesData.filter(n => n.parentId === id);
    children.forEach(c => removeNodeAndChildren(c.id));
    const node = nodesData.find(n => n.id === id);
    if (node) {
        node.element.remove();
        nodesData = nodesData.filter(n => n.id !== id);
    }
    drawLines();
    saveMap();
}

function resetMap() {
    if(confirm("Tout effacer ?")) {
        localStorage.clear();
        location.reload();
    }
}

function exportToImage() {
    html2canvas(document.querySelector("#canvas")).then(canvas => {
        const link = document.createElement('a');
        link.download = 'mindmap.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

init();