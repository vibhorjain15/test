import { ButtonView, Locale, Plugin } from 'ckeditor5';
import { Comments } from 'ckeditor5-premium-features';

const AddCommentBtn: string = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M4 1.5h12A3.5 3.5 0 0 1 19.5 5v8l-.005.192a3.5 3.5 0 0 1-2.927 3.262l-.062.008v1.813a1.5 1.5 0 0 1-2.193 1.33l-.371-.193-.38-.212a13.452 13.452 0 0 1-3.271-2.63l-.062-.07H4A3.5 3.5 0 0 1 .5 13V5A3.5 3.5 0 0 1 4 1.5ZM4 3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6.924a11.917 11.917 0 0 0 3.71 3.081l.372.194v-3.268L14.962 15H16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4Z"/><path d="M9.75 5a.75.75 0 0 0-.75.75v2.5H6.5a.75.75 0 0 0 0 1.5H9v2.5a.75.75 0 0 0 1.5 0v-2.5H13a.75.75 0 0 0 0-1.5h-2.5v-2.5A.75.75 0 0 0 9.75 5Z"/></svg>`;

export default class DVCommentUI extends Plugin {
  public static get requires() {
    return [Comments] as const;
  }

  public static get pluginName() {
    return 'DVCommentUI' as const;
  }

  init(): void {
    const editor = this.editor;
    const t = editor.t;
    const componentCreator = (locale: Locale) => {
      const button = new ButtonView();
      button.set({
        label: t('Add comment'),
        icon: AddCommentBtn,
        tooltip: true,
      });

      // Enable/Disable add comment button based on actual comment button
      const command = editor.commands.get('addCommentThread')!;
      button.bind('isEnabled').to(command);

      const dvCommentUIConfig = editor.config.get('dvCommentUIConfig');
      const callbackMethod = dvCommentUIConfig && dvCommentUIConfig.callback;

      button.on('execute', () => {
        if (!callbackMethod) {
          throw new Error('Add comment callback not provided!');
        }

        callbackMethod();
      });

      return button;
    };

    editor.ui.componentFactory.add('dvComment', componentCreator);
  }
}
