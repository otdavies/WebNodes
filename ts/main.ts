// --- IMPORTS ---
import { Block } from './block.js';
import { Socket } from './socket.js';
import { Edge } from './edge.js';
import { Inspector } from './inspector.js';
import { SocketType, ToBlock, ToSocket, connections, contextMenu, nodes, nodeTypes } from './shared.js';

// --- Setup ---

let StartSocket: Socket | null = null;
let line: SVGPathElement | null = null;
let selectedBlock: Block | null = null;
let selectedBlockClickPoint: { x: number; y: number } | null = null;
let connectedEdges: Edge[] = [];
let dragNode = false;
let inspector: Inspector = new Inspector();

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

const searchBox = contextMenu.querySelector('input')!;
searchBox.addEventListener('input', function (e) {
  const searchText = (e.target as HTMLInputElement).value;
  PopulateContextMenu(searchText);
});

function PopulateContextMenu(searchText: string) {
  const list = contextMenu.querySelector('ul')!;
  list.innerHTML = '';


  for (const nodeType of nodeTypes) {
    if (nodeType.toLowerCase().includes(searchText.toLowerCase())) {
      const listItem = document.createElement('li');
      listItem.textContent = nodeType;
      listItem.addEventListener('click', (e) => {
        let block = CreateBlock(nodeType);
        let blockElement = block.GetElement(e.clientX, e.clientY);
        contextMenu.style.display = 'none';
        nodes.appendChild(blockElement);
      });
      list.appendChild(listItem);
    }
  }
}

function CreateBlock(nodeType: string): Block {
  let block = new Block(inspector, (inputs: any[]) => {
    console.log(inputs);
    // Wait 1 second in the promise
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve(); // resolve the promise after 1 second
      }, 1000);
    });
  });

  block.AddInputSocket(new Socket(block, 'input1', 'default', SocketType.INPUT));
  block.AddInputSocket(new Socket(block, 'input2', 'number', SocketType.INPUT));
  block.AddInputSocket(new Socket(block, 'input3', 'string', SocketType.INPUT));
  block.AddOutputSocket(new Socket(block, 'output1', 'number', SocketType.OUTPUT));
  block.AddOutputSocket(new Socket(block, 'output2', 'boolean', SocketType.OUTPUT));
  return block;
}


// --- EVENT LISTENERS ---

// Create nodes on right click
nodes.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  if (e.target instanceof HTMLElement && e.target.className === 'node') {
    let node = ToBlock(e.target);
    if (node) {
      node.Evaluate();
    }
    return;
  }

  if (e.target instanceof HTMLElement && e.target.id === 'nodes') {
    e.preventDefault();
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
  } PopulateContextMenu('');
});

// Delete nodes with the delete key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Delete') {
    if (selectedBlock !== null) {
      selectedBlock.OnDeselected();
      selectedBlock.Destroy();
      nodes.removeChild(selectedBlock.element);
      selectedBlock = null;
    }
  }
});


// MOUSE DOWN
nodes.addEventListener('mousedown', function (e) {
  contextMenu.style.display = 'none';
  // Return if not a left click
  if (e.button !== 0) return;

  // SOCKET CLICK START
  if (Socket.IsOutput(e)) {
    let socket = ToSocket(e.target as HTMLElement);
    if (socket) {
      StartSocket = socket;
      line = createConnection(StartSocket);
    }
  } else {
    // Select any node
    dragNode = true;
    if (selectedBlock !== null) {
      selectedBlock.OnDeselected();
      selectedBlock = null;
    }
  }

  if (StartSocket !== null) return;

  // NODE DRAG START
  if (e.target instanceof HTMLElement && e.target.className === 'node') {
    let node = ToBlock(e.target);
    if (node) {
      selectedBlock = node;
      selectedBlockClickPoint = { x: e.offsetX, y: e.offsetY };
      node.OnSelected();
    }
  }
});

nodes.addEventListener('mouseup', function (e) {
  dragNode = false;

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
});

nodes.addEventListener('mousemove', function (e) {
  if (StartSocket !== null && line !== null) {
    updateConnection(line, StartSocket, null, e);
  }

  // Drag a node, from where we clicked on it
  if (dragNode === true && selectedBlock !== null && selectedBlockClickPoint !== null) {
    let x = e.pageX - selectedBlockClickPoint.x;
    let y = e.pageY - selectedBlockClickPoint.y;
    selectedBlock.element.style.left = x + 'px';
    selectedBlock.element.style.top = y + 'px';

    connectedEdges.forEach(edge => {
      updateConnection(edge.element, edge.startSocket, edge.endSocket, e);
    });
  }
});