// --- IMPORTS ---
import { InspectorPanel } from './InspectorPanel.js';
import { NodePanel } from './NodePanel.js';
import { OptionPanel } from './OptionPanel.js';
import { cogIcon, nodePanel, optionPanel } from './Shared.js';
// Initialize the app
let inspector = new InspectorPanel();
let nodeGraph = new NodePanel(nodePanel, inspector);
let options = new OptionPanel(cogIcon, optionPanel);
