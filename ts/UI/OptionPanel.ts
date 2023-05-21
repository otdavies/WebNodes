export class OptionPanel {
    private panel: HTMLElement;
    private input: HTMLInputElement;
    private button: HTMLButtonElement;
    private icon: HTMLElement;

    constructor(icon: HTMLElement, panel: HTMLElement) {
        this.icon = icon;
        this.panel = panel;
        this.input = this.panel.querySelector('input') as HTMLInputElement;
        this.button = this.panel.querySelector('button') as HTMLButtonElement;

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
            } else {
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

    GetApiKey(): string | null {
        return sessionStorage.getItem('openai-api-key');
    }
}