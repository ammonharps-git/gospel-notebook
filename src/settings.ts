import { AvailableLanguage } from "./lang";

export enum CalloutCollapseType {
    Expanded = "+",
    Collapsed = "-",
    NonCollapsable = "",
}

export enum LinkType {
    wiki = "wiki",
    markdown = "markdown",
}

export interface GospelNotebookSettings {
    language: AvailableLanguage;
    linkType: LinkType; // I want to add program default as an option, but not sure how to yet.
    createChapterLink: boolean;
    bidirectionalLinks: boolean;
    calloutCollapseType: CalloutCollapseType;
    calloutTrigger: string;
    toggleInvisibleLinks: boolean;
}

export const DEFAULT_SETTINGS: GospelNotebookSettings = {
    language: "eng",
    linkType: LinkType.wiki,
    createChapterLink: false,
    bidirectionalLinks: false,
    calloutCollapseType: CalloutCollapseType.Expanded,
    calloutTrigger: "+",
    toggleInvisibleLinks: true,
};
