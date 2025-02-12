import {
  ButtonView,
  icons,
  ImageEditing,
  Locale,
  Plugin,
  UploadImageCommand,
} from 'ckeditor5';

export default class DVImageUploadUI extends Plugin {
  public static get requires() {
    return [ImageEditing] as const;
  }

  public static get pluginName() {
    return 'DVImageUploadUI' as const;
  }

  init(): void {
    const editor = this.editor;
    const t = editor.t; // Language translation.
    const callback = editor.config.get('dvUpload.callback');
    const componentCreator = (locale: Locale) => {
      const view = new ButtonView();
      const command: UploadImageCommand = editor.commands.get('uploadImage')!;

      view.label = t('Upload image');
      view.icon = icons.imageUpload;
      view.tooltip = true;

      view.bind('isEnabled').to(command);
      view.on('execute', () => {
        if (!callback) {
          throw new Error('Image upload callback is not found.');
        }

        callback();
      });

      return view;
    };

    editor.ui.componentFactory.add('dvUploadImage', componentCreator);
  }
}
