import {
  ButtonView,
  ClassicEditor,
  DowncastWriter,
  Locale,
  Plugin,
  ViewRootEditableElement,
} from 'ckeditor5';

import { CLOSE_ON_CLICK, CLOSE_ON_ESCAPE } from './constant';
import { fullscreenIcons } from './theme/icons';

// import Maximize from './theme/icons/maximize.svg'; // Not working in angular, used constant instead.

export default class DVFullScreen extends Plugin {
  isFullScreen: boolean;
  styles: any;

  public static get pluginName() {
    return 'DVFullScreen' as const;
  }

  constructor(editor: ClassicEditor) {
    super(editor);
    this.set('isFullScreen', false);
    this.styles = {};
  }

  init(): void {
    const editor = this.editor;
    const t = editor.t;
    const rootElement = editor.editing.view.document.getRoot();

    // Set the default configuration
    editor.config.define(CLOSE_ON_ESCAPE, true);
    editor.config.define(CLOSE_ON_CLICK, true);

    const maximize = () => {
      const wrapperElement = editor.ui.view.element;
      // Make the wrapping div focusable so it can capture key presses
      wrapperElement.setAttribute('tabindex', '0');
      // Apply styles
      wrapperElement.classList.add('ck-plugin-full-screen');
      this.styles = {
        height: rootElement.getStyle('height'),
        'overflow-y': rootElement.getStyle('overflow-y'),
      };
      // Dynamic style changes of the ckeditor root element should be done with a writer
      editor.editing.view.change((writer) => {
        writer.setStyle(
          { height: '100%', 'overflow-y': 'scroll' },
          rootElement
        );
      });
    };

    const minimize = () => {
      const wrapperElement = editor.ui.view.element;
      wrapperElement.removeAttribute('tabindex');
      wrapperElement.classList.remove('ck-plugin-full-screen');
      wrapperElement.classList.remove('full');
      editor.editing.view.change((writer) => {
        this._restoreStyles(writer, rootElement);
      });
    };

    const componentCreator = (locale: Locale) => {
      const wrapperElement = editor.ui.view.element;
      const button = new ButtonView();
      button.set({
        label: t('Full screen'),
        icon: fullscreenIcons.Maximize,
        tooltip: true,
      });

      // Make the toolbar button appear clicked when full screen is active
      button.bind('isOn').to(this, 'isFullScreen');

      const closeOnEscape = editor.config.get(CLOSE_ON_ESCAPE);
      const closeOnClick = editor.config.get(CLOSE_ON_CLICK);

      // Close on escape
      const onKeyDown = (e) => {
        if (e.key === 'Escape' && this.isFullScreen) {
          button.fire('execute');
          e.stopPropagation();
        }
      };

      // Close on background click
      const onClick = (e) => {
        if (e.target === e.currentTarget && this.isFullScreen) {
          button.fire('execute');
          e.stopPropagation();
        }
      };

      button.on('execute', () => {
        if (!this.isFullScreen) {
          let modal = document.getElementsByClassName('modal-dialog');
          let waitForModalStyleUpdate = false;
          if (modal.length) {
            waitForModalStyleUpdate = true;
            (modal[0] as any).style.setProperty(
              'transform',
              'none',
              'important'
            );
            wrapperElement.style.opacity = '0.4';
          }

          closeOnEscape &&
            wrapperElement.addEventListener('keydown', onKeyDown);
          closeOnClick && wrapperElement.addEventListener('click', onClick);
          waitForModalStyleUpdate
            ? setTimeout(() => {
                maximize();
                wrapperElement.style.opacity = '1';
              }, 500)
            : maximize();
        } else {
          closeOnEscape &&
            wrapperElement.removeEventListener('keydown', onKeyDown);
          closeOnClick && wrapperElement.removeEventListener('click', onClick);
          minimize();
        }

        this.isFullScreen = !this.isFullScreen;
        editor.editing.view.focus();
      });

      return button;
    };

    editor.ui.componentFactory.add('dvfullscreen', componentCreator);
  }

  _restoreStyle(
    writer: DowncastWriter,
    name: string,
    value: string,
    element: ViewRootEditableElement
  ) {
    value !== undefined
      ? writer.setStyle(name, value, element)
      : writer.removeStyle(name, element);
  }

  _restoreStyles(writer: DowncastWriter, element: ViewRootEditableElement) {
    this._restoreStyle(writer, 'height', this.styles.height, element);
    this._restoreStyle(
      writer,
      'overflow-y',
      this.styles['overflow-y'],
      element
    );
  }
}
