export abstract class Suggestion {
    private _preview: string;

    constructor() {}

    public get preview() {
        return this._preview;
    }

    protected set preview(newText: string) {
        this._preview = newText;
    }

    public render(el: HTMLElement, preview: string): void {
        const outer = el.createDiv({ cls: "obr-suggester-container" });
        outer.createDiv({ cls: "obr-shortcode" }).setText(preview);
    }

    abstract getFinalSuggestion(): string;
}
