// --- IMPORTS ---
import { InspectorPanel } from './InspectorPanel.js';
import { NodePanel } from './NodePanel.js';
import { OptionPanel } from './OptionPanel.js';
import { cogIcon, nodePanel, optionPanel } from './Shared.js';


// Initialize the app
let inspector: InspectorPanel = new InspectorPanel();
let nodeGraph: NodePanel = new NodePanel(nodePanel, inspector);
let options: OptionPanel = new OptionPanel(cogIcon, optionPanel);