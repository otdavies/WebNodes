// --- IMPORTS ---
import { Block } from './block.js';
import { Socket } from './socket.js';
import { Edge } from './edge.js';
import { SocketType, ToBlock, ToSocket, connections, elementToBlock, elementToSocket, nodes } from './shared.js';

// --- Setup ---

let StartSocket: Socket | null = null;
let line: SVGPathElement | null = null;
let selectedBlock: Block | null = null;
let selectedBlockClickPoint: { x: number; y: number } | null = null;
let connectedEdges: Edge[] = [];

// --- UTILITY FUNCTIONS --- 

interface Offset {
  top: number;
  left: number;
}

function getOffset(el: HTMLElement): Offset {
  let _x = 0;
  let _y = 0;
  while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
    _x += el.offsetLeft - el.scrollLeft;
    _y += el.offsetTop - el.scrollTop;
    el = el.offsetParent as HTMLElement;
  }
  return { top: _y, left: _x };
}

function createConnection(startSocket: Socket): SVGPathElement {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('stroke', startSocket.color);
  path.setAttribute('stroke-width', '3');
  path.setAttribute('fill', 'none');
  path.classList.add('edge');
  connections.appendChild(path);
  return path;
}

function updateConnection(path: SVGPathElement, startSocket: Socket, endSocket: Socket | null, event: MouseEvent | null): SVGPathElement {
  const startPos = getOffset(startSocket.element);
  const startX = startPos.left;
  const startY = startPos.top;

  let endX: number = 0, endY: number = 0;
  if (endSocket) {
    const endPos = getOffset(endSocket.element);
    endX = endPos.left;
    endY = endPos.top;
  } else if (event) {
    endX = event.pageX;
    endY = event.pageY;
  }

  const dx = Math.abs(startX - endX) * 0.5;
  const d = `M ${startX},${startY} C ${startX + dx},${startY} ${endX - dx},${endY} ${endX},${endY}`;
  path.setAttribute('d', d);
  return path;
}

// --- EVENT LISTENERS ---

// Create nodes on right click
nodes.addEventListener('contextmenu', function (e) {
  if (e.target instanceof HTMLElement && e.target.id === 'nodes') {
    let node = new Block(function (inputs) { console.log(inputs); return Promise.resolve(); });
    node.AddInputSocket(new Socket(node, 'input1', 'default', SocketType.INPUT));
    node.AddInputSocket(new Socket(node, 'input2', 'number', SocketType.INPUT));
    node.AddInputSocket(new Socket(node, 'input3', 'string', SocketType.INPUT));
    node.AddOutputSocket(new Socket(node, 'output1', 'number', SocketType.OUTPUT));
    node.AddOutputSocket(new Socket(node, 'output1', 'boolean', SocketType.OUTPUT));
    let nodeElement = node.GetElement(e.pageX, e.pageY);
    nodes.appendChild(nodeElement);
  }
});

// Delete nodes
nodes.addEventListener('dblclick', function (e) {
  if (e.target instanceof HTMLElement && e.target.className === 'node') {
    let node = ToBlock(e.target);
    if (node) {
      node.Destroy();
      nodes.removeChild(e.target);
    }
  }
});

// MOUSE DOWN
nodes.addEventListener('mousedown', function (e) {
  // SOCKET CLICK START
  if (Socket.IsOutput(e)) {
    let socket = ToSocket(e.target as HTMLElement);
    if (socket) {
      StartSocket = socket;
      line = createConnection(StartSocket);
    }
  }

  if (StartSocket !== null) return;

  // NODE DRAG START
  if (e.target instanceof HTMLElement && e.target.className === 'node') {
    let node = ToBlock(e.target);
    if (node) {
      selectedBlock = node;
      selectedBlockClickPoint = { x: e.offsetX, y: e.offsetY };
      // Change the border color to yellow
      node.element.classList.add('selected');
    }
  }
});

nodes.addEventListener('mouseup', function (e) {
  if (StartSocket !== null) {
    let isInput = Socket.IsInput(e)

    // If we clicked on an input socket
    if (isInput) {
      let endSocket = ToSocket(e.target as HTMLElement);
      if (endSocket && line) {
        line = updateConnection(line, StartSocket, endSocket, e);
        let edge = new Edge(line, StartSocket, endSocket);


        // Add the edges
        StartSocket.Connect(edge);
        endSocket.Connect(edge);

        // Add the edge to the list
        connectedEdges.push(edge);
      }
    } else {
      // If this socket is the same as the StartSocket, remove any connections
      if (e.target === StartSocket.element) {
        StartSocket.DisconnectAll();
      }
    }

    // reset the start socket
    StartSocket = null;

    // destroy the line if we didn't connect it
    if (!isInput) {
      connections.removeChild(line as Node);
    }
    return;
  }

  // contains the class name "node"
  if (selectedBlock !== null) {
    selectedBlock.element.classList.remove('selected');
    selectedBlock = null;
  }
});

nodes.addEventListener('mousemove', function (e) {
  if (StartSocket !== null && line !== null) {
    updateConnection(line, StartSocket, null, e);
  }

  // Drag a node, from where we clicked on it
  if (selectedBlock !== null && selectedBlockClickPoint !== null) {
    let x = e.pageX - selectedBlockClickPoint.x;
    let y = e.pageY - selectedBlockClickPoint.y;
    selectedBlock.element.style.left = x + 'px';
    selectedBlock.element.style.top = y + 'px';

    connectedEdges.forEach(edge => {
      updateConnection(edge.element, edge.startSocket, edge.endSocket, e);
    });
  }
});