import { Block } from "./Block.js";
import { Edge } from "./Edge.js";
import { SocketType, elementToSocket, socketColorTable } from "./Shared.js";

export class Socket {
    owner: Block;
    name: string;
    dataType: string;
    socketType: SocketType;
    edges: Edge[];
    connected: boolean;
    size: number[];
    color: string;
    element: HTMLElement;

    constructor(owner: Block, name: string, dataType: string, socketType: SocketType) {
        this.owner = owner;
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

    Connect(edge: Edge) {
        this.edges.push(edge);
        this.connected = true;
        this.element.querySelector('.socket-label')?.classList.add('connected');
        this.owner.SetDirty();
    }

    Disconnect(edge: Edge) {
        this.edges.splice(this.edges.indexOf(edge), 1);
        this.connected = this.edges.length > 0;
        this.element.querySelector('.socket-label')?.classList.remove('connected');
        this.owner.SetDirty();
    }

    DisconnectAll() {
        for (let edge of this.edges) {
            if (edge.startSocket === this) {
                edge.endSocket.Disconnect(edge);
            } else {
                edge.startSocket.Disconnect(edge);
            }
            edge.Destroy();
        }

        this.edges = [];
        this.connected = false;
        this.element.querySelector('.socket-label')?.classList.remove('connected');
        this.owner.SetDirty();
    }

    CreateElement(): HTMLElement {
        let newSocket = document.createElement('div');
        let socketName = (this.socketType === SocketType.INPUT ? 'input' : 'output');
        newSocket.className = 'socket ' + socketName + ' ' + this.dataType;
        newSocket.style.width = this.size[0] + 'px';
        newSocket.style.height = this.size[1] + 'px';
        newSocket.style.backgroundColor = this.color;

        let label = document.createElement('span');
        label.className = 'socket-label';
        label.innerHTML = this.name;
        if (this.socketType === SocketType.INPUT) {
            newSocket.appendChild(label);
        } else {
            newSocket.insertBefore(label, newSocket.firstChild as Node);
        }
        return newSocket;
    }

    static IsInput(e: MouseEvent): boolean {
        return e.target instanceof Element && e.target.classList.contains('socket') && e.target.classList.contains('input');
    }

    static IsOutput(e: MouseEvent): boolean {
        return e.target instanceof Element && e.target.classList.contains('socket') && e.target.classList.contains('output');
    }

    GetElement(): HTMLElement {
        return this.element;
    }

    Destroy() {
        this.DisconnectAll();
        elementToSocket.delete(this.element);
    }
}