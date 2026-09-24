import { CandidateCluster, RefactorPlan, RefactorModification } from '../types';
import { refactorEngineSchema, GeminiRefactorResponse } from '../types/llm-schema';

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
  2. Напиши "canonicalNoteMarkdown": качественное, самодостаточное определение концепции, ключевые тезисы или формулы в Markdown.
  3. Для КАЖДОГО фрагмента найди МИНИМАЛЬНЫЙ точный сегмент текста ("originalSpan"), который непосредственно выражает дублируемое определение.
     ВНИМАНИЕ: "originalSpan" ДОЛЖЕН СТРОГО, СИМВОЛ В СИМВОЛ, присутствовать в исходном тексте фрагмента!
  4. Составь "suggestedInlineSpan": микрохирургическая замена оригинального сегмента. ЗАПРЕЩЕНО переписывать весь абзац! Сохраняй авторский синтаксис, пунктуацию, сленг и грамматику, встраивая [[conceptTitle]] или [[conceptTitle|алиас]].
  5. Составь "transclusionSpan": альтернативный вариант замены на трансклюзию вида ![[conceptTitle]].
- Если isDuplicate: false:
  Поля conceptTitle, canonicalNoteMarkdown и modifications должны отсутствовать или быть пустыми.`;

export class GeminiClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-3.5-flash-lite') {
    this.apiKey = apiKey;
    this.model = model;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  setModel(model: string) {
    this.model = model;
  }

  /**
   * Sends a request to Gemini API with automatic rate-limit cooldown and retry.
   */
  private async postToGemini(requestBody: any): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey.trim()}`;
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
      } catch (netErr: any) {
        lastError = new Error(`Сетевая ошибка при запросе к Gemini API: ${netErr.message}`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000 * attempt));
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

        // Handle 429 (quota / rate limit) and 503 (transient server unavailable) with backoff
        if ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
          let retryDelayMs = 25000;
          const match = parsedError.match(/retry in\s+([0-9.]+)\s*s/i);
          if (match && match[1]) {
            retryDelayMs = Math.ceil(parseFloat(match[1]) * 1000) + 1500;
          }
          console.warn(`[GeminiClient] Quota limit (${response.status}) hit. Cooldown ${Math.round(retryDelayMs / 1000)}s before retry ${attempt}/${maxRetries}...`);
          await new Promise(r => setTimeout(r, retryDelayMs));
          continue;
        }

        throw new Error(`Ошибка Gemini API (${response.status}): ${parsedError}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Пустой ответ от Gemini API.');
      }
      return rawText;
    }

    throw lastError || new Error('Не удалось получить ответ от Gemini API.');
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
    if (!this.apiKey || this.apiKey.trim().length === 0) {
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

    return {
      id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      clusterId: cluster.id,
      isDuplicate: parsed.isDuplicate,
      rejectionReason: parsed.isDuplicate ? '' : parsed.rejectionReason,
      conceptTitle: parsed.conceptTitle?.replace(/[:/\\*?"<>|]/g, '').trim(),
      canonicalNoteMarkdown: parsed.canonicalNoteMarkdown,
      modifications
    };
  }
}
