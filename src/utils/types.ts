import {
    CalloutCollapseType,
    CalloutStyle,
    LinkFormat,
    LinkType,
    SupportedOnlineResource,
} from "./settings";

export interface Verse {
    volume_title: string;
    volume_title_short: string;
    book_title: string;
    book_title_short: string;
    chapter_number: number;
    verse_number: number;
    verse_title: string;
    scripture_text: string;
}

export interface CreateScriptureInfo {
    book: string;
    chapterNum: number;
    verseNums: number[];
    language: string;
    verseStyle: CalloutStyle;
    linkType: LinkType;
    linkFormat: LinkFormat;
    verseCollapseType: CalloutCollapseType;
    toggleInvisibleLinks: boolean;
}

export interface Chapter {
    volume_title: string;
    volume_title_short: string;
    book_title: string;
    book_title_short: string;
    chapter_number: number;
    verses: Verse[];
}

export interface Book {
    volume_title: string;
    volume_title_short: string;
    book_title: string;
    book_title_short: string;
    chapters: Chapter[];
}

export interface OnlineResourceData {
    title: string;
    author: string;
    authorRole: string | null;
    paragraphs: string[];
    year: string | undefined;
    month: string | undefined;
    resourceType: SupportedOnlineResource;
}

export interface ScriptureData {
    book: string;
    chapter: number;
    verses: Map<string, string>;
    in_language_book: string;
}

export interface BookInfo {
    volume: string;
    n_ch: number;
    names: string[];
}

export interface BookData {
    [key: string]: BookInfo;
}
