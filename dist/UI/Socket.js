import { SocketType, elementToSocket, socketColorTable } from "./Shared.js";
export class Socket {
    constructor(owner, name, dataType, socketType) {
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
    Connect(edge) {
        var _a;
        this.edges.push(edge);
        this.connected = true;
        (_a = this.element.querySelector('.socket-label')) === null || _a === void 0 ? void 0 : _a.classList.add('connected');
        this.owner.SetDirty();
    }
    Disconnect(edge) {
        var _a;
        this.edges.splice(this.edges.indexOf(edge), 1);
        this.connected = this.edges.length > 0;
        (_a = this.element.querySelector('.socket-label')) === null || _a === void 0 ? void 0 : _a.classList.remove('connected');
        this.owner.SetDirty();
    }
    DisconnectAll() {
        var _a;
        for (let edge of this.edges) {
            if (edge.startSocket === this) {
                edge.endSocket.Disconnect(edge);
            }
            else {
                edge.startSocket.Disconnect(edge);
            }
            edge.Destroy();
        }
        this.edges = [];
        this.connected = false;
        (_a = this.element.querySelector('.socket-label')) === null || _a === void 0 ? void 0 : _a.classList.remove('connected');
        this.owner.SetDirty();
    }
    CreateElement() {
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
        }
        else {
            newSocket.insertBefore(label, newSocket.firstChild);
        }
        return newSocket;
    }
    static IsInput(e) {
        // Is it an input socket
        let isInput = e.target instanceof Element && e.target.classList.contains('socket') && e.target.classList.contains('input');
        // Is it a child of an input socket
        let isChildOfInput = e.target instanceof Element && e.target.parentElement && e.target.parentElement.classList.contains('socket') && e.target.parentElement.classList.contains('input');
        if (isChildOfInput === null) {
            isChildOfInput = false;
        }
        return isInput || isChildOfInput;
    }
    static IsOutput(e) {
        return e.target instanceof Element && e.target.classList.contains('socket') && e.target.classList.contains('output');
    }
    GetElement() {
        return this.element;
    }
    Destroy() {
        this.DisconnectAll();
        elementToSocket.delete(this.element);
    }
}
