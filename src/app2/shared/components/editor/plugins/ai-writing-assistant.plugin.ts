import {
  addListToDropdown,
  Collection,
  createDropdown,
  icons,
  ListDropdownButtonDefinition,
  ListDropdownItemDefinition,
  Locale,
  Plugin,
  ViewModel,
} from 'ckeditor5';
import {
  AISVG,
  getEditableResponsePrompts,
  getProperTooltip,
} from '../../ai-text-generator/ai-dropdown.constants';

declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {
    ai_config?: any;
  }
}

export class AIwritingAssistant extends Plugin {
  public static get pluginName() {
    return 'AIwritingAssistant' as const;
  }

  init(): void {
    const editor = this.editor;
    const callback: any = editor.config.get('ai_config.callback');
    const wordLimit = editor.config.get('wordLimit');
    const isEnabled = editor.config.get('ai_config.is_enabled');
    const tooltip = editor.config.get('ai_config.tooltip');
    let initialized = 0; // variable to check if the ai icon is being added to main toolbar or in hover over toolbar
    editor.ui.componentFactory.add('AIwritingAssistant', (locale: Locale) => {
      initialized++;
      const dropdownView = createDropdown(locale);
      const AIicon = AISVG(!isEnabled, isEnabled, initialized > 1, 123);
      dropdownView.buttonView.set({
        icon: AIicon,
        isEnabled: isEnabled,
        tooltip: isEnabled
          ? `Prompts will ${
              initialized > 1
                ? "only be applied on the selected text and not consider the question's context"
                : "be applied on the response and will consider the question's context"
            }`
          : tooltip,
        class: isEnabled ? '' : 'ai-disabled',
      });

      // Populate the list in the dropdown with items.
      addListToDropdown(dropdownView, getDropdownItemsDefinitions(wordLimit));
      dropdownView.on('execute', (eventInfo) => {
        const { Aiobject } = eventInfo.source as any;
        callback(Aiobject);
      });

      return dropdownView;
    });
  }
}
function getDropdownItemsDefinitions(
  wordLimit
): Collection<ListDropdownItemDefinition> {
  const itemDefinitions = new Collection<ListDropdownItemDefinition>();

  getEditableResponsePrompts(wordLimit).forEach((item) => {
    if (!item.disabled) {
      if (!item.children) {
        itemDefinitions.add({
          type: 'button',
          model: new ViewModel({
            label: item.label,
            withText: true,
            Aiobject: item,
          }),
        });
      } else {
        const nestedDefinitions =
          new Collection<ListDropdownButtonDefinition>();

        item.children?.map((childItem) => {
          if (!childItem.disabled)
            nestedDefinitions.add({
              type: 'button',
              model: new ViewModel({
                label: childItem.label,
                withText: true,
                Aiobject: childItem,
              }),
            });
        });

        itemDefinitions.add({
          type: 'group',
          label: item.label,
          items: nestedDefinitions,
        });
      }
    }
  });

  return itemDefinitions;
}
