import { AvailableLanguage } from "./lang";

export enum CalloutCollapseType {
    Expanded = "+",
    Collapsed = "-",
    NonCollapsable = "",
}

export enum LinkFormat {
    Wiki = "wiki",
    Markdown = "markdown",
}

export enum LinkType {
    ChurchWebsite = "Church Website",
    InternalMarkdown = "Internal Markdown",
}

export enum CalloutStyle {
    Classic = "Mormon",
    Stylized = "Stylized",
}

export interface GospelNotebookSettings {
    language: AvailableLanguage;
    linkFormat: LinkFormat; // I want to add program default as an option, but not sure how to yet.
    linkType: LinkType;
    bidirectionalLinks: boolean;
    verseCollapseType: CalloutCollapseType;
    verseTrigger: string;
    quoteTrigger: string;
    toggleInvisibleLinks: boolean;
    verseReferenceToggle: boolean;
    verseStyle: CalloutStyle;
}

export const DEFAULT_SETTINGS: GospelNotebookSettings = {
    language: "eng",
    linkFormat: LinkFormat.Markdown,
    linkType: LinkType.ChurchWebsite,
    bidirectionalLinks: false,
    verseCollapseType: CalloutCollapseType.Expanded,
    verseTrigger: "+",
    quoteTrigger: "+",
    toggleInvisibleLinks: true,
    verseReferenceToggle: true,
    verseStyle: CalloutStyle.Classic,
};
