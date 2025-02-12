import type { DVCommentsConfig, CommentsIntegration } from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {
    dvComments?: Partial<DVCommentsConfig>;
  }

  interface PluginsMap {
    [CommentsIntegration.pluginName]: CommentsIntegration;
  }
}
