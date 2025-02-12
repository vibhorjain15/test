import type {
  DVImageUploadPlugin,
  DVImageUploadUI,
  DVUploadConfig,
} from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {
    dvUpload?: DVUploadConfig;
  }

  interface PluginsMap {
    [DVImageUploadUI.pluginName]: DVImageUploadUI;
    [DVImageUploadPlugin.pluginName]: DVImageUploadPlugin;
  }
}
