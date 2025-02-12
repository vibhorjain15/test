import {
  DowncastConversionApi,
  Editor,
  Element,
  Item,
  Plugin,
  toWidget,
  toWidgetEditable,
  ViewElement,
  viewToModelPositionOutsideModelElement,
  Widget,
} from 'ckeditor5';
import { DVInsertFootNote } from './utils';
import DVInsertFootNoteCommand from './dv-insertfootnotecommand';

export default class DVFootNoteEditing extends Plugin {
  public static get requires() {
    return [Widget] as const;
  }

  public static get pluginName() {
    return 'DVFootNoteEditing' as const;
  }

  init(): void {
    this.defineSchema();
    this.defineConverters();

    this.editor.commands.add(
      DVInsertFootNote,
      new DVInsertFootNoteCommand(this.editor)
    );

    this.deleteModify();

    this.editor.editing.mapper.on(
      'viewToModelPosition',
      viewToModelPositionOutsideModelElement(this.editor.model, (viewElement) =>
        viewElement.hasClass('noteholder')
      )
    );

    this.editor.editing.mapper.on(
      'viewToModelPosition',
      viewToModelPositionOutsideModelElement(this.editor.model, (viewElement) =>
        viewElement.hasClass('footnote-item')
      )
    );

    // this.editor.model.document.on('change:data', this.fixFootNote);

    // this.editor.model.document.registerPostFixer((writer) =>
    //   this.fixFootNote(writer)
    // );
  }

  private defineSchema(): void {
    const schema = this.editor.model.schema;

    // Footnote section schema
    schema.register('footNote', {
      isObject: true,
      allowWhere: '$block',
    });

    schema.register('footNoteTitle', {
      allowIn: 'footNote',
      allowContentOf: '$text',
    });

    schema.register('footNoteList', {
      allowIn: 'footNote',
      allowContentOf: '$block',
      isInline: true,
      isLimit: true,
      allowAttributes: ['data-id'],
    });

    schema.register('footNoteItem', {
      allowIn: 'footNoteList',
      allowWhere: '$text',
      isInline: true,
      isObject: true,
      allowAttributes: ['id'],
    });

    // Disallow footNote being created inside footNoteList
    schema.addChildCheck((context, childDefinition) => {
      if (
        context.endsWith('footNoteList') &&
        childDefinition.name === 'footNote'
      ) {
        return false;
      }
    });

    // FootNote inline schema
    schema.register('noteHolder', {
      allowWhere: '$text',
      isInline: true,
      isObject: true,
      allowAttributes: ['id'],
    });
  }

  private defineConverters(): void {
    const editor = this.editor;
    const conversion = editor.conversion;

    //#region  FootNote Section Conversion

    // ((data) view -> model)
    conversion.for('upcast').elementToElement({
      view: {
        name: 'section',
        classes: 'footnote',
      },
      model: (viewElement, { writer }) => {
        const footNote = writer.createElement('footNote');
        return footNote;
      },
    });

    // (model -> data view)
    conversion.for('dataDowncast').elementToElement({
      model: 'footNote',
      view: {
        name: 'section',
        classes: 'footnote',
      },
    });

    // (model -> editing view)
    conversion.for('editingDowncast').elementToElement({
      model: 'footNote',
      view: (modelElement, { writer }) => {
        const section = writer.createContainerElement('section', {
          class: 'footnote',
        });

        return toWidget(section, writer, { label: 'footnote widget' });
      },
    });

    //#endregion

    //#region Footnote Title Conversion

    const createTitleView = (
      modelElement: any,
      { writer }: DowncastConversionApi
    ) => {
      const titleView = writer.createContainerElement('h3', {
        class: 'footnote-title',
        // style: 'display: inline;',
      });

      const innerText = writer.createText('Footnotes:');
      writer.insert(writer.createPositionAt(titleView, 0), innerText);

      return titleView;
    };

    conversion.for('upcast').elementToElement({
      model: 'footNoteTitle',
      view: {
        name: 'h3',
        classes: 'footnote-title',
        // styles: 'display: inline;',
      },
    });

    conversion.for('dataDowncast').elementToElement({
      model: 'footNoteTitle',
      view: createTitleView,
    });

    conversion.for('editingDowncast').elementToElement({
      model: 'footNoteTitle',
      view: (modelElement, conversionApi) => {
        const widgetElement = createTitleView(modelElement, conversionApi);
        return toWidget(widgetElement, conversionApi.writer);
      },
    });

    //#endregion

    //#region Footnote List Conversion

    conversion.for('upcast').elementToElement({
      model: (viewElement, { writer }) => {
        const id = viewElement.getAttribute('data-id');
        return writer.createElement('footNoteList', { 'data-id': id });
      },
      view: {
        name: 'section',
        classes: 'footnote-list',
      },
    });

    conversion.for('dataDowncast').elementToElement({
      model: 'footNoteList',
      view: (element, { writer }) => {
        return writer.createContainerElement('section', {
          class: 'footnote-list',
          'data-id': element.getAttribute('data-id'),
        });
      },
    });

    conversion.for('editingDowncast').elementToElement({
      model: 'footNoteList',
      view: (modelElement, { writer }) => {
        // Note: You use a more specialized createEditableElement() method here.
        const section = writer.createEditableElement('section', {
          class: 'footnote-list',
          'data-id': modelElement.getAttribute('data-id'),
        });

        return toWidgetEditable(section, writer);
      },
    });

    //#endregion

    //#region Footnote Item Conversion

    const createItemView = (
      modelElement: any,
      { writer }: DowncastConversionApi
    ) => {
      const id = modelElement.getAttribute('id');
      const itemView = writer.createContainerElement('span', {
        class: 'footnote-item',
      });

      const innerText = writer.createText(`${id}. `);
      writer.insert(writer.createPositionAt(itemView, 0), innerText);

      return itemView;
    };

    conversion.for('upcast').elementToElement({
      view: {
        name: 'span',
        classes: 'footnote-item',
      },
      model: (viewElement, { writer }) => {
        // Extract the "name" from "{name}".
        const id = (viewElement.getChild(0) as unknown as Text).data.slice(
          0,
          -2
        );

        return writer.createElement('footNoteItem', { id });
      },
    });

    conversion.for('dataDowncast').elementToElement({
      model: 'footNoteItem',
      view: createItemView,
    });

    conversion.for('editingDowncast').elementToElement({
      model: 'footNoteItem',
      view: (modelElement, conversionApi) => {
        // Note: You use a more specialized createEditableElement() method here.
        const section = createItemView(modelElement, conversionApi);
        return toWidget(section, conversionApi.writer);
      },
    });

    //#endregion

    //#region Footnote Inline Conversion

    const createPlaceholderView = (
      modelElement: any,
      { writer }: DowncastConversionApi
    ) => {
      const id = modelElement.getAttribute('id');

      const placeholderView = writer.createContainerElement('span', {
        class: 'noteholder',
        'data-footnote-id': id,
      });

      // Insert the placeholder name (as a text).
      const innerText = writer.createText(`[${id}]`);
      const sup = writer.createContainerElement('sup');
      writer.insert(writer.createPositionAt(sup, 0), innerText);
      writer.insert(writer.createPositionAt(placeholderView, 0), sup);

      return placeholderView;
    };

    conversion.for('upcast').elementToElement({
      view: {
        name: 'span',
        classes: ['noteholder'],
      },
      model: (viewElement, { writer }) => {
        // Extract the "id" from "[id]".
        let id = '0';
        const node = (viewElement.getChild(0) as ViewElement).getChild(
          0
        ) as ViewElement;
        if (node.is('$text') || node.is('$textProxy')) {
          id = node.data.slice(1, -1);
        }

        return writer.createElement('noteHolder', { id });
      },
    });

    conversion.for('editingDowncast').elementToElement({
      model: 'noteHolder',
      view: (modelElement, conversionApi) => {
        const widgetElement = createPlaceholderView(
          modelElement,
          conversionApi
        );

        // Enable widget handling on a placeholder element inside the editing view.
        return toWidget(widgetElement, conversionApi.writer);
      },
    });

    conversion.for('dataDowncast').elementToElement({
      model: 'noteHolder',
      view: createPlaceholderView,
    });

    //#endregion

    conversion.for('editingDowncast').add((dispatcher) => {
      dispatcher.on('attribute:id:footNoteItem', modelViewChangeItem, {
        priority: 'high',
      });
      dispatcher.on('attribute:id:noteHolder', modelViewChangeHolder, {
        priority: 'high',
      });

      // Update the data-id attribute on html section element (footNoteList)
      dispatcher.on('attribute:data-id:footNoteList', modelViewChangeList, {
        priority: 'high',
      });
    });
  }

  private deleteModify(): void {
    const editor = this.editor;
    const viewDocument = editor.editing.view.document;

    this.listenTo(
      viewDocument,
      'delete',
      (evt, data) => {
        const doc = editor.model.document;
        const deleteElement = doc.selection.getSelectedElement();
        const positionParent = doc.selection.getLastPosition()?.parent;

        if (deleteElement !== null && deleteElement.name === 'footNote') {
          removeHolder(editor, 0);
        }

        if (positionParent?.name === '$root') {
          return;
        }

        if (positionParent?.name !== 'footNoteList') {
          return;
        }

        if (
          positionParent.maxOffset > 1 &&
          doc.selection.anchor !== null &&
          doc.selection.anchor.offset <= 1
        ) {
          data.preventDefault();
          evt.stop();
        }

        if (
          (doc.selection.anchor !== null &&
            doc.selection.anchor.offset === 0 &&
            positionParent.maxOffset === 1) ||
          (positionParent.maxOffset === doc.selection.anchor?.offset &&
            doc.selection.focus?.offset === 0)
        ) {
          const footNoteList = positionParent as Element;
          const index = footNoteList.index ?? 0;
          const footNote = footNoteList.parent;

          if (!footNote) {
            return;
          }

          for (let i = index + 1; i < footNote.maxOffset; i++) {
            editor.model.change((writer) => {
              writer.setAttribute('data-id', i, footNote.getChild(i));
              writer.setAttribute(
                'id',
                i,
                (footNote.getChild(i) as any).getChild(0) as any
              );
            });
          }

          removeHolder(editor, index + 1);
          editor.model.change((writer) => {
            if (index === 0) {
              if (footNote.childCount === 1) {
                if (footNote.previousSibling === null) {
                  const p = writer.createElement('paragraph');
                  this.editor.model.insertContent(
                    p,
                    writer.createPositionAt(doc.getRoot()!, 0)
                  );
                  writer.setSelection(p, 'end');
                } else {
                  writer.setSelection(footNote.previousSibling, 'end');
                }

                if (footNote) {
                  writer.remove(footNote as Item);
                }
              } else if (footNoteList.nextSibling) {
                writer.setSelection(footNoteList.nextSibling, 'end');
              }
            } else if (footNoteList.previousSibling) {
              writer.setSelection(footNoteList.previousSibling!, 'end');
            }

            writer.remove(footNoteList);
          });

          data.preventDefault();
          evt.stop();
        }
      },
      { priority: 'high' }
    );
  }
}

export function isFootNote(element: Element): boolean {
  return element.is('element', 'footNote');
}

export function modelViewChangeItem(
  event: any,
  data: any,
  conversionApi: DowncastConversionApi
): void {
  if (
    !conversionApi.consumable.consume(data.item, 'attribute:id:footNoteItem')
  ) {
    return;
  }

  if (data.attributeOldValue === null) {
    return;
  }

  const itemView = conversionApi.mapper.toViewElement(data.item);
  if (itemView) {
    const viewWriter = conversionApi.writer;

    viewWriter.remove(itemView.getChild(0) as ViewElement);

    const innerText = viewWriter.createText(`${data.attributeNewValue}. `);
    viewWriter.insert(viewWriter.createPositionAt(itemView, 0), innerText);
  }
}

export function modelViewChangeHolder(
  event: any,
  data: any,
  conversionApi: DowncastConversionApi
): void {
  if (!conversionApi.consumable.consume(data.item, 'attribute:id:noteHolder')) {
    return;
  }

  if (data.attributeOldValue === null) {
    return;
  }

  const itemView = conversionApi.mapper.toViewElement(data.item);
  if (itemView) {
    itemView._setAttribute('data-footnote-id', data.attributeNewValue);
    const viewWriter = conversionApi.writer;
    viewWriter.remove(
      (itemView.getChild(0) as ViewElement).getChild(0) as ViewElement
    );

    const innerText = viewWriter.createText(`[${data.attributeNewValue}]`);
    viewWriter.insert(
      viewWriter.createPositionAt(itemView.getChild(0) as ViewElement, 0),
      innerText
    );
  }
}

export function modelViewChangeList(
  event: any,
  data: any,
  conversionApi: DowncastConversionApi
): void {
  if (
    !conversionApi.consumable.consume(
      data.item,
      'attribute:data-id:footNoteList'
    )
  ) {
    return;
  }

  if (data.attributeOldValue === null) {
    return;
  }

  const itemView = conversionApi.mapper.toViewElement(data.item);
  if (itemView) {
    itemView._setAttribute('data-id', data.attributeNewValue);
  }
}

export function removeHolder(editor: Editor, index: number): void {
  const removeList = [];
  const range = editor.model.createRangeIn(
    editor.model.document.getRoot() as Element
  );
  for (const value of range.getWalker({ ignoreElementEnd: true })) {
    if ((value.item as Element).name === 'noteHolder') {
      if (
        parseInt(value.item.getAttribute('id') as string) === index ||
        index === 0
      ) {
        removeList.push(value.item);
      } else if (parseInt(value.item.getAttribute('id') as string) > index) {
        editor.model.change((writer) => {
          writer.setAttribute(
            'id',
            parseInt(value.item.getAttribute('id') as string) - 1,
            value.item
          );
        });
      }
    }
  }

  for (const item of removeList) {
    editor.model.change((writer) => {
      writer.remove(item);
    });
  }
}
