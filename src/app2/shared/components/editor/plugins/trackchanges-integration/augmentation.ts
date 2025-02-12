import type { TrackChangesIntegration, DVTrackChangesConfig } from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {
    dvTrackChanges?: Partial<DVTrackChangesConfig>;
  }

  interface PluginsMap {
    [TrackChangesIntegration.pluginName]: TrackChangesIntegration;
  }
}
