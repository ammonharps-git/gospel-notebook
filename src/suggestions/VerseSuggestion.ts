import {
    CalloutCollapseType,
    CalloutStyle,
    LinkFormat as LinkFormat,
    LinkType,
} from "src/utils/settings";
import { AvailableLanguage } from "../utils/lang";
import {
    BookData,
    ScriptureData,
    CreateScriptureInfo as ScriptureCreationInfo,
    Verse,
} from "../utils/types";
import { book_data } from "src/data_access/config";
import { Suggestion } from "./Suggestion";
import { VerseDAO } from "src/data_access/VerseDAO";
import { link } from "fs";

// TODO refactor into static create method. Clean up the class, remove public variables.
export class VerseSuggestion extends Suggestion {
    constructor(preview: string, content: string) {
        super(preview, content);
    }

    // Static Methods

    private static convertToVerses(
        chapterData: ScriptureData[],
        verseNums: number[],
        volume: string,
        fullBookName: string,
        shortenedBookName: string,
        chapterNum: number
    ): Verse[] {
        let verses: Verse[] = [];

        for (const index in verseNums) {
            let verse_text = chapterData[0].verses.get(`p${verseNums[index]}`);
            // Attributes assumed to be in Verse class
            let verse: Verse = {
                volume_title: "",
                volume_title_short: volume,
                book_title: fullBookName,
                book_title_short: shortenedBookName,
                chapter_number: chapterNum,
                verse_number: verseNums[index],
                verse_title: "", // Set as needed
                scripture_text: verse_text
                    ? verse_text.trim().replace(/^\d{1,3}\s*/, "")
                    : "", // Handle possible undefined value
            };
            verses.push(verse);
        }
        return verses;
    }

    private static getShortenedName(bookdata: BookData, bookTitle: string) {
        for (const key in bookdata) {
            if (bookdata[key].names.includes(bookTitle)) {
                let volume = bookdata[key].volume;
                return [key, volume];
            }
        }
        return [];
    }

    private static toPreviewText(verses: Verse[]): string {
        return verses
            .map(
                ({ verse_number, scripture_text }) =>
                    `${verse_number}. ${scripture_text}`
            )
            .join("\n");
    }

    private static toText(verses: Verse[]): string {
        const referenceText: String[] = [];
        let lastVerseNum = 0;
        for (let i = 0; i < verses.length; i++) {
            let verseText = "";
            const verseNum = verses[i].verse_number;
            const scriptureText = verses[i].scripture_text;
            if (i == 0) {
                verseText += `<ol start="${verseNum}">`;
            } else if (lastVerseNum + 1 != verseNum) {
                verseText += `</ol><ol start="${verseNum}">`;
            }
            lastVerseNum = verseNum;
            verseText += `<li>${scriptureText}</li>`;
            if (i == verses.length - 1) {
                verseText += "</ol>";
            }
            referenceText.push(verseText);
        }
        return "> " + referenceText.join("");
    }

    private static formatNumberList(numbers: number[]): string {
        if (numbers.length === 0) return "";

        // Ensure the numbers are sorted
        numbers.sort((a, b) => a - b);

        const result: string[] = [];
        let rangeStart = numbers[0];
        let rangeEnd = numbers[0];

        for (let i = 1; i < numbers.length; i++) {
            if (numbers[i] === rangeEnd + 1) {
                // Continue the range
                rangeEnd = numbers[i];
            } else {
                // End the current range and start a new one
                if (rangeStart === rangeEnd) {
                    result.push(rangeStart.toString());
                } else {
                    result.push(`${rangeStart}-${rangeEnd}`);
                }
                rangeStart = numbers[i];
                rangeEnd = numbers[i];
            }
        }

        // Add the last range
        if (rangeStart === rangeEnd) {
            result.push(rangeStart.toString());
        } else {
            result.push(`${rangeStart}-${rangeEnd}`);
        }

        return result.join(", ");
    }

    private static getUrl(
        volume: string,
        book: string,
        chapterNum: string | number,
        language: string,
        verseNums: number[]
    ): string {
        return `https://www.churchofjesuschrist.org/study/scriptures/${volume}/${book}/${chapterNum}?lang=${language}&id=p${verseNums.join(
            ","
        )}#p${Math.min(...verseNums)}`;
    }

    static async create(scriptureInfo: ScriptureCreationInfo) {
        // Destructure
        const {
            book,
            chapterNum,
            language,
            verseNums,
            linkType,
            toggleInvisibleLinks,
            linkFormat,
            verseStyle,
            verseCollapseType,
        } = scriptureInfo;

        // Get shortened name
        const [book_title_short, volume_title_short] = this.getShortenedName(
            book_data,
            book
        );

        // Get URL
        const url = this.getUrl(
            volume_title_short,
            book_title_short,
            chapterNum,
            language,
            verseNums
        );

        // Fetch scripture data
        const dao = new VerseDAO();
        let scriptdata: ScriptureData = await dao.fetchScripture(url, "GET");

        const book_title_in_language = scriptdata.in_language_book;
        const chapter_data = [];
        chapter_data.push(scriptdata);

        const verses: Verse[] = this.convertToVerses(
            chapter_data,
            verseNums,
            volume_title_short,
            book,
            book_title_short,
            chapterNum
        );
        const paragraphs = this.toText(verses);
        const preview = this.toPreviewText(verses);
        const range = this.formatNumberList(verseNums);

        let header: string;
        if (linkType == LinkType.ChurchWebsite) {
            const invisibleLink = toggleInvisibleLinks
                ? `[[${book_title_in_language}|]]`
                : "";

            header = `[${book_title_in_language}:${range}](${url}) ${invisibleLink}`;
        } else if (linkType == LinkType.InternalMarkdown) {
            header = `[[${book_title_in_language}|${book_title_in_language}:${range}]]`;
        } else {
            throw new Error("Invalid LinkType: " + linkType);
        }
        const content = `> [!${verseStyle}]${verseCollapseType} ${header}\n${paragraphs}\n`;

        return new VerseSuggestion(preview, content);
    }
}
