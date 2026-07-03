export type PreviewFile = { id: string; file: File; previewUrl: string };

let pending: PreviewFile[] = [];

export function setPendingFiles(files: File[]) {
  clearPendingFiles();
  pending = files.map((f) => ({
    id: crypto.randomUUID(),
    file: f,
    previewUrl: URL.createObjectURL(f),
  }));
}

export function getPendingFiles(): PreviewFile[] {
  return pending;
}

export function clearPendingFiles() {
  for (const p of pending) {
    try {
      URL.revokeObjectURL(p.previewUrl);
    } catch {
      /* noop */
    }
  }
  pending = [];
}
