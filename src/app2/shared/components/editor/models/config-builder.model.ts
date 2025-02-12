import {
  AccessibilityHelp,
  Alignment,
  AutoLink,
  Autosave,
  BalloonToolbar,
  BlockQuote,
  Bold,
  Clipboard,
  CloudServices,
  ColorOption,
  Essentials,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  GeneralHtmlSupport,
  Heading,
  HorizontalLine,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  Italic,
  Link,
  List,
  Mention,
  Paragraph,
  PasteFromOffice,
  SelectAll,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TextPartLanguage,
  Underline,
  Undo,
  RemoveFormat,
  type EditorConfig,
  ImageResize,
  Autoformat,
  IndentBlock,
} from 'ckeditor5';
import {
  Comments,
  CommentsRepository,
  PasteFromOfficeEnhanced,
  // PresenceList,
  // RealTimeCollaborativeComments,
  // RealTimeCollaborativeEditing,
  // RealTimeCollaborativeRevisionHistory,
  // RealTimeCollaborativeTrackChanges,
  // RevisionHistory,
  TrackChanges,
  TrackChangesData,
  WideSidebar,
} from 'ckeditor5-premium-features';

import { LICENSE_KEY } from './editor.constant';
import {
  CommentsIntegration,
  DVFootNote,
  DVFullScreen,
  DVImageUploadPlugin,
  DVImageUploadUI,
  DVMention,
  TrackChangesIntegration,
  UsersIntegration,
  AIwritingAssistant,
  DVCommentUI,
  DVUtils,
  DVEditorPlaceholderReset,
} from '../plugins';

class ToolbarItemCategories {
  static readonly Styles = 'Styles';
  static readonly Fonts = 'Fonts';
  static readonly Insert = 'Insert';

  static getIcon(category: string): string {
    switch (category) {
      case this.Styles:
        return 'bold';
      case this.Fonts:
        return 'text';
      case this.Insert:
        return 'plus';
      default:
        return 'threeVerticalDots';
    }
  }
}

export class ConfigBuilder {
  private _config: EditorConfig;
  private _toolbarItemCategoryMap: Map<string, string> = new Map<
    string,
    string
  >([
    ['bold', ToolbarItemCategories.Styles],
    ['italic', ToolbarItemCategories.Styles],
    ['underline', ToolbarItemCategories.Styles],
    ['strikethrough', ToolbarItemCategories.Styles],
    ['subscript', ToolbarItemCategories.Styles],
    ['superscript', ToolbarItemCategories.Styles],

    ['heading', ToolbarItemCategories.Fonts],
    ['fontSize', ToolbarItemCategories.Fonts],
    ['fontFamily', ToolbarItemCategories.Fonts],
    ['fontColor', ToolbarItemCategories.Fonts],
    ['fontBackgroundColor', ToolbarItemCategories.Fonts],

    ['bulletedList', ToolbarItemCategories.Insert],
    ['numberedList', ToolbarItemCategories.Insert],
    ['horizontalLine', ToolbarItemCategories.Insert],
    ['link', ToolbarItemCategories.Insert],
    ['dvUploadImage', ToolbarItemCategories.Insert],
    ['insertTable', ToolbarItemCategories.Insert],
    ['blockQuote', ToolbarItemCategories.Insert],
    ['dvFootNote', ToolbarItemCategories.Insert],
  ]);

  constructor(initialData?: string) {
    this._config = {};
    this._config.licenseKey = LICENSE_KEY;
    this._config.placeholder = 'Type or paste your content here!';
    this._config.initialData = initialData ?? '';
    this._config.removePlugins = [];

    // cloudServices: {
    //   tokenUrl: CLOUD_SERVICES_TOKEN_URL,
    //   webSocketUrl: CLOUD_SERVICES_WEBSOCKET_URL
    // },
    // collaboration: {
    //   channelId: UNIQUE_CHANNEL_PER_DOCUMENT
    // },
  }

  addToolbar(
    literVersion,
    isDoubleToolbar = false,
    isReadonly: boolean
  ): ConfigBuilder {
    this._config.toolbar = {
      items: !literVersion
        ? [
            !isReadonly && 'AIwritingAssistant',
            !isReadonly && '|',
            'undo',
            'redo',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'subscript',
            'superscript',
            '|',
            'heading',
            'fontSize',
            'fontFamily',
            'fontColor',
            'fontBackgroundColor',
            '|',
            'alignment',
            'bulletedList',
            'numberedList',
            'outdent',
            'indent',
            'horizontalLine',
            '|',
            'link',
            'dvUploadImage',
            '|',
            'insertTable',
            '|',
            // 'revisionHistory', // Not integrated
            'trackChanges',
            // 'comment',
            'dvComment',
            // 'commentsArchive', // Will open from side-panel
            '|',
            'blockQuote',
            'dvFootNote',
            '|',
            'selectAll',
            '|',
            'removeFormat',
            '|',
            'dvfullscreen',
            'accessibilityHelp',
          ].filter((x) => x)
        : [
            'undo',
            'redo',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'subscript',
            'superscript',
            '|',
            'heading',
            'fontSize',
            'fontColor',
            'fontBackgroundColor',
            '|',
            'alignment',
            'bulletedList',
            'numberedList',
            'horizontalLine',
            '|',
            'link',
            'dvUploadImage',
            '|',
            'dvFootNote',
            '|',
            'removeFormat',
            '|',
            'dvfullscreen',
          ],
      removeItems: [],
      shouldNotGroupWhenFull: isDoubleToolbar,
    };

    return this;
  }

  addCustomToolBar(allToolBar: Array<string>): ConfigBuilder {
    if (allToolBar?.length)
      this._config.toolbar = {
        ...this._config.toolbar,
        items: allToolBar,
      };
    return this;
  }

  groupToolbarItems(): ConfigBuilder {
    const toolbarItems = (this._config.toolbar as any)?.items;
    const newToolbarItems = [];

    // Return if there are no items.
    if (!toolbarItems) {
      return this;
    }

    // Group items (if mapping is present), else add it in place.
    for (const toolbarItem of toolbarItems) {
      if (toolbarItem === '|' || toolbarItem === '-') {
        newToolbarItems.push(toolbarItem);
      } else if (this._toolbarItemCategoryMap.has(toolbarItem)) {
        const groupName = this._toolbarItemCategoryMap.get(toolbarItem);
        const existingGroup = newToolbarItems.find(
          (toolbarItem) =>
            typeof toolbarItem === 'object' && toolbarItem.label === groupName
        );

        if (existingGroup) {
          existingGroup.items.push(toolbarItem);
        } else {
          newToolbarItems.push(
            '|',
            {
              label: groupName,
              icon: ToolbarItemCategories.getIcon(groupName),
              items: [toolbarItem],
            },
            '|'
          );
        }
      } else {
        newToolbarItems.push(toolbarItem);
      }
    }

    // Remove continous '|', if any.
    for (let idx = 1; idx < newToolbarItems.length; idx++) {
      const previousToolbarItem = newToolbarItems[idx - 1];
      const currentToolbarItem = newToolbarItems[idx];

      if (
        previousToolbarItem === '|' &&
        previousToolbarItem === currentToolbarItem
      ) {
        newToolbarItems.splice(idx, 1);
        idx--;
      }
    }

    (this._config.toolbar as any).items = newToolbarItems;
    return this;
  }

  addPlaceholder(placeholder: string): ConfigBuilder {
    if (placeholder) this._config.placeholder = placeholder;
    return this;
  }

  addPlugins(literVersion: boolean, isReadonly: boolean): ConfigBuilder {
    this._config.plugins = literVersion
      ? [
          Alignment,
          AutoLink,
          Autoformat,
          Autosave,
          BalloonToolbar,
          Bold,
          Clipboard,
          Essentials,
          FontColor,
          FontFamily,
          FontSize,
          GeneralHtmlSupport,
          Heading,
          HorizontalLine,
          Image,
          ImageCaption,
          ImageStyle,
          ImageResize,
          ImageToolbar,
          ImageUpload,
          Indent,
          IndentBlock,
          Italic,
          Link,
          List,
          Mention,
          Paragraph,
          PasteFromOffice,
          PasteFromOfficeEnhanced,
          RemoveFormat,
          Subscript,
          Superscript,
          Strikethrough,
          Underline,
          Undo,
          FontBackgroundColor,
        ]
      : [
          AccessibilityHelp,
          Alignment,
          AutoLink,
          Autoformat,
          Autosave,
          BalloonToolbar,
          BlockQuote,
          Bold,
          Clipboard,
          CloudServices,
          Comments,
          Essentials,
          FontBackgroundColor,
          FontColor,
          FontFamily,
          FontSize,
          GeneralHtmlSupport,
          Heading,
          HorizontalLine,
          Image,
          ImageCaption,
          ImageResize,
          ImageStyle,
          ImageToolbar,
          ImageUpload,
          Indent,
          IndentBlock,
          Italic,
          Link,
          List,
          Mention,
          Paragraph,
          PasteFromOffice,
          PasteFromOfficeEnhanced,
          // PresenceList,
          // RealTimeCollaborativeComments,
          // RealTimeCollaborativeEditing,
          // RealTimeCollaborativeRevisionHistory,
          // RealTimeCollaborativeTrackChanges,
          // RevisionHistory,
          RemoveFormat,
          SelectAll,
          Strikethrough,
          Subscript,
          Superscript,
          Table,
          TableCaption,
          TableCellProperties,
          TableColumnResize,
          TableProperties,
          TableToolbar,
          TextPartLanguage,
          TrackChanges,
          TrackChangesData,
          Underline,
          Undo,
        ];

    return this;
  }

  addExtraPlugins(literVersion, isReadonly: boolean): ConfigBuilder {
    this._config.extraPlugins = [
      !literVersion && UsersIntegration,
      !literVersion && CommentsIntegration,
      DVCommentUI,
      DVMention,
      DVImageUploadUI,
      DVImageUploadPlugin,
      DVFullScreen,
      DVFootNote,
      !literVersion && TrackChangesIntegration,
      !literVersion && !isReadonly && AIwritingAssistant,
      DVUtils,
      DVEditorPlaceholderReset,
    ].filter((x) => x);

    return this;
  }

  addBalloonToolbar(isReadonly: boolean): ConfigBuilder {
    this._config.balloonToolbar = {
      items: [
        !isReadonly && 'AIwritingAssistant',
        !isReadonly && '|',
        // 'comment',
        'dvComment',
        '|',
        'bold',
        'italic',
        '|',
        'removeFormat',
        '|',
        'link',
        '|',
        'bulletedList',
        'numberedList',
      ].filter((x) => x),
      removeItems: [],
    };

    return this;
  }

  addComments(): ConfigBuilder {
    this._config.comments = {
      editorConfig: {
        extraPlugins: [Bold, Italic, List, Mention, DVMention],
        mention: {
          feeds: [
            {
              marker: '@',
              feed: [
                /* See: https://ckeditor.com/docs/ckeditor5/latest/features/mentions.html#comments-with-mentions */
              ],
              minimumCharacters: 0,
              dropdownLimit: 999999,
            },
          ],
        },
      },
    };

    return this;
  }

  addFontFamily(): ConfigBuilder {
    this._config.fontFamily = {
      options: [
        'default',
        'Arial',
        'Courier New',
        'Georgia',
        'Lucida Sans Unicode',
        'Tahoma',
        'Times New Roman',
        'Trebuchet MS',
        'Verdana',
      ],

      // Allow all font sizes from Microsoft Office documents
      // including those that are unknown to CKEditor.
      supportAllValues: true,
    };

    return this;
  }

  addFontSize(): ConfigBuilder {
    this._config.fontSize = {
      options: [
        8,
        9,
        10,
        11,
        12,
        13,
        'default',
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
      ],

      // Allow all font sizes from Microsoft Office documents
      // including those that are unknown to CKEditor.
      supportAllValues: true,
    };

    return this;
  }

  addFontColors(): ConfigBuilder {
    this._config.fontColor = {
      colors: this.getColors(),
      colorPicker: {
        // Use 'hex' format for output instead of 'hsl'.
        format: 'hex',
      },
    };

    this._config.fontBackgroundColor = {
      colors: this.getColors(),
      colorPicker: {
        format: 'hex',
      },
    };

    return this;
  }

  addHeading(): ConfigBuilder {
    this._config.heading = {
      options: [
        {
          model: 'paragraph',
          title: 'Paragraph',
          class: 'ck-heading_paragraph',
        },
        {
          model: 'heading1',
          view: 'h1',
          title: 'Heading 1',
          class: 'ck-heading_heading1',
        },
        {
          model: 'heading2',
          view: 'h2',
          title: 'Heading 2',
          class: 'ck-heading_heading2',
        },
        {
          model: 'heading3',
          view: 'h3',
          title: 'Heading 3',
          class: 'ck-heading_heading3',
        },
        {
          model: 'heading4',
          view: 'h4',
          title: 'Heading 4',
          class: 'ck-heading_heading4',
        },
        {
          model: 'heading5',
          view: 'h5',
          title: 'Heading 5',
          class: 'ck-heading_heading5',
        },
        {
          model: 'heading6',
          view: 'h6',
          title: 'Heading 6',
          class: 'ck-heading_heading6',
        },
      ],
    };

    return this;
  }

  addLink(): ConfigBuilder {
    this._config.link = {
      addTargetToExternalLinks: true,
      defaultProtocol: 'https://',
      decorators: {
        isDownloadable: {
          // added link config to not show downloadable option/toggle
          mode: 'automatic',
          callback: () => false,
        },
      },
    };

    return this;
  }

  addBlockIndent(): ConfigBuilder {
    this._config.indentBlock = {
      offset: 1,
      unit: 'em',
    };

    return this;
  }

  addImageToolbar(): ConfigBuilder {
    this._config.image = {
      resizeUnit: '%',
      resizeOptions: [
        {
          name: 'resizeImage:original',
          value: null,
        },
        {
          name: 'resizeImage:75',
          value: '75',
        },
        {
          name: 'resizeImage:50',
          value: '50',
        },
        {
          name: 'resizeImage:25',
          value: '25',
        },
      ],
      toolbar: [
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side',
        '|',
        'toggleImageCaption',
        'imageTextAlternative',
        '|',
        'resizeImage',
      ],
    };

    return this;
  }

  addMention(): ConfigBuilder {
    this._config.mention = {
      feeds: [
        {
          marker: '@',
          feed: [
            /* See: https://ckeditor.com/docs/ckeditor5/latest/features/mentions.html */
          ],
          minimumCharacters: 0,
          dropdownLimit: 999999,
        },
      ],
    };

    return this;
  }

  addPresenceList(container: HTMLElement): ConfigBuilder {
    this._config.presenceList = {
      container: container,
    };

    return this;
  }

  addRevisionHistory(
    editorContainer: HTMLElement,
    editorRevisionHistory: HTMLElement,
    editorRevisionHistoryEditor: HTMLElement,
    editorRevisionHistorySidebar: HTMLElement
  ): ConfigBuilder {
    this._config.revisionHistory = {
      editorContainer: editorContainer,
      viewerContainer: editorRevisionHistory,
      viewerEditorElement: editorRevisionHistoryEditor,
      viewerSidebarContainer: editorRevisionHistorySidebar,
      resumeUnsavedRevision: true,
    };

    return this;
  }

  addSidebar(container: HTMLElement): ConfigBuilder {
    this._config.sidebar = {
      container: container,
    };

    return this;
  }

  addTable(): ConfigBuilder {
    this._config.table = {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells',
        'tableProperties',
        'tableCellProperties',
      ],
      // The default styles for tables in the editor.
      // They should be synchronized with the content styles.
      tableProperties: {
        defaultProperties: {
          borderStyle: 'double',
          borderColor: 'hsl(0, 0%, 70%)',
          borderWidth: '1px',
          width: '100%',
        },
      },
      // The default styles for table cells in the editor.
      // They should be synchronized with the content styles.
      tableCellProperties: {
        defaultProperties: {
          horizontalAlignment: 'center',
          verticalAlignment: 'middle',
          padding: '10px',
        },
      },
    };

    return this;
  }

  addGeneralHTMLSupport(): ConfigBuilder {
    // Configuration of the GeneralHtmlSupport plugin to allow extra content into the editor.
    // This configuration will preserve styles and formatting normally unsupported by core editor features.
    this._config.htmlSupport = {
      allow: [
        {
          name: /.*/,
          attributes: true,
          classes: true,
          styles: true,
        },
      ],
    };

    return this;
  }

  //#region Outside editor comment config

  addOutsideEditorPlugins(): ConfigBuilder {
    this._config.plugins = [
      CloudServices,
      CommentsRepository,
      WideSidebar,
      CommentsIntegration,
      UsersIntegration,
      DVUtils,
    ];

    return this;
  }

  addOutsideEditorSidebar(container: HTMLElement): ConfigBuilder {
    this._config.sidebar = {
      container,
    };

    return this;
  }

  addOutsideComments(): ConfigBuilder {
    return this.addComments();
  }

  //#endregion

  removeToolbarItem(toolbarItem: string): ConfigBuilder;
  removeToolbarItem(toolbarItems: Array<string>): ConfigBuilder;
  removeToolbarItem(args: string | Array<string>): ConfigBuilder {
    if (Array.isArray(args)) {
      (this._config.toolbar as any).removeItems.push(...args);
      (this._config.balloonToolbar as any).removeItems.push(...args);
    } else {
      (this._config.toolbar as any).removeItems.push(args);
      (this._config.balloonToolbar as any).removeItems.push(args);
    }

    return this;
  }

  removePlugin(pluginName: string): ConfigBuilder;
  removePlugin(pluginNames: Array<string>): ConfigBuilder;
  removePlugin(args: string | Array<string>): ConfigBuilder {
    if (Array.isArray(args)) {
      this._config.removePlugins.push(...args);
    } else {
      this._config.removePlugins.push(args);
    }

    return this;
  }

  getConfig(): EditorConfig {
    return this._config;
  }

  /**
   * Gets the default list of color options converted into hex color code.
   * @returns The list of color options.
   */
  private getColors(): Array<ColorOption> {
    return [
      {
        color: '#000000',
        label: 'Black',
      },
      {
        color: '#4d4d4d',
        label: 'Dim grey',
      },
      {
        color: '#999999',
        label: 'Grey',
      },
      {
        color: '#e6e6e6',
        label: 'Light grey',
      },
      {
        color: '#ffffff',
        label: 'White',
        hasBorder: true,
      },
      {
        color: '#e64c4c',
        label: 'Red',
      },
      {
        color: '#e6994c',
        label: 'Orange',
      },
      {
        color: '#e6e64c',
        label: 'Yellow',
      },
      {
        color: '#99e64c',
        label: 'Light green',
      },
      {
        color: '#4ce64c',
        label: 'Green',
      },
      {
        color: '#4ce699',
        label: 'Aquamarine',
      },
      {
        color: '#4ce6e6',
        label: 'Turquoise',
      },
      {
        color: '#4c99e6',
        label: 'Light blue',
      },
      {
        color: '#4c4ce6',
        label: 'Blue',
      },
      {
        color: '#994ce6',
        label: 'Purple',
      },
    ];
  }
}
