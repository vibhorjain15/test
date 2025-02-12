import type { DVEditorPlaceholderReset } from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface PluginsMap {
    [DVEditorPlaceholderReset.pluginName]: DVEditorPlaceholderReset;
  }
}
