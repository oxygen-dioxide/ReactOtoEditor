import JSZip from "jszip";
import * as vscode from 'vscode';

export interface IFileSystemAdapter {  
  readFile(path: string): Promise<ArrayBuffer>;  
  writeFile(path: string, content: ArrayBuffer): Promise<void>;  
  listFiles(pattern: string): Promise<string[]>;  
  exists(path: string): Promise<boolean>;  
}  
  
// 网页版实现（ZIP）  
export class ZipFileSystemAdapter implements IFileSystemAdapter {  
  constructor(private zip: JSZip) {}  
    
  async readFile(path: string): Promise<ArrayBuffer> {  
    return this.zip.file(path)?.async("arraybuffer") || new ArrayBuffer(0);  
  }  

  async writeFile(path: string, content: ArrayBuffer): Promise<void> {
    this.zip.file(path, content);
  }

  async listFiles(pattern: string): Promise<string[]> {
    const files: string[] = [];
    this.zip.forEach((relativePath) => {
      if (relativePath.match(pattern)) {
        files.push(relativePath);
      }
    });
    return files;
  }
  
  async exists(path: string): Promise<boolean> {
    return this.zip.file(path) !== null;
  }
}  
  
// VSCode版实现（本地文件系统）  
export class VSCodeFileSystemAdapter implements IFileSystemAdapter {  
  async readFile(path: string): Promise<ArrayBuffer> {  
    const uri = vscode.Uri.file(path);  
    const content = await vscode.workspace.fs.readFile(uri);  
    return content.buffer as ArrayBuffer;  
  }

  async writeFile(path: string, content: ArrayBuffer): Promise<void> {
    const uri = vscode.Uri.file(path);
    const uint8Array = new Uint8Array(content);
    await vscode.workspace.fs.writeFile(uri, uint8Array);
  }

  async listFiles(pattern: string): Promise<string[]> {
    const files: string[] = [];
    if (vscode.workspace.workspaceFolders) {
      for (const folder of vscode.workspace.workspaceFolders) {
        const folderUri = folder.uri;
        const entries = await vscode.workspace.fs.readDirectory(folderUri);
        for (const [name, type] of entries) {
          const filePath = vscode.Uri.joinPath(folderUri, name).fsPath;
          if (filePath.match(pattern)) {
            files.push(filePath);
          }
          if (type === vscode.FileType.Directory) {
            const subFiles = await this.listFilesInDirectory(filePath, pattern);
            files.push(...subFiles);
          }
        }
      }
    }
    return files;
  }

  private async listFilesInDirectory(dirPath: string, pattern: string): Promise<string[]> {
    const files: string[] = [];
    const dirUri = vscode.Uri.file(dirPath);
    const entries = await vscode.workspace.fs.readDirectory(dirUri);
    for (const [name, type] of entries) {
      const filePath = vscode.Uri.joinPath(dirUri, name).fsPath;
      if (filePath.match(pattern)) {
        files.push(filePath);
      }
      if (type === vscode.FileType.Directory) {
        const subFiles = await this.listFilesInDirectory(filePath, pattern);
        files.push(...subFiles);
      }
    }
    return files;
  }

  async exists(path: string): Promise<boolean> {
    const uri = vscode.Uri.file(path);
    try {
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  } 
}