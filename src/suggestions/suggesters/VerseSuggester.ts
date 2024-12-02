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

// TODO need to rewrite RegEx to remove the need for ';' at the end
// use one large capture group to capture everything after the chapter colon ':' but RegEx match it using repeating non-capturing groups
// Use the large capture group to parse the verses, but the full regex to make sure pattern matches without the need for ';'
// Could also implement this as a "endTrigger" in settings exactly like the initial trigger so people can have optional setting to use a dynamic closing trigger.

export class VerseSuggester extends Suggester<VerseSuggestion> {
    constructor(public plugin: GospelNotebookPlugin) {
        super(plugin);
    }

    // fetch trigger from settings but delimit it with backslashes to prevent unwantd RegEx behavior
    private getVerseTrigger(): string {
        const trigger: string = this.plugin.settings.verseTrigger
            ? "\\" + this.plugin.settings.verseTrigger.split("").join("\\")
            : "";
        return trigger;
    }

    private getVerseReg(flags: string): RegExp {
        return new RegExp(
            `${this.getVerseTrigger()}([1234]*[A-Za-z ]{3,}) (\\d{1,3}):(.*);`,
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
        if (!match) return null;

        // Check for leading non-whitespace characters (the user has continued typing) and cancel trigger if found
        const foundWhitespace = this.containsNonWhitespace(
            currentContent.substring(
                currentContent.lastIndexOf(match) + match.length
            )
        );
        if (foundWhitespace) return null;

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
        const {
            language,
            linkType,
            linkFormat,
            createChapterLink,
            toggleInvisibleLinks,
            verseStyle,
        } = this.plugin.settings;
        const { query } = context;

        const fullMatch = query.match(this.getVerseReg("i"));

        if (fullMatch === null) return [];

        const book = fullMatch[1];
        const chapter = Number(fullMatch[2]);
        const verses: number[] = this.parseVerses(fullMatch[3]);

        const suggestion = new VerseSuggestion(
            verseStyle,
            book,
            chapter,
            verses,
            language,
            linkType,
            linkFormat,
            createChapterLink,
            toggleInvisibleLinks
        );
        await suggestion.loadVerse();
        return [suggestion];
    }

    private expandRange(range: string): number[] {
        const [s, e] = range.split("-");

        let start = Number(s.trim());
        let end = Number(e.trim());

        const result = [];

        for (let i = start; i <= end; i++) {
            result.push(i);
        }
        return result;
    }

    private parseVerses(input: string): number[] {
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
