import {
    App,
    ButtonComponent,
    Notice,
    PluginSettingTab,
    Setting,
} from "obsidian";
import GospelNotebookPlugin from "../GospelNotebookPlugin";
import {
    AVAILABLE_LANGUAGES,
    LANGUAGE_MAPPING,
    AvailableLanguage,
} from "../utils/lang";
import {
    CalloutCollapseType,
    CalloutStyle,
    LinkType,
} from "src/utils/settings";

// TODO clean up settings and divide into three tabs: Scriptures, References, and General Conference quotes

export class GospelNotebookSettingsTab extends PluginSettingTab {
    constructor(app: App, public plugin: GospelNotebookPlugin) {
        super(app, plugin);
    }

    setupLanguageOption(containerEl: HTMLElement) {
        new Setting(containerEl)
            .setName("Scripture language")
            .setDesc("Preferred scripture language")
            .addDropdown((dropdown) => {
                AVAILABLE_LANGUAGES.forEach((lang) => {
                    dropdown.addOption(lang, LANGUAGE_MAPPING[lang]);
                });

                dropdown
                    .setValue(this.plugin.settings.language)
                    .onChange(async (value: AvailableLanguage) => {
                        this.plugin.settings.language = value;
                        await this.plugin.saveSettings();
                    });
            });
    }

    setCalloutOptions(containerEl: HTMLElement) {
        new Setting(containerEl)
            .setName("Default Callout Collapsability")
            .setDesc(
                "When inserting a scripture, this determines if the callout block will be expanded, collapsed, or non-collapsable by default."
            )
            .addDropdown((dropdown) => {
                dropdown.addOption(CalloutCollapseType.Collapsed, "Collapsed");
                dropdown.addOption(CalloutCollapseType.Expanded, "Expanded");
                dropdown.addOption(
                    CalloutCollapseType.NonCollapsable,
                    "Non-Collapsable"
                );
                dropdown
                    .setValue(this.plugin.settings.calloutCollapseType)
                    .onChange(async (value: CalloutCollapseType) => {
                        this.plugin.settings.calloutCollapseType = value;
                        await this.plugin.saveSettings();
                        new Notice("Default Callout Collapsability Updated");
                    });
            });
        new Setting(containerEl)
            .setName("Callout Style")
            .setDesc(
                "Choose between classic Obisidian or custom callout styles for scriptures."
            )
            .addDropdown((dropdown) => {
                dropdown.addOption(CalloutStyle.classic, "Classic");
                dropdown.addOption(CalloutStyle.stylized, "Stylized");
                dropdown
                    .setValue(this.plugin.settings.calloutStyle)
                    .onChange(async (value: CalloutStyle) => {
                        this.plugin.settings.calloutStyle = value;
                        await this.plugin.saveSettings();
                        new Notice("Callout Style Updated");
                    });
            });
    }

    setVerseTrigger(containerEl: HTMLElement) {
        let initialValue = this.plugin.settings.verseTrigger;
        let textAreaValue: string = initialValue;
        let button: ButtonComponent;
        new Setting(containerEl)
            .setName("Verse Callout Trigger")
            .setDesc(
                'The verse callout trigger is the character or string that preceeds a scripture reference in order for a scripture callout to be suggested to you. For example, if the callout trigger were "+" (the addition symbol), then a scripture callout would be suggested if you typed "+Matthew 5:48", "+1 Nephi 3:7", or "+" followed by any other scripture reference. Be careful to not include any unintentional leading or trailing spaces, as they will be counted as part of the trigger.'
            )
            .addTextArea((textArea) => {
                textArea.setValue(textAreaValue).onChange((value: string) => {
                    textAreaValue = value;
                    button.setDisabled(value === initialValue);
                });
            })
            .addButton((btn) => {
                button = btn;
                button
                    .setDisabled(true)
                    .setButtonText("Save")
                    .onClick(async () => {
                        this.plugin.settings.verseTrigger = textAreaValue;
                        await this.plugin.saveSettings();
                        new Notice("Callout Trigger Updated");
                        initialValue = textAreaValue;
                        button.setDisabled(true);
                    });
            });
    }

    toggleInvisibleLinks(containerEl: HTMLElement) {
        new Setting(containerEl)
            .setName("Insert Invisible Markdown Links")
            .setDesc(
                'If this setting is on, whenever a scripture link or callout is inserted, an invisible link to a Markdown copy of the scripture is also inserted. The Markdown file is assumed to be named according to the chapter of the scripture reference (Ex: "1 Nephi 3:7" would create a link to "1 Nephi 3.md"). This is useful for visualizing your scripture cross-references within Obsidian Graph Views but still allows you to link the scriptures to the official Church website without the need to see two references.'
            )
            .addToggle((textArea) => {
                textArea
                    .setValue(this.plugin.settings.toggleInvisibleLinks)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.toggleInvisibleLinks = value;
                        await this.plugin.saveSettings();
                        new Notice("Invisible Link Settings Updated");
                    });
            });
    }

    setupLinkOption(containerEl: HTMLElement) {
        //Adding additional settings which can automatically create back links so you can see which of your documents
        // and how many reference which chapters in the scriptures.
        new Setting(containerEl)
            .setName("Chapter linking")
            .setDesc(
                "When adding a scripture reference, create a link to an document named <Book> <Chapter>."
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.createChapterLink)
                    .onChange(async (value) => {
                        this.plugin.settings.createChapterLink = value;
                        await this.plugin.saveSettings();
                    })
            );
        new Setting(containerEl)
            .setName("Link type")
            .setDesc(
                "Choose the type of link to create when inserting scriptures or references."
            )
            .addDropdown((dropdown) =>
                dropdown
                    // .addOption('default', 'Default')
                    .addOption(LinkType.wiki, "Wiki Link")
                    .addOption(LinkType.markdown, "Markdown Link")
                    .setValue(this.plugin.settings.linkType)
                    .onChange(async (value: LinkType) => {
                        this.plugin.settings.linkType = value;
                        await this.plugin.saveSettings();
                    })
            );
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h1", { text: "Gospel Notebook Settings" });
        this.setupLanguageOption(containerEl);
        this.setupLinkOption(containerEl);
        this.setCalloutOptions(containerEl);
        this.setVerseTrigger(containerEl);
        this.toggleInvisibleLinks(containerEl);

        containerEl.createEl("h2", { text: "About" });
        containerEl.createSpan({}, (span) => {
            span.innerHTML = `<a href="https://github.com/ammonharps-git/gospel-notebook">Click Here</a> to view the Github documentation for this plugin.`;
        });
    }
}
