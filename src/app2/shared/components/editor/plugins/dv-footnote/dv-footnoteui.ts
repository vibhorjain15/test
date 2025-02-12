import {
  addListToDropdown,
  createDropdown,
  icons,
  Document,
  Element,
  Locale,
  Plugin,
  Collection,
  ListDropdownItemDefinition,
  ViewModel,
} from 'ckeditor5';
import { DVInsertFootNote } from './utils';

export default class DVFootNoteUI extends Plugin {
  public static get pluginName() {
    return 'DVFootNoteUI' as const;
  }

  init(): void {
    const editor = this.editor;
    const t = editor.t;
    const document = editor.model.document;

    editor.ui.componentFactory.add('dvFootNote', (locale: Locale) => {
      const dropdownView = createDropdown(locale);

      // Populate the list in the dropdown with items.
      // addListToDropdown( dropdownView, getDropdownItemsDefinitions( placeholderNames ) );
      const command = editor.commands.get(DVInsertFootNote)!;

      dropdownView.buttonView.set({
        label: t('Footnote'),
        icon: icons.pilcrow,
        tooltip: true,
      });

      dropdownView.class = 'ck-code-block-dropdown';
      dropdownView.bind('isEnabled').to(command);
      dropdownView.on(
        'change:isOpen',
        (event, propertyName, newValue, oldValue) => {
          if (newValue) {
            addListToDropdown(
              dropdownView,
              getDropdownItemsDefinitions(document)
            );
          } else {
            dropdownView.listView?.items.clear();
          }
        }
      );

      // Execute the command when the dropdown item is clicked (executed).
      this.listenTo(dropdownView, 'execute', (event) => {
        editor.execute(DVInsertFootNote, {
          value: (event.source as any).commandParam,
        });
        editor.editing.view.focus();
      });

      return dropdownView;
    });
  }
}

function getDropdownItemsDefinitions(
  document: Document
): Collection<ListDropdownItemDefinition> {
  const itemDefinitions = new Collection<ListDropdownItemDefinition>();
  const defaultDefinition: ListDropdownItemDefinition = {
    type: 'button',
    model: new ViewModel({
      commandParam: 0,
      label: 'New Footnote',
      withText: true,
    }),
  };

  itemDefinitions.add(defaultDefinition);

  const lastNode = document
    .getRoot()!
    .getChild(document.getRoot()!.maxOffset - 1) as Element;
  if (lastNode && lastNode.name === 'footNote') {
    const footNote = lastNode;
    for (let i = 0; i < footNote.maxOffset; i++) {
      const definition: ListDropdownItemDefinition = {
        type: 'button',
        model: new ViewModel({
          commandParam: i + 1,
          label: `Insert Footnote ${i + 1}`,
          withText: true,
        }),
      };

      // Add the item definition to the collection.
      itemDefinitions.add(definition);
    }
  }

  return itemDefinitions;
}
