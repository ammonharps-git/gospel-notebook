import {
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    TFile,
} from "obsidian";
import GospelNotebookPlugin from "src/GospelNotebookPlugin";
import { VerseSuggestion } from "../suggestions/VerseSuggestion";
import { Suggester } from "./Suggester";

export class VerseSuggester extends Suggester<VerseSuggestion> {
    constructor(public plugin: GospelNotebookPlugin) {
        super(plugin);
    }

    // fetch trigger to look for from settings but delimit it with backslashes to prevent unwantd RegEx behavior
    getTrigger() {
        const trigger: string = this.plugin.settings.calloutTrigger
            ? "\\" + this.plugin.settings.calloutTrigger.split("").join("\\")
            : "";
        return trigger;
    }

    getVerseReg(flags: string) {
        return new RegExp(`${this.getTrigger()}.*;`, flags);
    }

    getFullVerseReg(flags: string) {
        return new RegExp(
            `${this.getTrigger()}([1234]*[A-Za-z ]{3,}) (\\d{1,3}):(.*);`,
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
        const match = currentContent.match(this.getVerseReg("i"))?.[0] ?? "";

        if (!match) {
            console.debug(
                '"' +
                    currentContent +
                    '" didn\'t match "' +
                    this.getVerseReg("i") +
                    '"'
            );
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
    ): Promise<VerseSuggestion[]> {
        const { language, linkType, createChapterLink } = this.plugin.settings;
        const { query } = context;

        const fullMatch = query.match(this.getFullVerseReg("i"));

        if (fullMatch === null) return [];

        const book = fullMatch[1];
        const chapter = Number(fullMatch[2]);
        const verses: number[] = this.parseVerses(fullMatch[3]);

        const suggestion = new VerseSuggestion(
            this.plugin.manifest.id,
            book,
            chapter,
            verses,
            language,
            linkType,
            createChapterLink
        );
        await suggestion.loadVerse();
        return [suggestion];
    }

    expandRange(range: string): number[] {
        const [s, e] = range.split("-");

        let start = Number(s.trim());
        let end = Number(e.trim());

        const result = [];

        for (let i = start; i <= end; i++) {
            result.push(i);
        }
        return result;
    }

    parseVerses(input: string): number[] {
        const items = input.split(",");
        let result: number[] = [];

        for (const item of items) {
            if (item.includes("-")) {
                result = result.concat(this.expandRange(item));
            } else {
                result.push(Number(item));
            }
        }
        const uniqueArray = Array.from(new Set(result));
        return uniqueArray;
    }
}
