// POSIX-compatible path shim for Browser & Web Worker environments
export function dirname(pathStr: string): string {
  if (!pathStr || typeof pathStr !== 'string') return '.';
  const normalized = pathStr.replace(/\\/g, '/').replace(/\/+$/, '');
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === -1) return '.';
  if (lastSlash === 0) return '/';
  return normalized.slice(0, lastSlash);
}

export function basename(pathStr: string, ext?: string): string {
  if (!pathStr || typeof pathStr !== 'string') return '';
  const normalized = pathStr.replace(/\\/g, '/').replace(/\/+$/, '');
  const lastSlash = normalized.lastIndexOf('/');
  let base = lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);
  if (ext && base.endsWith(ext)) {
    base = base.slice(0, -ext.length);
  }
  return base;
}

export function extname(pathStr: string): string {
  if (!pathStr || typeof pathStr !== 'string') return '';
  const base = basename(pathStr);
  const dotIndex = base.lastIndexOf('.');
  if (dotIndex <= 0) return '';
  return base.slice(dotIndex);
}

export function normalize(pathStr: string): string {
  if (!pathStr || typeof pathStr !== 'string') return '';
  const isAbs = pathStr.startsWith('/') || pathStr.startsWith('\\');
  const segments = pathStr.replace(/\\/g, '/').split('/');
  const stack: string[] = [];
  for (const seg of segments) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      if (stack.length > 0 && stack[stack.length - 1] !== '..') {
        stack.pop();
      } else if (!isAbs) {
        stack.push('..');
      }
    } else {
      stack.push(seg);
    }
  }
  const result = stack.join('/');
  return isAbs ? '/' + result : result || '.';
}

export function join(...segments: string[]): string {
  const valid = segments.filter(s => typeof s === 'string' && s.length > 0);
  if (valid.length === 0) return '.';
  return normalize(valid.join('/'));
}

export function resolve(...segments: string[]): string {
  return join(...segments);
}

export function isAbsolute(pathStr: string): boolean {
  if (!pathStr || typeof pathStr !== 'string') return false;
  return pathStr.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(pathStr);
}

export const sep = '/';
export const delimiter = ':';

const pathShim = {
  dirname,
  basename,
  extname,
  join,
  resolve,
  normalize,
  isAbsolute,
  sep,
  delimiter
};

export default pathShim;
