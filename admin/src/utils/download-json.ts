/** Offers `data` as a pretty-printed JSON file download through a temporary anchor element. */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Reads a File as text. Rejects when the browser cannot read it. */
export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(String(event.target?.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Kunde inte läsa filen.'));
    reader.readAsText(file);
  });
}
