import type { CandidateCluster, RefactorPlan, RefactorModification } from '../types/index.ts';
import { refactorEngineSchema, type GeminiRefactorResponse } from '../types/llm-schema.ts';

const SYSTEM_INSTRUCTION = `Ты — строгий редактор персональной базы знаний Zettelkasten. Твоя цель — консолидация дублирующихся концепций.

КРИТЕРИЙ ДЕДУПЛИКАЦИИ (Gatekeeper Mode):
Объединяй ТОЛЬКО концепции с одинаковым физическим или абстрактным смыслом.
- ЗАПРЕЩЕНО объединять омонимы и междоменные метафоры (например, "бутылочное горлышко" в архитектуре процессоров и "бутылочное горлышко" в бизнес-процессах склада — это РАЗНЫЕ сущности из разных доменов).
- Обращай пристальное внимание на Breadcrumbs [Путь > Заголовок > ...], в которых находятся фрагменты.
- Если контексты фрагментов принадлежат несовместимым областям знаний или это совпадение лишь по слову, установи "isDuplicate": false и укажи краткую, понятную "rejectionReason" (1-2 предложения).
- ВНИМАНИЕ: Если "isDuplicate": true, поле "rejectionReason" ОБЯЗАТЕЛЬНО должно быть пустой строкой "". КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать в rejectionReason любые объяснения или повторяющиеся строки, если дубликат подтвержден!

ПРАВИЛО МИКРОХИРУРГИИ СТИЛЯ (Surgical Span Replacer Mode):
- Если isDuplicate: true:
  1. Сформулируй емкое "conceptTitle" для новой атомарной заметки (без недопустимых символов: / \\ * ? : " < > |).
  2. Определи "aliases": массив синонимов, аббревиатур, падежных форм или альтернативных названий для этой концепции (например: ["WIP limit", "Лимит незавершенного производства"]).
  3. Напиши "canonicalNoteMarkdown": качественное, самодостаточное определение концепции, ключевые тезисы или формулы в Markdown.
  4. Для КАЖДОГО фрагмента найди МИНИМАЛЬНЫЙ точный сегмент текста ("originalSpan"), который непосредственно выражает дублируемое определение.
     ВНИМАНИЕ: "originalSpan" ДОЛЖЕН СТРОГО, СИМВОЛ В СИМВОЛ, присутствовать в исходном тексте фрагмента!
  5. Составь "suggestedInlineSpan": микрохирургическая замена оригинального сегмента. ЗАПРЕЩЕНО переписывать весь абзац! Сохраняй авторский синтаксис, пунктуацию, сленг и грамматику. Если форма слова в предложении отличается от conceptTitle, используй [[conceptTitle|контекстный алиас]] (например: "в соответствии с [[Лимит WIP|лимитом WIP]]").
  6. Составь "transclusionSpan": альтернативный вариант замены на трансклюзию вида ![[conceptTitle]].
- Если isDuplicate: false:
  Поля conceptTitle, aliases, canonicalNoteMarkdown и modifications должны отсутствовать или быть пустыми.`;

export interface KeyRotationInfo {
  index: number;
  prevIndex: number;
  maskedKey: string;
  totalKeys: number;
  reason: string;
}

export class GeminiClient {
  private apiKeys: string[] = [];
  private currentKeyIndex: number = 0;
  private consecutive429Count: number = 0;
  private model: string;
  private onKeyRotated?: (info: KeyRotationInfo) => void;

  constructor(
    apiKeyOrKeys: string | string[],
    model: string = 'gemini-3.5-flash-lite',
    onKeyRotated?: (info: KeyRotationInfo) => void
  ) {
    this.model = model;
    this.onKeyRotated = onKeyRotated;
    if (Array.isArray(apiKeyOrKeys)) {
      this.setApiKeys(apiKeyOrKeys);
    } else {
      this.setApiKey(apiKeyOrKeys);
    }
  }

  setOnKeyRotated(cb: (info: KeyRotationInfo) => void) {
    this.onKeyRotated = cb;
  }

  setApiKeys(keys: string[]) {
    this.apiKeys = keys.map(k => k.trim()).filter(k => k.length > 0);
    if (this.currentKeyIndex >= this.apiKeys.length) {
      this.currentKeyIndex = 0;
    }
  }

  setApiKey(key: string) {
    this.setApiKeys(key ? [key] : []);
  }

  setModel(model: string) {
    this.model = model;
  }

  getActiveApiKey(): string {
    if (this.apiKeys.length === 0) return '';
    return this.apiKeys[this.currentKeyIndex % this.apiKeys.length];
  }

  getApiKeysCount(): number {
    return this.apiKeys.length;
  }

  getCurrentKeyIndex(): number {
    return this.currentKeyIndex;
  }

  getConsecutive429Count(): number {
    return this.consecutive429Count;
  }

  rotateToNextKey(reason: string = 'Ротация ключа'): boolean {
    if (this.apiKeys.length <= 1) return false;
    const prevIndex = this.currentKeyIndex;
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    this.consecutive429Count = 0;
    const activeKey = this.getActiveApiKey();
    const masked = this.maskKey(activeKey);
    console.warn(`[GeminiClient] ${reason}. Переключение с ключа #${prevIndex + 1} на #${this.currentKeyIndex + 1} (${masked})`);
    this.onKeyRotated?.({
      index: this.currentKeyIndex,
      prevIndex,
      maskedKey: masked,
      totalKeys: this.apiKeys.length,
      reason
    });
    return true;
  }

  private maskKey(key: string): string {
    if (!key || key.length <= 8) return '****';
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  }

  /**
   * Sends a request to Gemini API with automatic rate-limit cooldown, retry, and multi-key rotation on 429.
   */
  private async postToGemini(requestBody: any): Promise<string> {
    const totalSlots = Math.max(1, this.apiKeys.length);
    const maxAttempts = Math.max(3, totalSlots * 3);
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const activeKey = this.getActiveApiKey();
      if (!activeKey) {
        throw new Error('API ключ Gemini не настроен. Укажите ваш Google AI Studio API-ключ в настройках плагина.');
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${activeKey}`;
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
      } catch (netErr: any) {
        lastError = new Error(`Сетевая ошибка при запросе к Gemini API: ${netErr.message}`);
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw lastError;
      }

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError = errorText;
        try {
          const errJson = JSON.parse(errorText);
          parsedError = errJson.error?.message || errorText;
        } catch { }

        // Handle 429: Rate Limit / Quota Exceeded
        if (response.status === 429) {
          this.consecutive429Count++;
          console.warn(`[GeminiClient] Ошибка 429 (подряд: ${this.consecutive429Count}) на ключе #${this.currentKeyIndex + 1} (${this.maskKey(activeKey)})`);

          // Если получено 3 ошибки 429 подряд и есть другие ключи — сразу переключаемся на следующий ключ!
          if (this.consecutive429Count >= 3 && this.apiKeys.length > 1) {
            const rotated = this.rotateToNextKey('Ключ исчерпал лимит квот 3 раза подряд');
            if (rotated && attempt < maxAttempts) {
              // Новый ключ имеет независимую квоту — пробуем сразу без минутного сна!
              continue;
            }
          }

          // Если других ключей нет или ошибок подряд меньше 3:
          if (attempt < maxAttempts) {
            let retryDelayMs = 25000;
            const match = parsedError.match(/retry in\s+([0-9.]+)\s*s/i);
            if (match && match[1]) {
              retryDelayMs = Math.ceil(parseFloat(match[1]) * 1000) + 1500;
            }
            console.warn(`[GeminiClient] Ожидание квоты ${Math.round(retryDelayMs / 1000)}с перед повторной попыткой ${attempt}/${maxAttempts}...`);
            await new Promise(r => setTimeout(r, retryDelayMs));
            continue;
          }
        }

        // Handle 503 (transient server unavailable) with short backoff
        if (response.status === 503 && attempt < maxAttempts) {
          console.warn(`[GeminiClient] Сервис временно недоступен (503). Повтор через 5с...`);
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }

        throw new Error(`Ошибка Gemini API (${response.status}): ${parsedError}`);
      }

      // Успешный HTTP 200 ответ: сбрасываем серию 429 ошибок
      this.consecutive429Count = 0;

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Пустой ответ от Gemini API.');
      }
      return rawText;
    }

    throw lastError || new Error('Не удалось получить ответ от Gemini API после всех попыток и ротаций ключей.');
  }

  /**
   * Self-healing repair block: requests the model to repair invalid JSON or incomplete plan.
   */
  private async repairWithReflection(
    brokenResponse: string,
    validationError: string,
    promptText: string
  ): Promise<GeminiRefactorResponse | null> {
    try {
      console.warn(`[GeminiClient] Reflection block triggered: "${validationError}". Requesting repair...`);
      const repairPrompt = `Твой предыдущий ответ не прошел проверку валидации:
ОШИБКА: ${validationError}

Твой предыдущий неполный ответ:
---
${brokenResponse.slice(0, 1500)}
---

Исходные фрагменты:
${promptText}

ТРЕБОВАНИЕ: Исправь ошибку и верни СТРОГО валидный завершенный JSON объект по схеме:
- Если "isDuplicate": true, ты ОБЯЗАН заполнить "conceptTitle", "canonicalNoteMarkdown" и массив "modifications" (содержащий ровно по одной замене для КАЖДОГО фрагмента). Поле "rejectionReason" должно быть пустой строкой "".
- Если "isDuplicate": false, укажи "rejectionReason" (1 предложение).
Верни ТОЛЬКО валидный JSON без markdown-оберток и комментариев.`;

      const requestBody = {
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents: [
          { role: 'user', parts: [{ text: repairPrompt }] }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: refactorEngineSchema,
          temperature: 0.1,
          maxOutputTokens: 2500
        }
      };

      const rawRepaired = await this.postToGemini(requestBody);
      return this.parseJsonResponse(rawRepaired);
    } catch (repairErr: any) {
      console.error('[GeminiClient] Reflection repair failed:', repairErr);
      return null;
    }
  }

  /**
   * Safely parses JSON response from model, stripping any markdown wrappers.
   */
  private parseJsonResponse(rawText: string): GeminiRefactorResponse {
    let sanitized = rawText.trim();
    if (sanitized.startsWith('```json')) sanitized = sanitized.slice(7);
    if (sanitized.startsWith('```')) sanitized = sanitized.slice(3);
    if (sanitized.endsWith('```')) sanitized = sanitized.slice(0, -3);
    sanitized = sanitized.trim();
    return JSON.parse(sanitized);
  }

  /**
   * Evaluates a candidate cluster through Gemini's Gatekeeper and Micro-Surgical pipeline.
   */
  async validateAndRefactorCluster(cluster: CandidateCluster): Promise<RefactorPlan> {
    if (!this.getActiveApiKey()) {
      throw new Error('API ключ Gemini не настроен. Укажите ваш Google AI Studio API-ключ в настройках плагина.');
    }

    const clusterPromptPayload = cluster.chunks.map((chunk, idx) => {
      return `--- ФРАГМЕНТ #${idx + 1} ---
Контекст: ${chunk.breadcrumbs}
Файл: ${chunk.filePath}
Текст фрагмента:
${chunk.text}
`;
    }).join('\n\n');

    const promptText = `Проанализируй следующие ${cluster.chunks.length} фрагмента(ов) заметок, найденных по высокому сходству вектора (сходство: ${(cluster.similarity * 100).toFixed(1)}%):\n\n${clusterPromptPayload}`;

    const requestBody = {
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: refactorEngineSchema,
        temperature: 0.1,
        maxOutputTokens: 2500
      }
    };

    let rawText = await this.postToGemini(requestBody);

    let parsed: GeminiRefactorResponse;
    try {
      parsed = this.parseJsonResponse(rawText);
    } catch (e: any) {
      // Syntax or unterminated string error: invoke reflection repair
      const repaired = await this.repairWithReflection(rawText, `Не удалось распарсить JSON: ${e.message}`, promptText);
      if (repaired) {
        parsed = repaired;
      } else {
        const preview = rawText.length > 250 ? `${rawText.slice(0, 250)}...` : rawText;
        throw new Error(`Не удалось распарсить JSON от модели: ${e.message}. Исходный ответ: ${preview}`);
      }
    }

    // Semantic validation of plan
    if (parsed.isDuplicate) {
      let issues: string[] = [];
      if (!parsed.conceptTitle || parsed.conceptTitle.trim().length === 0) {
        issues.push('conceptTitle отсутствует');
      }
      if (!parsed.modifications || !Array.isArray(parsed.modifications) || parsed.modifications.length === 0) {
        issues.push('массив modifications пуст');
      }

      if (issues.length > 0) {
        const repaired = await this.repairWithReflection(
          JSON.stringify(parsed),
          `Обнаружен дубликат (isDuplicate: true), но ${issues.join(', ')}! Обязательно сгенерируй массив modifications с заменами для всех фрагментов.`,
          promptText
        );
        if (repaired) {
          parsed = repaired;
        }
      }
    }

    // Convert to RefactorPlan
    const modifications: RefactorModification[] = [];

    if (parsed.isDuplicate) {
      if (parsed.modifications && Array.isArray(parsed.modifications)) {
        for (const mod of parsed.modifications) {
          const chunk = cluster.chunks.find(c => c.filePath === mod.filePath);
          let validOriginalSpan = mod.originalSpan;

          if (chunk && !chunk.text.includes(validOriginalSpan)) {
            const trimmed = validOriginalSpan.trim();
            if (chunk.text.includes(trimmed)) {
              validOriginalSpan = trimmed;
            }
          }

          modifications.push({
            filePath: mod.filePath,
            originalSpan: validOriginalSpan,
            suggestedInlineSpan: mod.suggestedInlineSpan,
            transclusionSpan: mod.transclusionSpan,
            selectedMode: 'inline'
          });
        }
      }

      // Safety Net: If modifications is still empty, synthesize deterministic fallbacks
      if (modifications.length === 0) {
        const safeTitle = parsed.conceptTitle?.replace(/[:/\\*?"<>|]/g, '').trim() || 'Новая концепция';
        for (const chunk of cluster.chunks) {
          const firstLine = chunk.text.split('\n').map(l => l.trim()).find(l => l.length > 0) || chunk.text.slice(0, 80);
          modifications.push({
            filePath: chunk.filePath,
            originalSpan: firstLine,
            suggestedInlineSpan: `[[${safeTitle}]]`,
            transclusionSpan: `![[${safeTitle}]]`,
            selectedMode: 'inline'
          });
        }
      }
    }

    const rawAliases = Array.isArray(parsed.aliases) ? parsed.aliases : [];
    const aliases = rawAliases
      .filter((a: any) => typeof a === 'string' && a.trim().length > 0)
      .map((a: string) => a.trim().replace(/[:/\\*?"<>|]/g, ''));
    const uniqueAliases = Array.from(new Set(aliases));

    return {
      id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      clusterId: cluster.id,
      isDuplicate: parsed.isDuplicate,
      rejectionReason: parsed.isDuplicate ? '' : parsed.rejectionReason,
      conceptTitle: parsed.conceptTitle?.replace(/[:/\\*?"<>|]/g, '').trim(),
      aliases: uniqueAliases.length > 0 ? uniqueAliases : undefined,
      canonicalNoteMarkdown: parsed.canonicalNoteMarkdown,
      modifications
    };
  }
}
