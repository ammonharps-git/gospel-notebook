export abstract class Suggestion {
    private _content: string;
    private _preview: string;

    constructor() {}

    public get preview() {
        return this._preview;
    }

    protected set preview(newText: string) {
        this._preview = newText;
    }

    public get content() {
        return this._content;
    }

    protected set content(newText: string) {
        this._content = newText;
    }

    public render(el: HTMLElement, preview: string): void {
        const outer = el.createDiv({ cls: "obr-suggester-container" });
        outer.createDiv({ cls: "obr-shortcode" }).setText(preview);
    }

    abstract getReplacement(): string;
}
