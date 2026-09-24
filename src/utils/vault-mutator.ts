import { App, TFile, TFolder, normalizePath } from 'obsidian';

/**
 * Ensures that a given directory path exists in the Obsidian vault.
 * Creates intermediate directories recursively if necessary.
 */
export async function ensureFolderExists(app: App, folderPath: string): Promise<void> {
  const normalized = normalizePath(folderPath).trim();
  if (!normalized || normalized === '/' || normalized === '.') {
    return;
  }

  const parts = normalized.split('/').filter(p => p.length > 0);
  let currentPath = '';

  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const exists = await app.vault.adapter.exists(currentPath);
    if (!exists) {
      try {
        await app.vault.createFolder(currentPath);
      } catch (err: any) {
        // Folder may have been created concurrently
        if (!err.message?.includes('already exists')) {
          throw err;
        }
      }
    }
  }
}

/**
 * Retrieves all markdown files from the vault, filtering out excluded directories.
 */
export function getMarkdownFiles(app: App, excludedFolders: string[] = []): TFile[] {
  const normalizedExcludes = excludedFolders
    .map(f => normalizePath(f.trim()))
    .filter(f => f.length > 0);

  return app.vault.getMarkdownFiles().filter(file => {
    // Exclude Obsidian Excalidraw drawing files which contain massive JSON boilerplate
    if (file.name.endsWith('.excalidraw.md') || file.path.endsWith('.excalidraw.md')) {
      return false;
    }

    const filePath = normalizePath(file.path);
    for (const excluded of normalizedExcludes) {
      if (filePath.startsWith(excluded)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Normalizes wikilink target name, removing forbidden characters for Obsidian note names.
 */
export function sanitizeNoteTitle(title: string): string {
  return title
    .replace(/[:/\\*?"<>|#^\[\]]/g, '')
    .trim();
}

/**
 * Injects or updates YAML frontmatter with aliases for an Obsidian note.
 */
export function ensureFrontmatterAliases(content: string, aliases?: string[]): string {
  if (!aliases || aliases.length === 0) {
    return content;
  }
  const cleanAliases = Array.from(new Set(
    aliases
      .map(a => a.trim().replace(/[:/\\*?"<>|#^\[\]]/g, ''))
      .filter(a => a.length > 0)
  ));
  if (cleanAliases.length === 0) {
    return content;
  }

  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = content.match(frontmatterRegex);
  const formattedAliases = cleanAliases.map(a => `  - "${a.replace(/"/g, '\\"')}"`).join('\n');

  if (match) {
    const yamlBody = match[1];
    if (/aliases\s*:/i.test(yamlBody)) {
      return content;
    }
    const updatedYaml = `${yamlBody.trimEnd()}\naliases:\n${formattedAliases}`;
    return content.replace(frontmatterRegex, `---\n${updatedYaml}\n---`);
  }

  return `---\naliases:\n${formattedAliases}\n---\n\n${content.trimStart()}`;
}
