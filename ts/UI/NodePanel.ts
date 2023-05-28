// --- IMPORTS ---
import { Block } from './Block.js';
import { Socket } from './Socket.js';
import { Edge } from './Edge.js';
import { InspectorPanel } from './InspectorPanel.js';
import { SocketType, ToBlock, ToSocket, nodeConnections, contextMenu, nodePanel, nodeTypes, workspace, elementToBlock } from './Shared.js';

interface Offset {
    top: number;
    left: number;
}

export class NodePanel {
    panel: HTMLElement;
    selectedSocket: Socket | null = null;
    selectedBlock: Block | null = null;
    lastMousePosition: { x: number; y: number } | null = null;
    connectorPath: SVGPathElement | null = null;
    shouldDragNode = false;
    shouldDragGraph = false;
    graphOffset = { x: 0, y: 0 };
    scaleFactor = 1;
    inspector: InspectorPanel | null = null;

    edges: Edge[] = [];
    blocks: Block[] = [];

    constructor(document: HTMLElement, inspector: InspectorPanel) {
        this.panel = document;
        this.inspector = inspector;
        this.AddListeners();
    }

    private AddListeners() {
        this.panel.addEventListener('mousedown', (evt) => this.OnLeftClickDown(evt));
        this.panel.addEventListener('mouseup', (evt) => this.OnLeftClickUp(evt));
        this.panel.addEventListener('mousemove', (evt) => this.OnMouseMove(evt));
        this.panel.addEventListener('contextmenu', (evt) => this.OnRightClick(evt));
        this.panel.addEventListener('wheel', (evt) => this.OnMouseWheel(evt));

        // This needs to listen from document, not panel
        document.addEventListener('keydown', (evt) => this.OnKeyDown(evt));
    }

    private GetElementOffset(el: HTMLElement): Offset {
        let _x = 0;
        let _y = 0;
        while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
            _x += el.offsetLeft - el.scrollLeft;
            _y += el.offsetTop - el.scrollTop;
            el = el.offsetParent as HTMLElement;
        }
        return { top: _y, left: _x };
    }

    private GetMousePosition(evt: MouseEvent): { x: number, y: number } {
        let rect = this.panel.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left - this.graphOffset.x) / this.scaleFactor,
            y: (evt.clientY - rect.top - this.graphOffset.y) / this.scaleFactor
        }
    }

    private CreateConnection(startSocket: Socket): SVGPathElement {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke', startSocket.color);
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.classList.add('edge');
        nodeConnections.appendChild(path);
        return path;
    }

    private UpdateConnection(path: SVGPathElement, startSocket: Socket, endSocket: Socket | null, event: MouseEvent | null): SVGPathElement {
        const startPos = this.GetElementOffset(startSocket.element);
        const startX = startPos.left;
        const startY = startPos.top;

        let endX: number = 0, endY: number = 0;
        if (endSocket) {
            const endPos = this.GetElementOffset(endSocket.element);
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

    private PopulateContextMenu(searchText: string) {
        const list = contextMenu.querySelector('ul')!;
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

    private CreateBlock(nodeType: string): Block {
        let block = new Block(this.inspector);

        block.AddInputSocket(new Socket(block, 'input1', 'default', SocketType.INPUT, 0));
        block.AddInputSocket(new Socket(block, 'input2', 'number', SocketType.INPUT, 1));
        block.AddInputSocket(new Socket(block, 'input3', 'string', SocketType.INPUT, 2));
        block.AddOutputSocket(new Socket(block, 'output1', 'number', SocketType.OUTPUT, 0));
        block.AddOutputSocket(new Socket(block, 'output2', 'boolean', SocketType.OUTPUT, 1));
        this.blocks.push(block);
        return block;
    }

    private OnLeftClickDown(evt: MouseEvent) {
        // Hide context menu
        contextMenu.style.display = 'none';
        // Return if not a left click
        if (evt.button !== 0) return;

        // SOCKET CLICK START
        if (Socket.IsOutput(evt)) {
            let socket = ToSocket(evt.target as HTMLElement);
            if (socket) {
                this.selectedSocket = socket;
                this.connectorPath = this.CreateConnection(this.selectedSocket);
            }
        } else {
            // Select any node
            this.shouldDragNode = true;
            if (this.selectedBlock !== null) {
                this.selectedBlock.OnDeselected();
                this.selectedBlock = null;
            }
        }

        if (this.selectedSocket !== null) return;

        // NODE DRAG START
        if (evt.target instanceof HTMLElement && evt.target.className === 'node') {
            let node = ToBlock(evt.target);
            if (node) {
                this.lastMousePosition = { x: evt.offsetX, y: evt.offsetY };
                this.selectedBlock = node;
                node.OnSelected();
            }
        } else if (evt.target === this.panel) {
            this.shouldDragGraph = true;
            this.lastMousePosition = { x: evt.clientX, y: evt.clientY };
        }
    }

    private OnLeftClickUp(evt: MouseEvent) {
        // Return if not a left click
        if (evt.button !== 0) return;

        this.shouldDragNode = false;
        this.shouldDragGraph = false;

        if (this.selectedSocket !== null) {
            let isInput = Socket.IsInput(evt)

            // If we released on an input socket
            if (isInput) {
                let endSocket = ToSocket(evt.target as HTMLElement);
                if (endSocket && this.connectorPath) {
                    this.connectorPath = this.UpdateConnection(this.connectorPath, this.selectedSocket, endSocket, evt);
                    let edge = new Edge(this.connectorPath, this.selectedSocket, endSocket);


                    // Add the edges
                    this.selectedSocket.Connect(edge);
                    endSocket.Connect(edge);

                    // Add the edge to the list
                    this.edges.push(edge);
                }
            } else {
                // If this socket is the same as the StartSocket, remove any connections
                if (evt.target === this.selectedSocket.element) {
                    this.selectedSocket.DisconnectAll();
                }
            }

            // reset the start socket
            this.selectedSocket = null;

            // destroy the line if we didn't connect it
            if (!isInput) {
                nodeConnections.removeChild(this.connectorPath as Node);
            }
            return;
        }
    }

    private OnRightClick(evt: MouseEvent) {
        // Return if not a right click
        if (evt.button !== 2) return;

        evt.preventDefault();
        if (evt.target instanceof HTMLElement && evt.target.className === 'node') {
            let node = ToBlock(evt.target);
            if (node) {
                node.Evaluate();
                return;
            }
            return;
        }

        if (evt.target instanceof HTMLElement && evt.target.id === 'nodes') {
            evt.preventDefault();
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${evt.clientX}px`;
            contextMenu.style.top = `${evt.clientY}px`;
        } this.PopulateContextMenu('');
    }

    private OnKeyDown(evt: KeyboardEvent) {
        if (evt.key === 'Delete') {
            if (this.selectedBlock !== null) {
                this.selectedBlock.OnDeselected();
                this.selectedBlock.Destroy();
                nodePanel.removeChild(this.selectedBlock.element);
                elementToBlock.delete(this.selectedBlock.element);
                this.blocks.splice(this.blocks.indexOf(this.selectedBlock), 1);
                this.selectedBlock = null;
            }
        }
        // If you hit D with a node selected and the cursor is over the node panel, duplicate the node
        if (evt.key === 'd' && this.selectedBlock !== null) {
            let newBlock = this.CloneBlock(this.selectedBlock);
            this.selectedBlock.OnDeselected();
            this.selectedBlock = null;
            this.blocks.push(newBlock);
            nodePanel.appendChild(newBlock.element);
            this.selectedBlock = newBlock;
            this.selectedBlock.OnSelected();
        }
    }

    private CloneBlock(block: Block): Block {
        let newBlock = new Block(this.inspector);

        // Copy the properties from the original block
        newBlock.SetProperties(block.DeepCopyProperties());

        // Add the inputs
        for (let i in block.inputs) {
            let input = block.inputs[i];
            let index = parseInt(i) + 1;
            newBlock.AddInputSocket(new Socket(newBlock, "Input" + index, input.dataType, input.socketType, input.socketNumber));
        }

        // Add the outputs
        for (let i in block.outputs) {
            let output = block.outputs[i];
            let index = parseInt(i) + 1;
            newBlock.AddOutputSocket(new Socket(newBlock, "Output" + index, output.dataType, output.socketType, output.socketNumber));
        }

        // place the block next to the original block
        newBlock.element.style.left = (parseInt(block.element.style.left) + 20) + 'px';
        newBlock.element.style.top = (parseInt(block.element.style.top) + 20) + 'px';
        // Ontop of the original block
        newBlock.element.style.zIndex = (parseInt(block.element.style.zIndex) + 1) + '';

        elementToBlock.set(newBlock.element, newBlock);
        return newBlock;
    }

    private OnMouseMove(evt: MouseEvent) {
        if (this.selectedSocket !== null && this.connectorPath !== null) {
            this.UpdateConnection(this.connectorPath, this.selectedSocket, null, evt);
        }

        // Drag a node, from where we clicked on it
        if (this.shouldDragNode === true && this.selectedBlock !== null && this.lastMousePosition !== null) {
            let x = evt.pageX - this.lastMousePosition.x;
            let y = evt.pageY - this.lastMousePosition.y;
            this.selectedBlock.element.style.left = x + 'px';
            this.selectedBlock.element.style.top = y + 'px';

            this.edges.forEach(edge => {
                this.UpdateConnection(edge.element, edge.startSocket, edge.endSocket, evt);
            });
        }

        // Drag the graph
        if (this.shouldDragGraph) {
            if (this.lastMousePosition === null) return;
            const dx = evt.clientX - this.lastMousePosition.x;
            const dy = evt.clientY - this.lastMousePosition.y;
            this.lastMousePosition = { x: evt.clientX, y: evt.clientY };
            // Move background
            workspace.style.backgroundPositionX = (this.graphOffset.x || 0) + dx + 'px';
            workspace.style.backgroundPositionY = (this.graphOffset.y || 0) + dy + 'px';

            this.blocks.forEach(block => {
                block.element.style.left = (parseFloat(block.element.style.left) || 0) + dx + 'px';
                block.element.style.top = (parseFloat(block.element.style.top) || 0) + dy + 'px';

                block.outputs.forEach(socket => {
                    socket.edges.forEach(edge => {
                        this.UpdateConnection(edge.element, edge.startSocket, edge.endSocket, null);
                    });
                });

                block.inputs.forEach(socket => {
                    socket.edges.forEach(edge => {
                        this.UpdateConnection(edge.element, edge.startSocket, edge.endSocket, null);
                    });
                });
            });

            this.graphOffset = { x: this.graphOffset.x + dx, y: this.graphOffset.y + dy };
        }
    }

    private OnMouseWheel(evt: WheelEvent) {
        const zoomTarget = this.GetMousePosition(evt);
        // This determines the sensitivity of the zoom.
        const zoomSensitivity = -0.001;
        // DeltaY will be a positive value when scrolling down, and a negative value when scrolling up.
        let scaleChange = 1 + (evt.deltaY * zoomSensitivity);
        this.scaleFactor *= scaleChange;
        this.scaleFactor = Math.max(this.scaleFactor, 0.1); // Limit the minimum scale to prevent inversion.
        this.scaleFactor = Math.min(this.scaleFactor, 1); // Limit the maximum scale.
        this.graphOffset.x = zoomTarget.x - (zoomTarget.x - this.graphOffset.x) * scaleChange;
        this.graphOffset.y = zoomTarget.y - (zoomTarget.y - this.graphOffset.y) * scaleChange;

        this.ApplyScale();
    }

    private ApplyScale() {
        this.panel.style.transform = `translate(${this.graphOffset.x}px, ${this.graphOffset.y}px) scale(${this.scaleFactor})`;
    }
}