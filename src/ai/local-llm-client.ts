import type { CandidateCluster, RefactorPlan, RefactorModification } from '../types/index.ts';
import type { GeminiRefactorResponse } from '../types/llm-schema.ts';

export class LocalLlmClient {
  private endpoint: string;
  private model: string;
  private apiKey: string;

  constructor(endpoint: string = 'http://localhost:11434/v1', model: string = 'llama3.2', apiKey: string = '') {
    this.endpoint = endpoint.replace(/\/+$/, '');
    this.model = model || 'llama3.2';
    this.apiKey = apiKey || '';
  }

  updateConfig(endpoint: string, model: string, apiKey: string = '') {
    this.endpoint = endpoint.replace(/\/+$/, '');
    this.model = model || 'llama3.2';
    this.apiKey = apiKey || '';
  }

  async validateAndRefactorCluster(cluster: CandidateCluster): Promise<RefactorPlan> {
    const clusterPromptPayload = cluster.chunks.map((chunk, idx) => {
      return `--- ФРАГМЕНТ #${idx + 1} ---
Контекст: ${chunk.breadcrumbs}
Файл: ${chunk.filePath}
Текст фрагмента:
${chunk.text}
`;
    }).join('\n\n');

    const promptText = `Проанализируй следующие ${cluster.chunks.length} текстовых фрагментов из разных заметок на предмет дублирования концепции:

${clusterPromptPayload}

Строго верни валидный JSON объект со структурой:
{
  "isDuplicate": true или false,
  "conceptTitle": "Название канонической заметки (если isDuplicate true)",
  "aliases": ["синоним 1", "синоним 2"],
  "canonicalNoteMarkdown": "Текст новой заметки в Markdown",
  "modifications": [
    {
      "filePath": "путь к файлу",
      "originalSpan": "точный фрагмент для замены",
      "suggestedInlineSpan": "[[conceptTitle]] или [[conceptTitle|алиас]]",
      "transclusionSpan": "![[conceptTitle]]"
    }
  ],
  "rejectionReason": "причина отказа (если isDuplicate false)"
}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey.trim().length > 0) {
      headers['Authorization'] = `Bearer ${this.apiKey.trim()}`;
    }

    const url = `${this.endpoint}/chat/completions`;
    const body = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `Ты — строгий редактор персональной базы знаний Zettelkasten. Твоя цель — консолидация дублирующихся концепций.
КРИТЕРИЙ ДЕДУПЛИКАЦИИ:
Объединяй ТОЛЬКО концепции с одинаковым физическим или абстрактным смыслом.
ЗАПРЕЩЕНО объединять омонимы и метафоры из разных доменов.
Если дублирование подтверждено, установи isDuplicate: true, сформулируй conceptTitle, aliases, canonicalNoteMarkdown и modifications (по одной точной замене originalSpan для КАЖДОГО фрагмента).
Если нет, установи isDuplicate: false и укажи rejectionReason.
Отвечай ИСКЛЮЧИТЕЛЬНО валидным JSON.`
        },
        {
          role: 'user',
          content: promptText
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
    } catch (err: any) {
      throw new Error(`Не удалось подключиться к локальной LLM (${url}): ${err.message}. Убедитесь, что Ollama или LM Studio запущены.`);
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ошибка ответа локальной LLM (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content;
    if (!rawText) {
      throw new Error('Пустой ответ от локальной LLM.');
    }

    let parsed: GeminiRefactorResponse;
    try {
      let sanitized = rawText.trim();
      if (sanitized.startsWith('```json')) sanitized = sanitized.slice(7);
      if (sanitized.startsWith('```')) sanitized = sanitized.slice(3);
      if (sanitized.endsWith('```')) sanitized = sanitized.slice(0, -3);
      sanitized = sanitized.trim();
      parsed = JSON.parse(sanitized);
    } catch (e: any) {
      throw new Error(`Локальная LLM вернула некорректный JSON: ${e.message}. Ответ: ${rawText.slice(0, 300)}`);
    }

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
      rejectionReason: parsed.isDuplicate ? '' : (parsed.rejectionReason || 'Отклонено локальной LLM'),
      conceptTitle: parsed.conceptTitle?.replace(/[:/\\*?"<>|]/g, '').trim(),
      aliases: uniqueAliases.length > 0 ? uniqueAliases : undefined,
      canonicalNoteMarkdown: parsed.canonicalNoteMarkdown,
      modifications
    };
  }
}
