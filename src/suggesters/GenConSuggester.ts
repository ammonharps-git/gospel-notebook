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

export class GenConSuggester extends Suggester<GenConSuggestion> {
    constructor(public plugin: GospelNotebookPlugin) {
        super(plugin);
    }

    // Fetch trigger from settings (and delimit it with backslashes to prevent unwanted RegEx behavior)
    private getQuoteTrigger(): string {
        const trigger: string = this.plugin.settings.quoteTrigger
            ? "\\" + this.plugin.settings.quoteTrigger.split("").join("\\")
            : "";
        return trigger;
    }

    // Returns RegEx expression with optional flags
    private getQuoteReg(flags?: string): RegExp {
        return new RegExp(
            `${this.getQuoteTrigger()}(https:\\/\\/www\\.churchofjesuschrist\\.org\\/study\\/general-conference\\/\\d{1,4}\\/\\d{1,3}\\/[\\w-]+\\S*)`,
            flags
        );
    }

    // Checks to see if suggestion is needed
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

    // Creates and returns new suggestion (called when onTrigger returns a non-null value)
    async getSuggestions(
        context: EditorSuggestContext
    ): Promise<GenConSuggestion[]> {
        const { query } = context;
        const { quoteStyle, quoteCollapseType } = this.plugin.settings;
        const fullMatch = query.match(this.getQuoteReg("i"));

        // Bail out if no match
        if (fullMatch === null) {
            return [];
        }

        // Extract url
        const url = fullMatch[1];

        // Create and return suggestion
        const suggestion = await GenConSuggestion.create(
            url,
            quoteStyle,
            quoteCollapseType
        );
        return [suggestion];
    }
}
