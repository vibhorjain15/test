import { Plugin } from 'ckeditor5';
import DVFootNoteEditing from './dv-footnoteediting';
import DVFootNoteUI from './dv-footnoteui';

export default class DVFootNote extends Plugin {
  public static get requires() {
    return [DVFootNoteEditing, DVFootNoteUI] as const;
  }

  public static get pluginName() {
    return 'DVFootNote' as const;
  }
}
