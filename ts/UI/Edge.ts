import { nodeConnections, elementToEdge, uuidv4 } from "./Shared.js";
import { Socket } from "./Socket.js";

export class Edge {
    startSocket: Socket;
    endSocket: Socket;
    uuid: string;
    element: SVGPathElement;

    constructor(path: SVGPathElement, startSocket: Socket, endSocket: Socket) {
        this.startSocket = startSocket;
        this.endSocket = endSocket;
        this.uuid = uuidv4();

        let linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        linearGradient.setAttribute('id', 'grad' + this.uuid);
        linearGradient.setAttribute('gradientTransform', 'rotate(0)');

        let startStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        startStop.setAttribute('offset', '5%');
        startStop.setAttribute('stop-color', this.startSocket.color);

        let endStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        endStop.setAttribute('offset', '95%');
        endStop.setAttribute('stop-color', this.endSocket.color);

        linearGradient.appendChild(startStop);
        linearGradient.appendChild(endStop);

        nodeConnections.appendChild(linearGradient);
        path.setAttribute('stroke', 'url(#grad' + this.uuid + ')')
        path.setAttribute('fill', 'none');
        this.element = path;

        elementToEdge.set(this.element, this);
    }

    static IsEdge(e: MouseEvent): boolean {
        return e.target instanceof Element && e.target.classList.contains('edge');
    }

    // Destructor
    Destroy() {
        nodeConnections.removeChild(this.element);
        nodeConnections.removeChild(document.getElementById('grad' + this.uuid) as Node);
        elementToEdge.delete(this.element);
    }
}