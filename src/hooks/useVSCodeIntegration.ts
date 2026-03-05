import { useEffect, useState } from 'react';
import { isVSCode, onMessage, postMessage } from './useVSCode';

export interface VSCodeDocument {
  content: string;
  uri: string;
}

export const useVSCodeIntegration = () => {
  const [document, setDocument] = useState<VSCodeDocument | null>(null);
  const [isVSCodeEnv, setIsVSCodeEnv] = useState(false);

  useEffect(() => {
    const vscodeEnv = isVSCode;
    setIsVSCodeEnv(vscodeEnv);
    
    if (vscodeEnv) {
      // Listen for messages from VSCode extension
      onMessage((message) => {
        switch (message.type) {
          case 'init':
            setDocument({
              content: message.content,
              uri: message.uri
            });
            break;
          case 'saveComplete':
            // Could show a save notification here
            break;
        }
      });
    }
  }, []);

  const saveDocument = (content: string) => {
    if (isVSCodeEnv && document) {
      postMessage({
        type: 'save',
        content: content
      });
    }
  };

  return {
    isVSCodeEnv,
    document,
    saveDocument,
    isReady: isVSCodeEnv ? !!document : true
  };
};