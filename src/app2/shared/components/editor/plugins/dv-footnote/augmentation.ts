import type {
  DVInsertFootNote,
  DVInsertFootNoteCommand,
  DVFootNote,
  DVFootNoteEditing,
  DVFootNoteUI,
} from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface PluginsMap {
    [DVFootNote.pluginName]: DVFootNote;
    [DVFootNoteEditing.pluginName]: DVFootNoteEditing;
    [DVFootNoteUI.pluginName]: DVFootNoteUI;
  }

  interface CommandsMap {
    [DVInsertFootNote]: DVInsertFootNoteCommand;
  }
}
