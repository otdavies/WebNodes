export class InspectorPanel {
    constructor() {
        this.selectedNode = null;
        this.inspectorElement = document.getElementById("inspector");
        this.propertyContainer = document.getElementById("inspector-properties");
    }
    selectNode(node) {
        this.selectedNode = node;
        this.refreshProperties();
        this.inspectorElement.classList.remove("inspector-closed");
        this.inspectorElement.classList.add("inspector-open");
    }
    deselectNode() {
        this.selectedNode = null;
        this.inspectorElement.classList.remove("inspector-open");
        this.inspectorElement.classList.add("inspector-closed");
    }
    refreshProperties() {
        this.propertyContainer.innerHTML = '';
        if (this.selectedNode) {
            for (const [key, prop] of Object.entries(this.selectedNode.GetProperties())) {
                const propDiv = document.createElement('div');
                propDiv.textContent = key;
                switch (prop.type) {
                    case 'slider':
                        const slider = document.createElement('input');
                        slider.type = 'range';
                        slider.value = prop.value;
                        slider.oninput = (e) => {
                            if (prop.setValue !== undefined) {
                                prop.setValue(e.target.value);
                            }
                        };
                        propDiv.appendChild(slider);
                        break;
                    case 'input':
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.value = prop.value;
                        input.oninput = (e) => {
                            if (prop.setValue !== undefined) {
                                prop.setValue(e.target.value);
                            }
                        };
                        propDiv.appendChild(input);
                        break;
                    case 'textarea':
                        const textarea = document.createElement('textarea');
                        textarea.textContent = prop.value;
                        textarea.oninput = (e) => {
                            if (prop.setValue !== undefined) {
                                prop.setValue(e.target.value);
                            }
                        };
                        propDiv.appendChild(textarea);
                        break;
                    case 'button':
                        const button = document.createElement('button');
                        button.textContent = prop.value;
                        button.onclick = (e) => { console.log(`Button '${key}' clicked`); };
                        propDiv.appendChild(button);
                        break;
                }
                this.propertyContainer.appendChild(propDiv);
            }
        }
    }
}
