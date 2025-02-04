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
    Classic = "scripture",
    Stylized = "stylized",
}

export interface GospelNotebookSettings {
    language: AvailableLanguage;
    linkFormat: LinkFormat;
    linkType: LinkType;
    bidirectionalLinks: boolean;
    verseCollapseType: CalloutCollapseType;
    quoteCollapseType: CalloutCollapseType;
    verseTrigger: string;
    quoteTrigger: string;
    toggleInvisibleLinks: boolean;
    verseReferenceToggle: boolean;
    verseStyle: CalloutStyle;
    quoteStyle: CalloutStyle;
}

export const DEFAULT_SETTINGS: GospelNotebookSettings = {
    language: "eng",
    linkFormat: LinkFormat.Markdown,
    linkType: LinkType.ChurchWebsite,
    bidirectionalLinks: false,
    verseCollapseType: CalloutCollapseType.Expanded,
    quoteCollapseType: CalloutCollapseType.Expanded,
    verseTrigger: "+",
    quoteTrigger: "+",
    toggleInvisibleLinks: true,
    verseReferenceToggle: true,
    verseStyle: CalloutStyle.Classic,
    quoteStyle: CalloutStyle.Classic,
};
