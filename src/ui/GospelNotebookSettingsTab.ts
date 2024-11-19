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
import { CalloutCollapseType, LinkType } from "src/utils/settings";

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

    setCalloutCollapseOption(containerEl: HTMLElement) {
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
    }

    setCalloutTrigger(containerEl: HTMLElement) {
        let initialValue = this.plugin.settings.calloutTrigger;
        let textAreaValue: string = initialValue;
        let button: ButtonComponent;
        new Setting(containerEl)
            .setName("Callout Trigger")
            .setDesc(
                'The callout trigger is the character or string that preceeds a scripture reference in order for a scripture callout to be suggested to you. For example, if the callout trigger were "+" (the addition symbol), then a scripture callout would be suggested if you typed "+Matthew 5:48", "+1 Nephi 3:7", or "+" followed by any other scripture reference. Be careful to not include any unintentional leading or trailing spaces, as they will be counted as part of the trigger.'
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
                        this.plugin.settings.calloutTrigger = textAreaValue;
                        await this.plugin.saveSettings();
                        new Notice("Callout Trigger Updated");
                        initialValue = textAreaValue;
                        button.setDisabled(true);
                    });
            });
    }

    toggleInvisibleLinks(containerEl: HTMLElement) {
        new Setting(containerEl)
            .setName("Insert Invisible Links")
            .setDesc(
                "If this setting is on, whenever a scripture link or callout is inserted, an invisible link to a Markdown copy of the scripture is also inserted. The Markdown file is assumed to have the same name as the scripture reference. This is useful for visualizing your scripture cross-references within Obsidian Graph Views."
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
            .setDesc("Choose the type of link to create.")
            .addDropdown((dropdown) =>
                dropdown
                    // .addOption('default', 'Default')
                    .addOption("wiki", "Wiki Link")
                    .addOption("markdown", "Markdown Link")
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

        containerEl.createEl("h1", { text: "Study Journal Settings" });
        this.setupLanguageOption(containerEl);
        this.setupLinkOption(containerEl);
        this.setCalloutCollapseOption(containerEl);
        this.setCalloutTrigger(containerEl);
        this.toggleInvisibleLinks(containerEl);

        containerEl.createEl("h2", { text: "About" });
        containerEl.createSpan({}, (span) => {
            span.innerHTML = `<a href="https://github.com/ammonharps-git/scripture-study-journal">Click Here</a> to view the Github documentation for this plugin.`;
        });
    }
}
