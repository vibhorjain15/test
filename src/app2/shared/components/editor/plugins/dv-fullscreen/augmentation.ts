import type { DVFullScreen, DVFullScreenConfig } from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {
    fullscreen?: Partial<DVFullScreenConfig>;
  }

  interface PluginsMap {
    [DVFullScreen.pluginName]: DVFullScreen;
  }
}
