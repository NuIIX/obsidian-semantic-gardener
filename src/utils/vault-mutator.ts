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
