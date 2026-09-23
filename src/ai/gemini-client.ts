import { CandidateCluster, RefactorPlan, RefactorModification } from '../types';
import { refactorEngineSchema, GeminiRefactorResponse } from '../types/llm-schema';

const SYSTEM_INSTRUCTION = `Ты — строгий редактор персональной базы знаний Zettelkasten. Твоя цель — консолидация дублирующихся концепций.

КРИТЕРИЙ ДЕДУПЛИКАЦИИ (Gatekeeper Mode):
Объединяй ТОЛЬКО концепции с одинаковым физическим или абстрактным смыслом.
- ЗАПРЕЩЕНО объединять омонимы и междоменные метафоры (например, "бутылочное горлышко" в архитектуре процессоров и "бутылочное горлышко" в бизнес-процессах склада — это РАЗНЫЕ сущности из разных доменов).
- Обращай пристальное внимание на Breadcrumbs [Путь > Заголовок > ...], в которых находятся фрагменты.
- Если контексты фрагментов принадлежат несовместимым областям знаний или это совпадение лишь по слову, установи "isDuplicate": false и укажи понятную "rejectionReason".

ПРАВИЛО МИКРОХИРУРГИИ СТИЛЯ (Surgical Span Replacer Mode):
- Если isDuplicate: true:
  1. Сформулируй емкое "conceptTitle" для новой атомарной заметки (без недопустимых символов: / \\ * ? : " < > |).
  2. Напиши "canonicalNoteMarkdown": качественное, самодостаточное определение концепции, ключевые тезисы или формулы в Markdown.
  3. Для КАЖДОГО фрагмента найди МИНИМАЛЬНЫЙ точный сегмент текста ("originalSpan"), который непосредственно выражает дублируемое определение.
     ВНИМАНИЕ: "originalSpan" ДОЛЖЕН СТРОГО, СИМВОЛ В СИМВОЛ, присутствовать в исходном тексте фрагмента!
  4. Составь "suggestedInlineSpan": микрохирургическая замена оригинального сегмента. ЗАПРЕЩЕНО переписывать весь абзац! Сохраняй авторский синтаксис, пунктуацию, сленг и грамматику, встраивая [[conceptTitle]] или [[conceptTitle|алиас]].
  5. Составь "transclusionSpan": альтернативный вариант замены на трансклюзию вида ![[conceptTitle]].`;

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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey.trim()}`;

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
        temperature: 0.2
      }
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
    } catch (netErr: any) {
      throw new Error(`Сетевая ошибка при запросе к Gemini API: ${netErr.message}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const errJson = JSON.parse(errorText);
        parsedError = errJson.error?.message || errorText;
      } catch { }
      throw new Error(`Ошибка Gemini API (${response.status}): ${parsedError}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Пустой ответ от Gemini API.');
    }

    let parsed: GeminiRefactorResponse;
    try {
      parsed = JSON.parse(rawText);
    } catch (e: any) {
      throw new Error(`Не удалось распарсить JSON от модели: ${e.message}. Исходный ответ: ${rawText}`);
    }

    // Convert to RefactorPlan
    const modifications: RefactorModification[] = [];

    if (parsed.isDuplicate && parsed.modifications && Array.isArray(parsed.modifications)) {
      for (const mod of parsed.modifications) {
        // Find corresponding chunk to verify originalSpan exists
        const chunk = cluster.chunks.find(c => c.filePath === mod.filePath);
        let validOriginalSpan = mod.originalSpan;

        if (chunk && !chunk.text.includes(validOriginalSpan)) {
          // Attempt whitespace-normalized match
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

    return {
      id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      clusterId: cluster.id,
      isDuplicate: parsed.isDuplicate,
      rejectionReason: parsed.rejectionReason,
      conceptTitle: parsed.conceptTitle?.replace(/[:/\\*?"<>|]/g, '').trim(),
      canonicalNoteMarkdown: parsed.canonicalNoteMarkdown,
      modifications
    };
  }
}
