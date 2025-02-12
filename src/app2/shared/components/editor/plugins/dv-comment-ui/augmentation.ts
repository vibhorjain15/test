import type { DVCommentUI, DVCommentUIConfig } from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface PluginsMap {
    [DVCommentUI.pluginName]: DVCommentUI;
  }

  interface EditorConfig {
    dvCommentUIConfig?: DVCommentUIConfig;
  }
}
