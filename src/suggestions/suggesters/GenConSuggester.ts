import {
    EditorSuggest,
    EditorPosition,
    Editor,
    TFile,
    EditorSuggestTriggerInfo,
    EditorSuggestContext,
} from "obsidian";
import GospelNotebookPlugin from "src/GospelNotebookPlugin";
import { GenConSuggestion } from "../suggestions/GenConSuggestion";
import { Suggester } from "./Suggester";

const GEN_CON_CITE_REG =
    /\:MC https:\/\/www\.churchofjesuschrist\.org\/study\/general-conference\/\d{1,4}\/\d{1,2}\/[\w-]+\?lang=\w+/;
const GEN_CON_REG =
    /\:MC https:\/\/www\.churchofjesuschrist\.org\/study\/general-conference\/\d{1,4}\/\d{1,3}\/[\w-]+(\?lang=[a-zA-Z]+&id=[a-zA-Z0-9-]+#[a-zA-Z0-9-]+)?/;

export class GenConSuggester extends Suggester<GenConSuggestion> {
    constructor(public plugin: GospelNotebookPlugin) {
        super(plugin);
    }

    onTrigger(
        cursor: EditorPosition,
        editor: Editor,
        _file: TFile | null
    ): EditorSuggestTriggerInfo | null {
        const currentContent = editor
            .getLine(cursor.line)
            .substring(0, cursor.ch);
        const match = currentContent.match(GEN_CON_REG)?.[0] ?? "";

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
        const fullMatch = query.match(GEN_CON_REG);
        const {
            language,
            linkFormat: linkType,
            createChapterLink,
        } = this.plugin.settings;

        if (fullMatch === null) {
            return [];
        }

        const talk = fullMatch[0].replace(/^\:MC /, "");

        const suggestion = new GenConSuggestion(
            this.plugin.manifest.id,
            talk,
            linkType
        );
        await suggestion.loadTalk();

        return [suggestion];
    }

    renderSuggestion(suggestion: GenConSuggestion, el: HTMLElement): void {
        suggestion.render(el);
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
