import { Batch, EventInfo, Plugin } from 'ckeditor5';

export default class DVEditorPlaceholderReset extends Plugin {
  public static get pluginName() {
    return 'DVEditorPlaceholderReset' as const;
  }

  init(): void {
    const editor = this.editor;
    let isDataReset = false;
    editor.model.document.on(
      'change:data',
      (event: EventInfo, batch: Batch) => {
        if (isDataReset) {
          isDataReset = false;
          return;
        }

        if (batch.isUndo) {
          return;
        }

        const data = editor.getData();
        if (data) {
          return;
        }

        const placeholderElementAttributes = editor.model.document
          .getRoot('main')
          ?.getChild(0)
          ?.getAttribute('htmlPAttributes') as any;
        if (
          placeholderElementAttributes &&
          (placeholderElementAttributes.attributes ||
            placeholderElementAttributes.styles)
        ) {
          const attributes = Object.keys(
            placeholderElementAttributes.attributes
          );

          const styles = Object.keys(placeholderElementAttributes.styles);
          const pattern = /^(margin-|padding-|text-|font-|widows|orphans)/;

          // Check if content is imported from Document Parser
          if (
            attributes.some((attr) => attr.startsWith('elem_')) ||
            styles.some((style) => pattern.test(style))
          ) {
            isDataReset = true;

            // Stop current event, as the editor.data.set('') will trigger the change event with empty string
            event.stop();

            // Manually set the empty string as data to reset unnecessary stylings that are currently applied on the placeholder element
            editor.data.set('', { batchType: { isUndoable: true } });

            // Undo the current operation (which has triggered this change event). So that, when user clicks on 'undo', it'll not render the misaligned placeholder again
            editor.execute('undo', batch);
          }
        }
      },
      {
        priority: 'high',
      }
    );
  }
}
