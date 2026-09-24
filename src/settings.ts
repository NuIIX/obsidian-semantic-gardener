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

    // 0. LLM Provider Selection
    new Setting(containerEl)
      .setName('Провайдер LLM Gatekeeper')
      .setDesc('Выберите бэкенд для семантической проверки дубликатов и генерации плана рефакторинга.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('gemini', 'Google Gemini (Облачный AI Studio BYOK)')
          .addOption('openai-compatible', 'Локальная LLM (Ollama / LM Studio / LocalAI)')
          .setValue(this.plugin.settings.llmProvider || 'gemini')
          .onChange(async (value) => {
            this.plugin.settings.llmProvider = value as any;
            await this.plugin.saveSettings();
            this.display();
          });
      });

    if (this.plugin.settings.llmProvider === 'openai-compatible') {
      new Setting(containerEl)
        .setName('Настройки локальной LLM')
        .setDesc('Параметры подключения к локальному серверу по протоколу OpenAI Chat Completions.')
        .setHeading();

      new Setting(containerEl)
        .setName('API Endpoint')
        .setDesc('URL локального сервера (например, http://localhost:11434/v1 для Ollama или http://localhost:1234/v1 для LM Studio).')
        .addText(text => {
          text
            .setPlaceholder('http://localhost:11434/v1')
            .setValue(this.plugin.settings.localLlmEndpoint || 'http://localhost:11434/v1')
            .onChange(async (val) => {
              this.plugin.settings.localLlmEndpoint = val.trim();
              await this.plugin.saveSettings();
            });
        });

      new Setting(containerEl)
        .setName('Название модели')
        .setDesc('Имя загруженной модели (например: llama3.2, qwen2.5, mistral, deepseek-r1).')
        .addText(text => {
          text
            .setPlaceholder('llama3.2')
            .setValue(this.plugin.settings.localLlmModel || 'llama3.2')
            .onChange(async (val) => {
              this.plugin.settings.localLlmModel = val.trim();
              await this.plugin.saveSettings();
            });
        });

      new Setting(containerEl)
        .setName('API-ключ (необязательно)')
        .setDesc('Если локальный сервер или прокси требует авторизации (Bearer token). Для Ollama/LM Studio оставьте пустым.')
        .addText(text => {
          text
            .setPlaceholder('любой-токен-или-пусто')
            .setValue(this.plugin.settings.localLlmApiKey || '')
            .onChange(async (val) => {
              this.plugin.settings.localLlmApiKey = val.trim();
              await this.plugin.saveSettings();
            });
          text.inputEl.type = 'password';
        });
    } else {
      // 1. Gemini API Keys (BYOK with Multi-key Rotation on 429)
      if (!this.plugin.settings.geminiApiKeys || !Array.isArray(this.plugin.settings.geminiApiKeys)) {
        this.plugin.settings.geminiApiKeys = this.plugin.settings.geminiApiKey ? [this.plugin.settings.geminiApiKey] : [''];
      }
      if (this.plugin.settings.geminiApiKeys.length === 0) {
        this.plugin.settings.geminiApiKeys = [''];
      }

      const keyList = this.plugin.settings.geminiApiKeys;

      new Setting(containerEl)
        .setName('Ключи Google AI Studio API (BYOK)')
        .setDesc('Укажите один или несколько API-ключей Gemini. При исчерпании суточного лимита (3 ошибки 429 подряд) плагин автоматически переключится на следующий ключ.')
        .setHeading();

    keyList.forEach((key, index) => {
      const setting = new Setting(containerEl)
        .setName(index === 0 ? 'Основной API-ключ' : `Резервный ключ #${index + 1}`)
        .setDesc(index === 0 ? 'Первичный ключ для работы Gatekeeper и рефакторинга.' : `Резервный ключ для автоматической ротации.`);

      let textInputEl: HTMLInputElement | null = null;

      setting.addText(text => {
        textInputEl = text.inputEl;
        text
          .setPlaceholder('AIzaSy...')
          .setValue(key)
          .onChange(async (value) => {
            this.plugin.settings.geminiApiKeys[index] = value.trim();
            this.plugin.settings.geminiApiKey = this.plugin.settings.geminiApiKeys[0] || '';
            this.plugin.geminiClient.setApiKeys(this.plugin.settings.geminiApiKeys);
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'password';
      });

      // '+' button on the last key field to append next key
      if (index === keyList.length - 1) {
        setting.addButton(button => {
          button
            .setButtonText('+')
            .setTooltip('Добавить следующий резервный API-ключ')
            .setCta();

          const canAdd = Boolean(key && key.trim().length > 0);
          button.setDisabled(!canAdd);

          if (textInputEl) {
            textInputEl.addEventListener('input', () => {
              const hasText = (textInputEl?.value || '').trim().length > 0;
              button.setDisabled(!hasText);
            });
          }

          button.onClick(async () => {
            const currentVal = this.plugin.settings.geminiApiKeys[index]?.trim() || '';
            if (currentVal.length === 0) return;
            this.plugin.settings.geminiApiKeys.push('');
            await this.plugin.saveSettings();
            this.display();
          });
        });
      }

      // Delete button when there are 2 or more keys
      if (keyList.length > 1) {
        setting.addButton(button => {
          button
            .setButtonText('🗑')
            .setTooltip(`Удалить ключ #${index + 1}`)
            .setWarning()
            .onClick(async () => {
              this.plugin.settings.geminiApiKeys.splice(index, 1);
              if (this.plugin.settings.geminiApiKeys.length === 0) {
                this.plugin.settings.geminiApiKeys.push('');
              }
              this.plugin.settings.geminiApiKey = this.plugin.settings.geminiApiKeys[0] || '';
              this.plugin.geminiClient.setApiKeys(this.plugin.settings.geminiApiKeys);
              await this.plugin.saveSettings();
              this.display();
            });
        });
      }
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
    }

    // Vault Watcher Toggle
    new Setting(containerEl)
      .setName('Фоновый Vault Watcher')
      .setDesc('Автоматически отслеживать изменения заметок и обновлять векторный кэш в фоне с задержкой (debounced 2.5с).')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.autoWatchVault ?? true)
          .onChange(async (value) => {
            this.plugin.settings.autoWatchVault = value;
            await this.plugin.saveSettings();
            if (value) {
              this.plugin.vaultWatcher?.start();
            } else {
              this.plugin.vaultWatcher?.stop();
            }
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

    // 4. Auto Gatekeeper Batch Limit
    new Setting(containerEl)
      .setName('Лимит первичного анализа AI Gatekeeper')
      .setDesc(`Количество кандидатов с наибольшим сходством, анализируемых автоматически при сканировании (Текущее: ${this.plugin.settings.autoGatekeeperBatchLimit || 30}). Защищает от выгорания суточной квоты API.`)
      .addSlider(slider => {
        slider
          .setLimits(10, 100, 5)
          .setValue(this.plugin.settings.autoGatekeeperBatchLimit || 30)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.autoGatekeeperBatchLimit = value;
            await this.plugin.saveSettings();
          });
      });

    // 5. Concepts Folder
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
