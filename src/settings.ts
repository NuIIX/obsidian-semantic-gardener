import { App, PluginSettingTab, Setting } from 'obsidian';
import type SemanticGardenerPlugin from './main';

export class SemanticGardenerSettingTab extends PluginSettingTab {
  plugin: SemanticGardenerPlugin;

  constructor(app: App, plugin: SemanticGardenerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Semantic Gardener — Настройки' });

    // 1. Gemini API Key (BYOK)
    new Setting(containerEl)
      .setName('Google AI Studio API Key (BYOK)')
      .setDesc('Ваш персональный API-ключ Gemini для работы Gatekeeper и микрохирургического рефакторинга.')
      .addText(text => {
        text
          .setPlaceholder('AIzaSy...')
          .setValue(this.plugin.settings.geminiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.geminiApiKey = value.trim();
            this.plugin.geminiClient.setApiKey(value.trim());
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'password';
      });

    // 2. Gemini Model Selection
    new Setting(containerEl)
      .setName('Модель Gemini')
      .setDesc('Модель для анализа кластеров и генерации микрохирургических замен.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('gemini-3.5-flash', 'Gemini 3.5 Flash (Рекомендуется)')
          .addOption('gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite')
          .addOption('gemini-3.1-flash-lite', 'Gemini 3.1 Flash-Lite')
          .addOption('gemini-3.8-flash', 'Gemini 3.8 Flash')
          .addOption('gemini-3.7-flash', 'Gemini 3.7 Flash')
          .addOption('gemini-3.6-flash', 'Gemini 3.6 Flash')
          .addOption('gemini-2.5-flash', 'Gemini 2.5 Flash')
          .setValue(this.plugin.settings.geminiModel)
          .onChange(async (value) => {
            this.plugin.settings.geminiModel = value;
            this.plugin.geminiClient.setModel(value);
            await this.plugin.saveSettings();
          });
      });

    // 3. Similarity Threshold Slider
    new Setting(containerEl)
      .setName('Порог семантического сходства')
      .setDesc(`Минимальное косинусное сходство векторов для объединения в кластер (Текущее: ${this.plugin.settings.similarityThreshold}). Рекомендуется: 0.80 - 0.85.`)
      .addSlider(slider => {
        slider
          .setLimits(0.70, 0.95, 0.01)
          .setValue(this.plugin.settings.similarityThreshold)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.similarityThreshold = value;
            await this.plugin.saveSettings();
          });
      });

    // 4. Concepts Folder
    new Setting(containerEl)
      .setName('Папка для атомарных заметок')
      .setDesc('Директория в хранилище, в которую будут сохраняться создаваемые канонические заметки.')
      .addText(text => {
        text
          .setPlaceholder('Concepts')
          .setValue(this.plugin.settings.conceptsFolder)
          .onChange(async (value) => {
            this.plugin.settings.conceptsFolder = value.trim() || 'Concepts';
            await this.plugin.saveSettings();
          });
      });

    // 5. Minimum Chunk Length
    new Setting(containerEl)
      .setName('Минимальная длина фрагмента')
      .setDesc('Минимальное количество символов в абзаце для включения в векторный анализ (фильтр коротких фраз).')
      .addText(text => {
        text
          .setPlaceholder('40')
          .setValue(String(this.plugin.settings.minChunkLength))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.minChunkLength = num;
              await this.plugin.saveSettings();
            }
          });
      });

    // 6. Excluded Folders
    new Setting(containerEl)
      .setName('Исключенные папки')
      .setDesc('Папки, разделенные запятыми, которые не будут сканироваться на дубликаты.')
      .addTextArea(text => {
        text
          .setPlaceholder('.obsidian, .trash, templates, archive')
          .setValue(this.plugin.settings.excludedFolders)
          .onChange(async (value) => {
            this.plugin.settings.excludedFolders = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.rows = 2;
        text.inputEl.cols = 30;
      });

    // 7. Max History Length
    new Setting(containerEl)
      .setName('Лимит истории отката')
      .setDesc('Максимальное количество транзакций в журнале отката.')
      .addText(text => {
        text
          .setPlaceholder('20')
          .setValue(String(this.plugin.settings.maxHistoryLength))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.maxHistoryLength = num;
              this.plugin.transactionManager.setMaxHistoryLength(num);
              await this.plugin.saveSettings();
            }
          });
      });

    // 8. Maintenance Actions: Clear Vector Cache
    new Setting(containerEl)
      .setName('Очистить векторный кэш')
      .setDesc('Удалить сохраненные векторы и индекс из IndexedDB для полной переиндексации.')
      .addButton(button => {
        button
          .setButtonText('Очистить кэш')
          .setWarning()
          .onClick(async () => {
            await this.plugin.vectorStorage.clearAll();
            button.setButtonText('Кэш очищен ✓');
            setTimeout(() => button.setButtonText('Очистить кэш'), 2000);
          });
      });
  }
}
