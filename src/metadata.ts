import { FileSystemAdapter } from "obsidian";
import { AvailableLanguage } from "./settings";

export const PLUGIN_NAME = "lds-scriptures-reference";

export const OBSIDIAN_BASE_PATH = (app.vault.adapter as FileSystemAdapter).getBasePath();

export const PLUGIN_BASE_PATH = `${OBSIDIAN_BASE_PATH}/.obsidian/plugins/${PLUGIN_NAME}`;

export function getScripturesPath(lang: AvailableLanguage): string {
    return `${PLUGIN_BASE_PATH}/scriptures/${lang}`;
}
