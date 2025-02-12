import type { UsersIntegration } from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface PluginsMap {
    [UsersIntegration.pluginName]: UsersIntegration;
  }

  interface EditorConfig {
    dvUserConfig?: {
      users: Array<any>;
      currentUserId: number;
    };
  }
}
