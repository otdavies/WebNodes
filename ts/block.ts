import { elementToBlock, uuidv4 } from "./shared.js";
import { Socket } from "./socket.js";

export class Block {
    uuid: string;
    promise: (inputValues: any[]) => Promise<any>;
    inputs: Socket[];
    outputs: Socket[];
    size: number[];
    element: HTMLElement;

    constructor(promise: (inputValues: any[]) => Promise<any>) {
        this.uuid = uuidv4();
        this.promise = promise;
        this.inputs = [];
        this.outputs = [];
        this.size = [100, 100];
        this.element = this.CreateBlockHTML(0, 0);
        elementToBlock.set(this.element, this);
    }

    AddInputSocket(socket: Socket) {
        this.inputs.push(socket);
        let socketElement = socket.GetElement();

        let nodeHeight = this.size[1];
        let socketHeight = socket.size[1];
        let spacing = (nodeHeight - ((this.inputs.length) * socketHeight)) / (this.inputs.length + 1);

        for (let i = 0; i < this.inputs.length; i++) {
            this.inputs[i].element.style.top = ((i + 1) * (spacing + socketHeight)) + 'px';
        }

        this.element.appendChild(socketElement);
    }

    AddOutputSocket(socket: Socket) {
        this.outputs.push(socket);
        let socketElement = socket.GetElement();

        let nodeHeight = this.size[1];
        let socketHeight = socket.size[1];
        let spacing = (nodeHeight - ((this.outputs.length) * socketHeight)) / (this.outputs.length + 1);

        for (let i = 0; i < this.outputs.length; i++) {
            this.outputs[i].element.style.top = ((i + 1) * (spacing + socketHeight)) + 'px';
        }

        this.element.appendChild(socketElement);
    }

    async Evaluate() {
        const inputPromises = this.inputs.map(input => input.node.promise);
        return Promise.all(inputPromises).then(inputValues => {
            return this.promise(inputValues);
        });
    }

    CreateBlockHTML(x: number, y: number): HTMLElement {
        let newBlock = document.createElement('div');

        newBlock.className = 'node';
        newBlock.style.width = this.size[0] + 'px';
        newBlock.style.height = this.size[1] + 'px';
        newBlock.style.left = x + 'px';
        newBlock.style.top = y + 'px';
        newBlock.id = this.uuid;

        this.element = newBlock;
        return newBlock;
    }

    GetElement(x: number, y: number): HTMLElement {
        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';
        this.element.style.width = this.size[0] + 'px';
        this.element.style.height = this.size[1] + 'px';

        return this.element;
    }

    Destroy() {
        for (let socket of this.inputs) {
            socket.Destroy();
        }

        for (let socket of this.outputs) {
            socket.Destroy();
        }

        elementToBlock.delete(this.element);
    }
}