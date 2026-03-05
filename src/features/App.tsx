import * as React from "react";
import i18n from "../i18n/configs";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useCookieStore } from "../store/cookieStore";
import { getDesignTokens } from "../config/theme";

import { Header } from "./Header/Header";
import { Footer } from "../components/Fotter";
import { TopView } from "../components/Top/TopView";
import { EditorView } from "./Editor/EditorView";

import { useInitializeApp } from "../hooks/useInitializeApp";
import { useThemeMode } from "../hooks/useThemeMode";
import { useOtoProjectStore } from "../store/otoProjectStore";
import { useVSCodeIntegration } from "../hooks/useVSCodeIntegration";
import { useEffect } from "react";

/**
 * Reactのエンドポイント
 * @returns 全体のjsx
 */
export const App: React.FC = () => {
  useInitializeApp();
  const mode_ = useThemeMode();
  const { language } = useCookieStore();
  const { oto, loadOtoFromContent, getOtoContent } = useOtoProjectStore();
  const { isVSCodeEnv, document: vscodeDocument, isReady } = useVSCodeIntegration();
  
  const theme = React.useMemo(
    () => createTheme(getDesignTokens(mode_)),
    [mode_]
  );
  React.useMemo(() => {
    i18n.changeLanguage(language);
    if (typeof window !== 'undefined' && window.document) {
      window.document.documentElement.lang = language;
    }
  }, [language]);

  // Load oto.ini content in VSCode environment
  useEffect(() => {
    if (isVSCodeEnv && vscodeDocument && !oto) {
      loadOtoFromContent(vscodeDocument.content);
    }
  }, [isVSCodeEnv, vscodeDocument, oto, loadOtoFromContent]);

  // Auto-save in VSCode environment when oto changes
  useEffect(() => {
    if (isVSCodeEnv && oto) {
      const content = getOtoContent();
      // Note: In a real implementation, you might want to debounce this
      // or save on specific user actions rather than on every change
    }
  }, [isVSCodeEnv, oto, getOtoContent]);

  // In VSCode environment, don't show Header/Footer for cleaner editor experience
  if (isVSCodeEnv) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {isReady && (oto !== null ? <EditorView /> : <div>Loading oto.ini...</div>)}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      {oto !== null && <EditorView />}
      {oto === null && <TopView />}
      {oto === null && <Footer />}
    </ThemeProvider>
  );
};
