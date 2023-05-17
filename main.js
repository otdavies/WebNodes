var nodes = document.getElementById('nodes');
var connections = document.getElementById('connections');
var elementToNode = new Map();
var elementToEdge = new Map();
var elementToSocket = new Map();

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

var socketColorTable = {
  'number': '#007fff',
  'string': '#8a2be2',
  'boolean': '#ff0080',
  'default': '#ff5800'
}

class Edge {
  constructor(line, startSocket, endSocket) {
    this.startSocket = startSocket;
    this.endSocket = endSocket;
    this.uuid = uuidv4();

    // Set the edge colors
    // Create the linear gradient
    let linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    linearGradient.setAttribute('id', 'grad' + this.uuid);
    linearGradient.setAttribute('gradientTransform', 'rotate(0)');
    // Create the start stop
    let startStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    startStop.setAttribute('offset', '5%');
    startStop.setAttribute('stop-color', this.startSocket.color);
    // Create the end stop
    let endStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    endStop.setAttribute('offset', '95%');
    endStop.setAttribute('stop-color', this.endSocket.color);
    // Add the stops to the gradient
    linearGradient.appendChild(startStop);
    linearGradient.appendChild(endStop);
    // Add the gradient to the SVG
    connections.appendChild(linearGradient);
    line.setAttribute('stroke', 'url(#grad' + this.uuid + ')')
    line.setAttribute('fill', 'none');
    this.element = line;

    elementToEdge.set(this.element, this);
  }

  // Destructor
  Destroy() {
    // Remove the line
    connections.removeChild(this.element);
    // Remove the gradient
    connections.removeChild(document.getElementById('grad' + this.uuid));

    elementToEdge.delete(this.element);
  }
}

// Enum for input/output sockets
const SocketType = {
  INPUT: 0,
  OUTPUT: 1
}

class Socket {
  constructor(owner, name, dataType, socketType) {
    this.node = owner;
    this.name = name;
    this.dataType = dataType;
    this.socketType = socketType;
    this.edges = [];
    this.connected = false;
    this.size = [10, 10];
    this.color = socketColorTable[dataType] || socketColorTable['default'];
    this.element = this.CreateElement();
    elementToSocket.set(this.element, this);
  }

  Connect(edge) {
    this.edges.push(edge);
    this.connected = true;
    // Add the class "connected" to any child with the class socket-label
    this.element.querySelector('.socket-label').classList.add('connected');
  }

  Disconnect(edge) {
    this.edges.splice(this.edges.indexOf(edge), 1);
    this.connected = this.edges.length > 0;
    this.element.querySelector('.socket-label').classList.remove('connected');
  }

  DisconnectAll()
  {
    // Let the sockets on the other end know
    for (let edge of this.edges) {
      if (edge.startSocket === this) {
        edge.endSocket.Disconnect(edge);
      } else {
        edge.startSocket.Disconnect(edge);
      }
      // Remove the edge from the connections container
      edge.Destroy();
    }
    
    this.edges = [];
    this.connected = false;
    this.element.querySelector('.socket-label').classList.remove('connected');
  }

  CreateElement() {
    // Create the HTML for an input / output socket
    let newSocket = document.createElement('div');
    let socketName = (this.socketType === SocketType.INPUT ? 'input' : 'output');
    newSocket.classList = 'socket ' + socketName + ' ' + this.dataType;
    newSocket.style.width = this.size[0] + 'px';
    newSocket.style.height = this.size[1] + 'px';
    newSocket.style.backgroundColor = this.color;
    // Create a text label to the left or right of the socket depending on if it is input or output
    let label = document.createElement('span');
    // We need a class to style the label
    label.classList = 'socket-label';
    label.innerHTML = this.name;
    if (this.socketType === SocketType.INPUT) {
      newSocket.appendChild(label);
    } else {
      newSocket.insertBefore(label, newSocket.firstChild);
    }
    return newSocket;
  }

  GetElement() {
    return this.element;
  }

  Destroy() {
    // Remove the socket from the node
    this.DisconnectAll();
    elementToSocket.delete(this.element);
  }
} 

class Node {
  constructor(promise) {
    this.uuid = uuidv4();
    this.promise = promise;
    this.inputs = [];
    this.outputs = [];
    this.size = [100, 100];
    this.element = this.CreateNodeHTML(0, 0);
    elementToNode.set(this.element, this);
  }

  AddInputSocket(socket) {
    this.inputs.push(socket);
    // Add the HTML
    let socketElement = socket.GetElement();
  
    let nodeHeight = this.size[1];
    let socketHeight = socket.size[1];
    let spacing = (nodeHeight - ((this.inputs.length) * socketHeight)) / (this.inputs.length + 1);
  
    for (let i = 0; i < this.inputs.length; i++) {
      this.inputs[i].element.style.top = ((i + 1) * (spacing + socketHeight)) + 'px'; // distribute vertically
    }
  
    this.element.appendChild(socketElement);
  }

  AddOutputSocket(socket) {
    this.outputs.push(socket);
    // Add the HTML
    let socketElement = socket.GetElement();
  
    let nodeHeight = this.size[1];
    let socketHeight = socket.size[1];
    let spacing = (nodeHeight - ((this.outputs.length) * socketHeight)) / (this.outputs.length + 1);
  
    for (let i = 0; i < this.outputs.length; i++) {
      this.outputs[i].element.style.top = ((i + 1) * (spacing + socketHeight)) + 'px'; // distribute vertically
    }
  
    this.element.appendChild(socketElement);
  }

  Evaluate() {
    const inputPromises = this.inputs.map(input => input.node.promise);
    return Promise.all(inputPromises).then(inputValues => {
      return this.promise(inputValues);
    });
  }

  CreateNodeHTML(x, y) {
    // Create the HTML the node
    // and add it to the nodes container
    let newNode = document.createElement('div');

    // Set the .node style size
    newNode.className = 'node';
    // Set the .node style size
    newNode.style.width = this.size[0] + 'px';
    newNode.style.height = this.size[1] + 'px';
    // Set position
    newNode.style.left = x + 'px';
    newNode.style.top = y + 'px';
    // Set the id
    newNode.id = this.uuid;

    this.element = newNode;
    return newNode;
  }

  GetElement(x, y) {
    // Set position
    this.element.style.left = x + 'px';
    this.element.style.top = y + 'px';

    // Set width and height
    this.element.style.width = this.size[0] + 'px';
    this.element.style.height = this.size[1] + 'px';
    
    return this.element;
  }

  Destroy() { 
    // Remove all edges connected to the node
    for (let socket of this.inputs) {
      socket.Destroy();
    }

    for (let socket of this.outputs) {
      socket.Destroy();
    }

    // Remove from node map
    elementToNode.delete(this.element);
  }
}

// Create nodes on right click
nodes.addEventListener('contextmenu', function(e) {
    if (e.target.id === 'nodes') {
      // Create a new node
      // Random large number
      let node = new Node(function(inputs) {console.log(inputs);});
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
nodes.addEventListener('dblclick', function(e) {
    if (e.target.className === 'node') {
      let node = ToNode(e.target);
      node.Destroy();
      nodes.removeChild(e.target);
    }
});


let StartSocket = null;
let line = null;
let selectedNode = null;
let selectedNodeClickPoint = null;

let connectedEdges = [];

function getOffset( el ) {
  var _x = 0;
  var _y = 0;
  while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
      _x += el.offsetLeft - el.scrollLeft;
      _y += el.offsetTop - el.scrollTop;
      el = el.offsetParent;
  }
  return { top: _y, left: _x };
}

function createConnection(startSocket) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('stroke', startSocket.color);
  path.setAttribute('stroke-width', '3');
  path.setAttribute('fill', 'none');
  path.classList.add('edge');
  connections.appendChild(path);
  updateConnection(path, startSocket, null);
  return path;
}

function updateConnection(path, startSocket, endSocket) {
  const startPos = getOffset(startSocket.element);
  const startX = startPos.left;
  const startY = startPos.top;

  let endX, endY;
  if (endSocket) {
    const endPos = getOffset(endSocket.element);
    endX = endPos.left;
    endY = endPos.top;
  } else {
    endX = event.pageX;
    endY = event.pageY;
  }

  const dx = Math.abs(startX - endX) * 0.5;
  const d = `M ${startX},${startY} C ${startX + dx},${startY} ${endX - dx},${endY} ${endX},${endY}`;
  path.setAttribute('d', d);
  return path;
}

function isInputSocket(e) {
  return e.target.classList.contains('socket') && e.target.classList.contains('input');
}

function isOutputSocket(e) {
  return e.target.classList.contains('socket') && e.target.classList.contains('output');
}

function isEdge(e) {
  return e.target.classList.contains('edge');
}

function ToNode(element) {
  return elementToNode.get(element);
}

function ToSocket(element) {
  return elementToSocket.get(element);
}

// MOUSE DOWN
nodes.addEventListener('mousedown', function(e) {
  // SOCKET CLICK START
  if (isOutputSocket(e)) {
    StartSocket = ToSocket(e.target);
    line = createConnection(StartSocket);
  }

  if(StartSocket !== null) return;

  // NODE DRAG START
  if(e.target.className === 'node') {
    selectedNode = ToNode(e.target);
    selectedNodeClickPoint = { x: e.offsetX, y: e.offsetY };
    // Change the border color to yellow
    selectedNode.element.classList.add('selected');
  }
});

nodes.addEventListener('mouseup', function(e) {
  if (StartSocket !== null) {
    let isInput = isInputSocket(e)

    // If we clicked on an input socket
    if(isInput) 
    {
      let endSocket = ToSocket(e.target);
      line = updateConnection(line, StartSocket, endSocket);
      let edge = new Edge(line, StartSocket, endSocket);


      // Add the edges
      StartSocket.Connect(edge);
      endSocket.Connect(edge);

      // Add the edge to the list
      connectedEdges.push(edge);
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
      connections.removeChild(line);
    }
    return;
  }

  // contains the class name "node"
  if (selectedNode !== null) {
    selectedNode.element.classList.remove('selected');
    selectedNode = null;
  }
});

nodes.addEventListener('mousemove', function(e) 
{
  if (StartSocket !== null) {
    updateConnection(line, StartSocket, null);
  }
  
  // Drag a node, from where we clicked on it
  if (selectedNode !== null) {
    let x = e.pageX - selectedNodeClickPoint.x;
    let y = e.pageY - selectedNodeClickPoint.y;
    selectedNode.element.style.left = x + 'px';
    selectedNode.element.style.top = y + 'px';

    connectedEdges.forEach(edge => {
      updateConnection(edge.element, edge.startSocket, edge.endSocket);
    });
  } 
});
