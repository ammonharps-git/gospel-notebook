export abstract class Suggestion {
    private _preview: string;
    private _content: string;

    constructor(preview: string, content: string) {
        this._preview = preview;
        this._content = content;
    }

    public get preview() {
        return this._preview;
    }

    public get content() {
        return this._content;
    }

    protected set preview(newText: string) {
        this._preview = newText;
    }

    protected set content(newText: string) {
        this._content = newText;
    }

    public render(el: HTMLElement, preview: string): void {
        const outer = el.createDiv({ cls: "obr-suggester-container" });
        outer.createDiv({ cls: "obr-shortcode" }).setText(preview);
    }
}
