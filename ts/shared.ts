import { Block } from "./block.js";
import { Edge } from "./edge.js";
import { Socket } from "./socket.js";

export function uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// Enum for input/output sockets
export enum SocketType {
    INPUT,
    OUTPUT
}

export const socketColorTable: { [key: string]: string } = {
    number: '#007fff',
    string: '#8a2be2',
    boolean: '#ff0080',
    default: '#ff5800'
};

// Global params
export const elementToBlock = new Map<HTMLElement, Block>();
export const elementToSocket = new Map<HTMLElement, Socket>();
export const elementToEdge = new Map<SVGElement, Edge>();
export const nodes = document.getElementById('nodes') as HTMLElement;
export const connections = document.getElementById('connections') as HTMLElement;

export function ToBlock(element: HTMLElement): Block | undefined {
    return elementToBlock.get(element);
}

export function ToSocket(element: HTMLElement): Socket | undefined {
    return elementToSocket.get(element);
}
