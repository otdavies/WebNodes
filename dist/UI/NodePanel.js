// --- IMPORTS ---
import { Block } from './Block.js';
import { Socket } from './Socket.js';
import { Edge } from './Edge.js';
import { SocketType, ToBlock, ToSocket, nodeConnections, contextMenu, nodePanel, nodeTypes } from './Shared.js';
export class NodePanel {
    constructor(document, inspector) {
        this.selectedSocket = null;
        this.selectedBlock = null;
        this.selectedBlockClickPoint = null;
        this.connectorPath = null;
        this.connectedEdges = [];
        this.shouldDragNode = false;
        this.inspector = null;
        this.document = document;
        this.inspector = inspector;
        this.AddListeners();
    }
    AddListeners() {
        this.document.addEventListener('mousedown', (evt) => this.OnLeftClickDown(evt));
        this.document.addEventListener('mouseup', (evt) => this.OnLeftClickUp(evt));
        this.document.addEventListener('mousemove', (evt) => this.OnMouseMove(evt));
        this.document.addEventListener('contextmenu', (evt) => this.OnRightClick(evt));
        this.document.addEventListener('keydown', (evt) => this.OnKeyDown(evt));
    }
    GetElementOffset(el) {
        let _x = 0;
        let _y = 0;
        while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
            _x += el.offsetLeft - el.scrollLeft;
            _y += el.offsetTop - el.scrollTop;
            el = el.offsetParent;
        }
        return { top: _y, left: _x };
    }
    CreateConnection(startSocket) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke', startSocket.color);
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.classList.add('edge');
        nodeConnections.appendChild(path);
        return path;
    }
    UpdateConnection(path, startSocket, endSocket, event) {
        const startPos = this.GetElementOffset(startSocket.element);
        const startX = startPos.left;
        const startY = startPos.top;
        let endX = 0, endY = 0;
        if (endSocket) {
            const endPos = this.GetElementOffset(endSocket.element);
            endX = endPos.left;
            endY = endPos.top;
        }
        else if (event) {
            endX = event.pageX;
            endY = event.pageY;
        }
        const dx = Math.abs(startX - endX) * 0.5;
        const d = `M ${startX},${startY} C ${startX + dx},${startY} ${endX - dx},${endY} ${endX},${endY}`;
        path.setAttribute('d', d);
        return path;
    }
    PopulateContextMenu(searchText) {
        const list = contextMenu.querySelector('ul');
        list.innerHTML = '';
        for (const nodeType of nodeTypes) {
            if (nodeType.toLowerCase().includes(searchText.toLowerCase())) {
                const listItem = document.createElement('li');
                listItem.textContent = nodeType;
                listItem.addEventListener('click', (e) => {
                    let block = this.CreateBlock(nodeType);
                    let blockElement = block.GetElement(e.clientX, e.clientY);
                    contextMenu.style.display = 'none';
                    nodePanel.appendChild(blockElement);
                });
                list.appendChild(listItem);
            }
        }
    }
    CreateBlock(nodeType) {
        let block = new Block(this.inspector, (inputs) => {
            console.log(inputs);
            // Wait 1 second in the promise
            return new Promise((resolve) => {
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
    OnLeftClickDown(evt) {
        // Hide context menu
        contextMenu.style.display = 'none';
        // Return if not a left click
        if (evt.button !== 0)
            return;
        // SOCKET CLICK START
        if (Socket.IsOutput(evt)) {
            let socket = ToSocket(evt.target);
            if (socket) {
                this.selectedSocket = socket;
                this.connectorPath = this.CreateConnection(this.selectedSocket);
            }
        }
        else {
            // Select any node
            this.shouldDragNode = true;
            if (this.selectedBlock !== null) {
                this.selectedBlock.OnDeselected();
                this.selectedBlock = null;
            }
        }
        if (this.selectedSocket !== null)
            return;
        // NODE DRAG START
        if (evt.target instanceof HTMLElement && evt.target.className === 'node') {
            let node = ToBlock(evt.target);
            if (node) {
                this.selectedBlock = node;
                this.selectedBlockClickPoint = { x: evt.offsetX, y: evt.offsetY };
                node.OnSelected();
            }
        }
    }
    OnLeftClickUp(evt) {
        // Return if not a left click
        if (evt.button !== 0)
            return;
        this.shouldDragNode = false;
        if (this.selectedSocket !== null) {
            let isInput = Socket.IsInput(evt);
            // If we released on an input socket
            if (isInput) {
                let endSocket = ToSocket(evt.target);
                if (endSocket && this.connectorPath) {
                    this.connectorPath = this.UpdateConnection(this.connectorPath, this.selectedSocket, endSocket, evt);
                    let edge = new Edge(this.connectorPath, this.selectedSocket, endSocket);
                    // Add the edges
                    this.selectedSocket.Connect(edge);
                    endSocket.Connect(edge);
                    // Add the edge to the list
                    this.connectedEdges.push(edge);
                }
            }
            else {
                // If this socket is the same as the StartSocket, remove any connections
                if (evt.target === this.selectedSocket.element) {
                    this.selectedSocket.DisconnectAll();
                }
            }
            // reset the start socket
            this.selectedSocket = null;
            // destroy the line if we didn't connect it
            if (!isInput) {
                nodeConnections.removeChild(this.connectorPath);
            }
            return;
        }
    }
    OnRightClick(evt) {
        // Return if not a right click
        if (evt.button !== 2)
            return;
        evt.preventDefault();
        if (evt.target instanceof HTMLElement && evt.target.className === 'node') {
            let node = ToBlock(evt.target);
            if (node) {
                node.Evaluate();
            }
            return;
        }
        if (evt.target instanceof HTMLElement && evt.target.id === 'nodes') {
            evt.preventDefault();
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${evt.clientX}px`;
            contextMenu.style.top = `${evt.clientY}px`;
        }
        this.PopulateContextMenu('');
    }
    OnKeyDown(evt) {
        if (evt.key === 'Delete') {
            if (this.selectedBlock !== null) {
                this.selectedBlock.OnDeselected();
                this.selectedBlock.Destroy();
                nodePanel.removeChild(this.selectedBlock.element);
                this.selectedBlock = null;
            }
        }
    }
    OnMouseMove(evt) {
        if (this.selectedSocket !== null && this.connectorPath !== null) {
            this.UpdateConnection(this.connectorPath, this.selectedSocket, null, evt);
        }
        // Drag a node, from where we clicked on it
        if (this.shouldDragNode === true && this.selectedBlock !== null && this.selectedBlockClickPoint !== null) {
            let x = evt.pageX - this.selectedBlockClickPoint.x;
            let y = evt.pageY - this.selectedBlockClickPoint.y;
            this.selectedBlock.element.style.left = x + 'px';
            this.selectedBlock.element.style.top = y + 'px';
            this.connectedEdges.forEach(edge => {
                this.UpdateConnection(edge.element, edge.startSocket, edge.endSocket, evt);
            });
        }
    }
}
