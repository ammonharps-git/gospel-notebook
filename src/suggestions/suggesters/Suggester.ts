import {
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    Plugin,
    TFile,
} from "obsidian";
import { Suggestion } from "../suggestions/Suggestion";
import GospelNotebookPlugin from "src/GospelNotebookPlugin";
import { BOOK_ABBREVIATION_MAPPING } from "src/utils/lang";

export abstract class Suggester<T extends Suggestion> extends EditorSuggest<T> {
    constructor(public plugin: GospelNotebookPlugin) {
        super(plugin.app);
    }

    // decides if suggester will trigger
    abstract onTrigger(
        cursor: EditorPosition,
        editor: Editor,
        _file: TFile | null
    ): EditorSuggestTriggerInfo | null;

    // returns valid suggestions
    abstract getSuggestions(context: EditorSuggestContext): T[] | Promise<T[]>;

    // checks the input string for non-whitespace characters
    protected containsNonWhitespace(content: string) {
        const hasNonWhitespace: number = content.search(/\s*\S+/);
        if (hasNonWhitespace === -1) {
            return false;
        }
        return true;
    }

    // Returns full book name if input is abbreviation, otherwise returns input unchanged
    protected getBookName(abbreviation: string) {
        let bookName: string = abbreviation;
        if (!!BOOK_ABBREVIATION_MAPPING[this.plugin.settings.language]) {
            const possibleName = BOOK_ABBREVIATION_MAPPING[
                this.plugin.settings.language
            ]?.get(abbreviation.toLowerCase());
            if (!!possibleName) {
                bookName = possibleName;
            }
        }
        return bookName;
    }

    // renders the suggestion
    renderSuggestion(suggestion: T, el: HTMLElement): void {
        suggestion.render(el, suggestion.preview);
    }

    // selects the suggestion
    selectSuggestion(suggestion: T, _evt: MouseEvent | KeyboardEvent): void {
        if (!this.context) return;

        this.context.editor.replaceRange(
            suggestion.getReplacement(),
            this.context.start,
            this.context.end
        );
    }
}
