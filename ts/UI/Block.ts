import { InspectorPanel } from "./InspectorPanel.js";
import { elementToBlock, uuidv4 } from "./Shared.js";
import { Socket } from "./Socket.js";

interface BlockProperty {
    type: "input" | "textarea" | "button" | "slider";
    value: any;
    setValue?: (val: any) => void;
}

export class Block {
    public element: HTMLElement;
    public inputs: Socket[];
    public outputs: Socket[];
    // The position of the block in the workspace
    public position = [0, 0];
    // The scale of the block
    public scale = 1;

    private promise: (inputValues: any[][]) => Promise<any[]>;
    private uuid: string;
    private size: number[];
    private inspector: InspectorPanel;

    private cachedValue: any[] = [];
    private isDirty: boolean = true;

    private properties: { [key: string]: BlockProperty; } = {
        "Name": { type: "input", value: "default" },
        "Prompt": { type: "textarea", value: "Some prompt" },
        "Generate": { type: "button", value: "Click me" },
        "Creativity": { type: "slider", value: 50 },
        "Code": { type: "textarea", value: "return 5;" },

        // add as many properties as you like...
    };

    public SetProperties(properties: { [key: string]: BlockProperty; }) {
        this.properties = properties;

        for (const prop in this.properties) {
            this.properties[prop].setValue = (val: any) => {
                if (val === null) return;

                this.properties[prop].value = val;
                this.OnPropertyChanged(prop);
            }
        }
        // Let all props know they changed
        for (const prop in this.properties) {
            this.OnPropertyChanged(prop);
        }
        // Refresh the properties
        this.inspector.refreshProperties();
    }

    public DeepCopyProperties(): { [key: string]: BlockProperty; } {
        let copy: { [key: string]: BlockProperty; } = {};
        for (const prop in this.properties) {
            const propValue = this.properties[prop];
            const propCopy: BlockProperty = {
                type: propValue.type,
                value: JSON.parse(JSON.stringify(propValue.value))
            };
            copy[prop] = propCopy;
        }
        return copy;
    }

    constructor(inspector: InspectorPanel | null) {
        if (inspector === null) throw new Error("Inspector cannot be null!");

        this.inspector = inspector;
        this.uuid = uuidv4();
        // Execute the code on the input
        this.promise = (input): Promise<any[]> => {
            // Execute the Copy property
            const code = this.properties["Code"].value;
            // Function(..) the code and return the result
            let output: any[] = Function("input", code)(input);
            // If the output is not an array, wrap it in one
            if (!Array.isArray(output)) output = [output];
            return Promise.resolve(output);
        };

        this.inputs = [];
        this.outputs = [];
        this.size = [100, 100];
        this.element = this.CreateBlockHTML(0, 0);
        elementToBlock.set(this.element, this);

        for (const prop in this.properties) {
            this.properties[prop].setValue = (val: any) => {
                if (val === null) return;

                this.properties[prop].value = val;
                this.OnPropertyChanged(prop);
            }
        }
    }

    // Call this method whenever an input or property changes
    SetDirty() {
        this.isDirty = true;
        // Also mark downstream nodes as dirty
        for (let output of this.outputs) {
            for (let edge of output.edges) {
                edge.endSocket.owner.SetDirty();
            }
        }
    }

    OnPropertyChanged(propertyName: string) {
        console.log(`Property ${propertyName} changed! New value: ${this.properties[propertyName].value}`);
        // If the 'Name' property changes, update the title of the block
        if (propertyName === 'Name') {
            this.AddOrSetTitle(this.properties[propertyName].value);
        }

        this.SetDirty();
    }

    OnSelected() {
        this.element.classList.add('selected');
        this.inspector.selectNode(this);
    }

    OnDeselected() {
        this.inspector.deselectNode();
        this.element.classList.remove('selected');
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

    AddOrSetTitle(title: string) {
        if (this.element.querySelector('.title')) {
            // set text
            this.element.querySelector('.title')!.textContent = title;
            return;
        }

        let titleElement = document.createElement('div');
        titleElement.className = 'title';
        titleElement.textContent = title;
        this.element.appendChild(titleElement);
    }

    async Evaluate(outputPort: number = 0): Promise<any[]> {
        // Evaluate upstream nodes first
        let promises: Promise<any[]>[] = [];
        for (let input of this.inputs) {
            for (let edge of input.edges) {
                promises.push(edge.startSocket.owner.Evaluate(edge.startSocket.socketNumber));
            }
        }

        let inputValues = await Promise.all(promises);

        if (!this.isDirty && this.cachedValue !== null) {
            // If the node is not dirty and has a cached value, return the cached value
            return this.cachedValue[outputPort];
        }

        // Execute the promise of the current node
        this.element.classList.add('node-executing');
        this.cachedValue = await this.promise(inputValues);
        this.element.classList.remove('node-executing');

        // Mark the node as not dirty
        this.isDirty = false;
        if (this.cachedValue !== null && this.cachedValue !== undefined && this.cachedValue.length > outputPort) {
            console.log(`Output: ${this.cachedValue[outputPort]}`);
            return this.cachedValue[outputPort];
        }

        return [];
    }

    CreateBlockHTML(x: number, y: number): HTMLElement {
        let newBlock = document.createElement('div');

        newBlock.className = 'node';
        newBlock.style.width = this.size[0] + 'px';
        newBlock.style.height = this.size[1] + 'px';
        newBlock.style.left = x + 'px';
        newBlock.style.top = y + 'px';
        // Set position
        this.position = [x, y];
        newBlock.id = this.uuid;

        this.element = newBlock;
        return newBlock;
    }

    GetElement(x: number, y: number): HTMLElement {
        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';
        this.element.style.width = this.size[0] + 'px';
        this.element.style.height = this.size[1] + 'px';
        this.position = [x, y];

        return this.element;
    }

    GetProperties(): { [key: string]: BlockProperty; } {
        return this.properties;
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