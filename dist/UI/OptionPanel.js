export class OptionPanel {
    constructor(icon, panel) {
        this.icon = icon;
        this.panel = panel;
        this.input = this.panel.querySelector('input');
        this.button = this.panel.querySelector('button');
        console.log(this.input);
        // Hide panel initially
        this.Hide();
        // Add event listeners
        this.AddListeners();
    }
    AddListeners() {
        // Add event listeners
        this.button.addEventListener('mousedown', () => this.SaveApiKey());
        this.icon.addEventListener('mousedown', (e) => {
            console.log('show');
            if (this.panel.style.display === 'none') {
                this.Show();
            }
            else {
                this.Hide();
            }
        });
    }
    Show() {
        this.panel.style.display = 'block';
    }
    Hide() {
        this.panel.style.display = 'none';
    }
    SaveApiKey() {
        console.log('save');
        const apiKey = this.input.value;
        sessionStorage.setItem('openai-api-key', apiKey);
        this.Hide();
    }
    GetApiKey() {
        return sessionStorage.getItem('openai-api-key');
    }
}
