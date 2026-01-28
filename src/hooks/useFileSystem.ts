import { useEffect } from 'react';  
import { useOtoProjectStore } from '../store/otoProjectStore';  
import { VSCodeFileSystemAdapter } from '../lib/FileSystem/FileSystemAdapter';  
  
declare const __BUILD_TARGET__: string;  
  
export const useFileSystem = () => {  
  const { setFileSystem } = useOtoProjectStore();  
    
  useEffect(() => {  
    if (__BUILD_TARGET__ === 'vscode') {  
      // VSCode环境，等待扩展消息  
      window.addEventListener('message', (event) => {  
        if (event.data.type === 'setFileSystem') {  
          setFileSystem(new VSCodeFileSystemAdapter());  
        }  
      });  
    } else {  
      // 网页环境，使用ZIP适配器  
      // 现有的ZIP初始化逻辑保持不变  
    }  
  }, [setFileSystem]);  
};