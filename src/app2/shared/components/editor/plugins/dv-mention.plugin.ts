import { Mention, Plugin } from 'ckeditor5';

export class DVMention extends Plugin {
  public static get requires() {
    return [Mention] as const;
  }

  public static get pluginName() {
    return 'DVMention' as const;
  }

  init(): void {
    const editor = this.editor;

    // The upcast converter will convert view <span class="mention" data-mention-id="">
    // elements to the model 'mention' text attribute.
    editor.conversion.for('upcast').elementToAttribute({
      view: {
        name: 'span',
        key: 'data-mention',
        classes: ['mymention', 'mention-tag-text'],
        attributes: {
          title: true,
          'data-mention-id': true,
          'data-email': true,
          'data-toggle': true,
        },
      },
      model: {
        key: 'mention',
        value: (viewItem: any) => {
          // The mention feature expects that the mention attribute value
          // in the model is a plain object with a set of additional attributes.
          // In order to create a proper object use the toMentionAttribute() helper method:
          const mentionAttribute = editor.plugins
            .get(Mention)
            .toMentionAttribute(viewItem, {
              // Add any other properties that you need.
              title: viewItem.getAttribute('title'),
              mentionId: viewItem.getAttribute('data-mention-id'),
              email: viewItem.getAttribute('data-email'),
              toggle: viewItem.getAttribute('data-toggle'),
            });

          return mentionAttribute;
        },
      },
      converterPriority: 'high',
    });

    // Downcast the model 'mention' text attribute to a view <span> element.
    editor.conversion.for('downcast').attributeToElement({
      model: 'mention',
      view: (modelAttributeValue, { writer }) => {
        // Do not convert empty attributes (lack of value means no mention).
        if (!modelAttributeValue) {
          return;
        }

        return writer.createAttributeElement(
          'span',
          {
            class: 'mymention mention-tag-text',
            'data-mention': modelAttributeValue.id,
            'data-mention-id': modelAttributeValue.mentionId,
            'data-email': modelAttributeValue.email,
            'data-toggle': modelAttributeValue.toggle,
            title: modelAttributeValue.title,
          },
          {
            // Make mention attribute to be wrapped by other attribute elements.
            priority: 20,
            // Prevent merging mentions together.
            id: modelAttributeValue.uid,
          }
        );
      },
      converterPriority: 'high',
    });
  }
}
