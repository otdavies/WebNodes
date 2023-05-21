// --- IMPORTS ---
import { InspectorPanel } from './UI/InspectorPanel.js';
import { NodePanel } from './UI/NodePanel.js';
import { OptionPanel } from './UI/OptionPanel.js';
import { cogIcon, nodePanel, optionPanel } from './UI/Shared.js';


// Initialize the app
let inspector: InspectorPanel = new InspectorPanel();
let nodeGraph: NodePanel = new NodePanel(nodePanel, inspector);
let options: OptionPanel = new OptionPanel(cogIcon, optionPanel);