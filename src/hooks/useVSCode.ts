export const isVSCode = typeof window !== 'undefined' && typeof (window as any).acquireVsCodeApi !== 'undefined';

export const acquireVsCodeApi = () => {
  if (isVSCode) {
    return (window as any).acquireVsCodeApi();
  }
  return null;
};

export const postMessage = (message: any) => {
  const vscode = acquireVsCodeApi();
  if (vscode) {
    vscode.postMessage(message);
  }
};

export const onMessage = (callback: (message: any) => void) => {
  if (isVSCode) {
    window.addEventListener('message', (event) => {
      callback(event.data);
    });
  }
};