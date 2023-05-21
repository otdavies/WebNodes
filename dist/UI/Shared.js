export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
// Enum for input/output sockets
export var SocketType;
(function (SocketType) {
    SocketType[SocketType["INPUT"] = 0] = "INPUT";
    SocketType[SocketType["OUTPUT"] = 1] = "OUTPUT";
})(SocketType || (SocketType = {}));
export const socketColorTable = {
    number: '#007fff',
    string: '#8a2be2',
    boolean: '#ff0080',
    default: '#ff5800'
};
// Global params
export const elementToBlock = new Map();
export const elementToSocket = new Map();
export const elementToEdge = new Map();
export const nodePanel = document.getElementById('nodes');
export const nodeConnections = document.getElementById('connections');
export const workspace = document.getElementById('workspace');
export const contextMenu = document.getElementById('context-menu');
export const optionPanel = document.getElementById('option-panel');
export const cogIcon = document.getElementById('cog-icon');
export const nodeTypes = ['NodeType1', 'NodeType2', 'NodeType3'];
export function ToBlock(element) {
    return elementToBlock.get(element);
}
export function ToSocket(element) {
    if (element.classList.contains('socket-label')) {
        return elementToSocket.get(element.parentElement);
    }
    else {
        return elementToSocket.get(element);
    }
}
