import {
    EditorSuggest,
    EditorPosition,
    Editor,
    TFile,
    EditorSuggestTriggerInfo,
    EditorSuggestContext,
    Notice,
} from "obsidian";
import GospelNotebookPlugin from "src/GospelNotebookPlugin";
import { GenConSuggestion } from "../suggestions/GenConSuggestion";
import { Suggester } from "./Suggester";

const GEN_CON_CITE_REG =
    /\:MC https:\/\/www\.churchofjesuschrist\.org\/study\/general-conference\/\d{1,4}\/\d{1,2}\/[\w-]+\?lang=\w+/;
const GEN_CON_REG =
    /\:MC https:\/\/www\.churchofjesuschrist\.org\/study\/general-conference\/\d{1,4}\/\d{1,3}\/[\w-]+(\?lang=[a-zA-Z]+&id=[a-zA-Z0-9-]+#[a-zA-Z0-9-]+)?/;

// TODO Add capture groups to the regex and extract year and month of talk, then pass those to the suggestion.
// TODO set the talks to output in a different format (in suggestion).

export class GenConSuggester extends Suggester<GenConSuggestion> {
    constructor(public plugin: GospelNotebookPlugin) {
        super(plugin);
    }

    // fetch trigger from settings but delimit it with backslashes to prevent unwantd RegEx behavior
    private getQuoteTrigger(): string {
        const trigger: string = this.plugin.settings.quoteTrigger
            ? "\\" + this.plugin.settings.quoteTrigger.split("").join("\\")
            : "";
        return trigger;
    }

    private getQuoteReg(flags: string): RegExp {
        return new RegExp(
            `${this.getQuoteTrigger()}(https:\\/\\/www\\.churchofjesuschrist\\.org\\/study\\/general-conference\\/\\d{1,4}\\/\\d{1,3}\\/[\\w-]+(\\?lang=[a-zA-Z]+&id=[a-zA-Z0-9-]+#[a-zA-Z0-9-]+)?)`,
            flags
        );
    }

    onTrigger(
        cursor: EditorPosition,
        editor: Editor,
        _file: TFile | null
    ): EditorSuggestTriggerInfo | null {
        const currentContent = editor
            .getLine(cursor.line)
            .substring(0, cursor.ch);
        const match = currentContent.match(this.getQuoteReg("i"))?.[0] ?? "";

        if (!match) {
            return null;
        }

        return {
            start: {
                line: cursor.line,
                ch: currentContent.lastIndexOf(match),
            },
            end: cursor,
            query: match,
        };
    }

    async getSuggestions(
        context: EditorSuggestContext
    ): Promise<GenConSuggestion[]> {
        const { query } = context;
        const fullMatch = query.match(this.getQuoteReg("i"));
        const { linkFormat: linkType, quoteStyle } = this.plugin.settings;

        if (fullMatch === null) {
            return [];
        }

        const url = fullMatch[1];

        const suggestion = new GenConSuggestion(
            this.plugin.manifest.id,
            url,
            linkType,
            quoteStyle
        );
        await suggestion.loadTalk();

        return [suggestion];
    }

    renderSuggestion(suggestion: GenConSuggestion, el: HTMLElement): void {
        suggestion.render(el, suggestion.previewText);
    }

    selectSuggestion(
        suggestion: GenConSuggestion,
        _evt: MouseEvent | KeyboardEvent
    ): void {
        if (!this.context) return;

        this.context.editor.replaceRange(
            suggestion.getReplacement(),
            this.context.start,
            this.context.end
        );
    }
}
