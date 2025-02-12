import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  NgZone,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { ImageDataService } from 'src/app2/services/ImageData/ImageDataService.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { AiPrompts } from '../../constants/constant';
import {
  AISVG,
  getEditableResponsePrompts,
} from '../ai-text-generator/ai-dropdown.constants';
import { TippyTooltipDirective } from '../../directives/tippy-tooltip.directive';
import tippy from 'tippy.js';
@Component({
  selector: 'app-tinymce-editor',
  templateUrl: './tinymce-editor.component.html',
  styleUrls: ['./tinymce-editor.component.css'],
})
export class TinymceEditorComponent implements OnInit {
  @Input() tinyMceInit;
  @Input() isMentions = false;
  @Input() mentionsList = [];
  @Input() isImageSupport = false;
  @Input() isDoubleToolbar = false;
  @Input() isFlite = false;
  @Input() isComments = false;
  @Input() isTrackingForFlite = true;
  @Input() value = '';
  @Input() instance;
  @Input() imageSelector = true;
  @Input() canEdit = true;
  @Input() enableAI = false;
  @Input() disabled = false;
  @Input() isReadOnly = false;
  @Input() focusOnInit = false; // Decided whether you want cursor on the tiny mce when initialized ( used in questionnaire comments as true )
  @Input() isLite = false; // Used to determine whether you want to enable the whole lite system or not
  @Input() triggerChangeManuallyOnPaste = false;
  @Input() wordLimit;
  @Input() freeUser?: boolean;
  @Input() id = ''; // For uniquely ref multiple tinymce in 1 document // id will be attach to textarea of editor
  @Output() onChange = new EventEmitter();
  @Output() onTrackChange = new EventEmitter();
  @ViewChild('tinyMceComponent', { static: false }) componentRef: ElementRef;
  @ViewChild(TippyTooltipDirective) tooltip: TippyTooltipDirective;
  @Output() onAiButtonClick = new EventEmitter();

  team;
  editor;
  uploading_image: boolean;
  resultBlob: any;
  clickInsideComponent;
  firmPref: any;
  isLiteVersionEnabled: boolean; // Just to make sure that other tinymce dont get LITE
  constructor(
    private store: Store,
    private readonly utilService: UtilsService,
    private readonly ImageService: ImageDataService,
    private readonly customModalService: CustomModalService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.initializeTinyMce();
  }

  openQuestionnaireUploadModal(editor) {
    this.ngZone.run(() => {
      this.customModalService.invoke('questionnaire-upload-image', {
        initialState: {
          editor: editor,
        },
        closeInterceptor: () => {
          return new Promise<void>((resolve) => {
            resolve();
          });
        },
        class: 'modal-xl',
      });
    });
  }

  initializeTinyMce() {
    let that = this;
    this.firmPref = this.store.selectSnapshot(
      (state) => state.user.firmPreference
    );
    let tempLite = this.isLite;
    this.tinyMceInit = {
      setup: (editor) => {
        this.editor = editor;
        editor.on('FullscreenStateChanged', () => {
          let modal = document.getElementsByClassName('modal-dialog');
          if (modal.length) {
            (modal[0] as any).style.setProperty(
              'transform',
              'none',
              'important'
            );
          }
        });

        editor.on('SelectionChange', (editor) => {
          setTimeout(() => {
            this.addTooltips(true);
          }, 500);
        });

        this.focusOnInit &&
          editor.on('init', () => {
            setTimeout(function () {
              editor.focus();
              editor.selection.select(editor.getBody(), true);
              editor.selection.collapse(false);
            }, 100); // Delay to ensure the editor is fully ready
          });

        if (this.firmPref) {
          this.addAiButton(editor);
        }
      },
      invalid_elements: 'mark', // exclude mark tags as its not needed when user searches the content in qa/library and copies it and pastes it in as response
      images_upload_handler: (blobInfo, success, failure) => {
        this.uploadImages(blobInfo, success, failure);
      },

      render: (editor) => {
        this.openQuestionnaireUploadModal(editor);
      },
      menubar: false,
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv',
      browser_spellcheck: true,
      height: 250,
      custom_undo_redo_levels: 10,
      paste_data_images: false,
      paste_filter_drop: false,
      branding: false,
      resize: false,
      elementpath: false,
      statusbar: false,
      init_instance_callback: (editor) => {
        this.addTooltips();
      },
      image_dimensions: false,
      forced_root_block: '',
      toolbar_mode: 'sliding',
      hidden_btn_groups: [],
      table_toolbar: '',
      indent: false,
      content_css: 'assets/stylesheets/tiny_mce_custom.css',
      placeholder:
        'Start typing to leave a note. To mention and notify a team member, type @',
      suffix: '.min',
      plugins:
        'quickbars preview mentions lists hr link autolink image fullscreen powerpaste table footnotes dv_img_selector visualchars visualblocks wordcount',
      content_style: '.mymention{ color: var(--primary); }',
      contextmenu: false,
      base_url: '/tinymce',
      toolbar: `${
        this.enableAI ? 'customAiButton |' : ''
      } bold italic underline | alignleft aligncenter alignright alignjustify | superscript | forecolor backcolor | link ${
        this.imageSelector ? 'dv_img_selector' : ''
      } | table | bullist numlist | hr | undo redo | fullscreen | footnotes | visualchars visualblocks`,
      quickbars_selection_toolbar: `${
        this.enableAI ? 'customAiSelectedText |' : ''
      }`,
      // After URL resolution [convert_urls: false] won't convert it to relative url
      // Source: http://localhost:4200/#/app/content/documents
      // After resolution (without convert_urls: false): #/app/content/documents
      // After resolution (with    convert_urls: false): http://localhost:4200/#/app/content/documents
      // It happens only when the DOMAIN matches with the inserted URL DOMAIN.
      convert_urls: false,
      ...this.tinyMceInit,
    };
    if (this.isFlite) {
      const FLITE = (window as any).FLITE;
      this.tinyMceInit.plugins += ' flite';
      this.tinyMceInit.toolbar += ' | flite';
      let user = this.store.selectSnapshot((state) => state.user.currentUser);
      this.tinyMceInit.flite = {
        ...this.tinyMceInit.flite,
        isTracking: this.isTrackingForFlite,
        isVisible: true,
        userName: user.fullName,
        userId: user.id,
        commands: [
          FLITE.Commands.TOGGLE_TRACKING,
          FLITE.Commands.ACCEPT_ALL,
          FLITE.Commands.REJECT_ALL,
          FLITE.Commands.ACCEPT_ONE,
          FLITE.Commands.REJECT_ONE,
        ],
      };
      this.tinyMceInit = {
        ...this.tinyMceInit,
        setup: (editor) => {
          editor.on('flite:init', function (editor) {
            const flite = editor.flite;
            this.onTrackChange.emit({ flite, editor });
            this.editor = editor;
            // flite.acceptAll = () => {
            // };
            // do something with this instance of FLITE
          });
          // editor.on('flite:accept', (event) => {
          //   this.onTrackChange.emit('accept');
          // });
          // editor.on('flite:reject', (event) => {
          //   this.onTrackChange.emit('reject');
          // });
        },
      };
    }
    if (this.isComments) {
      this.tinyMceInit.plugins += ' tinycomments';
      this.tinyMceInit.toolbar += ' | addcomment showcomments';
    }
    if (this.isMentions) {
      if (this.mentionsList.length) {
        this.team = this.mentionsList;
      } else {
        this.team = this.store.selectSnapshot(
          (state) => state.user.teamMembers
        );
        this.team = this.team.map((val) => ({
          ...val,
          id: `${val.id}`,
          name: val.fullName,
        }));
      }
      this.tinyMceInit = {
        ...this.tinyMceInit,
        mentions_min_chars: 0,
        mentions_selector: '.mymention',
        mentions_fetch: (query, success) =>
          mentions_fetch(query, success, this.team),
        mentions_menu_complete: mentions_menu_complete,
      };
    }
    if (this.isImageSupport) {
      this.tinyMceInit = {
        ...this.tinyMceInit,
        automatic_uploads: false, // this will not work unless we also pass image_upload_url: '' with value.
      };
    }
    if (this.triggerChangeManuallyOnPaste) {
      this.tinyMceInit = {
        paste_preprocess: (editor, args) => {
          this.handleChange(args.content);
        },
        ...this.tinyMceInit,
      };
    }
    if (this.isDoubleToolbar) {
      this.tinyMceInit = {
        ...this.tinyMceInit,
        toolbar1: `bold italic underline | alignleft aligncenter alignright alignjustify | superscript | forecolor backcolor | footnotes`,
        toolbar2: ` table | bullist numlist | hr | undo redo | link`,
      };
      if (this.isFlite) {
        this.tinyMceInit.toolbar2 += ' | flite';
      }
      delete this.tinyMceInit.toolbar;
    }
    if (this.isComments) {
      this.tinyMceInit = {
        ...this.tinyMceInit,
        init_instance_callback: (editor) => {
          initInstanceCallback(editor, this.canEdit), this.addTooltips();
        },
        setup: (editor) => {
          this.editor = editor;
          if (this.firmPref) {
            this.addAiButton(editor);
          }
          editor.on('flite:init', (editor) => {
            const flite = editor.flite;
            this.onTrackChange.emit({ flite, editor: this.editor });

            // flite.acceptAll = () => {
            // };
            // do something with this instance of FLITE
          });
          setupCallback(editor);
        },
      };
    }
  }

  onAiButtonClicked(input) {
    this.onAiButtonClick.emit(input);
  }

  uploadImages(blobInfo, success, failure) {
    this.uploading_image = true;
    this.resultBlob = this.b64toBlob(blobInfo.base64());
    this.resultBlob.name = blobInfo.filename();
    const payload = new FormData();
    payload.append(
      'file',
      this.resultBlob,
      blobInfo.filename() + new Date().getTime() + '.png'
    );
    this.ImageService.uploadImageDirect(payload).subscribe(
      (response) => {
        success(response[0].blobUrl);
        this.uploading_image = false;
      },
      (error) => {
        this.uploading_image = false;
        failure(error);
      }
    );
  }

  b64toBlob(b64Data, contentType?, sliceSize?) {
    let blob,
      byteArray,
      byteArrays,
      byteCharacters,
      byteNumbers,
      i,
      offset,
      slice;
    if (!contentType) {
      contentType = '';
    }
    if (!sliceSize) {
      sliceSize = 512;
    }
    byteCharacters = atob(b64Data);
    byteArrays = [];
    offset = 0;
    while (offset < byteCharacters.length) {
      slice = byteCharacters.slice(offset, offset + sliceSize);
      byteNumbers = new Array(slice.length);
      i = 0;
      while (i < slice.length) {
        byteNumbers[i] = slice.charCodeAt(i);
        i++;
      }
      byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
      offset += sliceSize;
    }
    blob = new Blob(byteArrays, {
      type: contentType,
    });
    return blob;
  }

  handleChange(data) {
    this.onChange.emit(this.getProcessedData(data));
  }

  getSelectedText() {
    return this.editor?.selection?.getContent();
  }

  getText() {
    return this.editor.getContent();
  }

  getCommentIds() {
    const commentIds: string[] = [];
    if (this.editor?.contentDocument) {
      this.editor.contentDocument
        .querySelectorAll('[data-mce-annotation-uid]')
        .forEach((element) => {
          commentIds.push(
            element.attributes['data-mce-annotation-uid'].nodeValue
          );
        });
    }
    return commentIds;
  }

  addTooltips(selectedText = false) {
    const element = document.getElementById(
      (selectedText ? 'ai-partially' : 'ai-svg') + this.id
    );
    if (!element) return;
    const tooltip = !this.firmPref.enable_system_gen_ai
      ? 'Please reach out to us to enable the AI Assistant.'
      : !this.firmPref.enable_gen_ai
      ? 'Admins can enable the AI Assistant under Firm Settings > Firm Preferences > Control Workflow.'
      : `Prompts will ${
          selectedText
            ? "only be applied on the selected text and not consider the question's context"
            : "be applied on the response and will consider the question's context"
        }`;

    document
      .getElementById((selectedText ? 'ai-partially' : 'ai-svg') + this.id)
      .setAttribute('title', 'Your tooltip text here');

    tippy(
      document.getElementById(
        (selectedText ? 'ai-partially' : 'ai-svg') + this.id
      ),
      {
        content: tooltip,
      }
    );
  }

  addAiButton(editor) {
    // This AI icon will show up in editor's toolbar
    editor.ui.registry.addIcon(
      'Ai',
      AISVG(
        this.freeUser,
        this.firmPref.enable_gen_ai && this.firmPref.enable_system_gen_ai,
        false,
        this.id,
        true
      )
    );

    // Add another AI svg with different ID for showing when some text is selected in the editor
    editor.ui.registry.addIcon(
      'AI-SelectedText',
      AISVG(
        this.freeUser,
        this.firmPref.enable_gen_ai && this.firmPref.enable_system_gen_ai,
        true,
        this.id,
        true
      )
    );

    if (
      this.enableAI &&
      (!this.firmPref.enable_gen_ai || !this.firmPref.enable_system_gen_ai)
    ) {
      editor.ui.registry.addButton('customAiButton', {
        icon: 'Ai',
        onAction: () => null,
      });
    }
    if (
      this.enableAI &&
      this.firmPref.enable_gen_ai &&
      this.firmPref.enable_system_gen_ai
    ) {
      /* Menu items are recreated when the menu is closed and opened, so we need
           a variable to store the toggle menu item state. */

      editor.ui.registry.addMenuButton('customAiButton', {
        icon: 'Ai',
        fetch: (callback) => {
          let selectedContent = this.getSelectedText();
          let responseWordCount = selectedContent
            ? selectedContent?.split(' ')?.length
            : this.editor.getContent({ format: 'text' })?.split(' ')?.length;
          let items = getEditableResponsePrompts(
            this.wordLimit,
            responseWordCount
          ).map((item) => {
            if (!item.disabled) {
              if (!item.children) {
                return {
                  type: 'menuitem',
                  text: item.label,
                  onAction: () =>
                    this.onAiButtonClicked({
                      ...item,
                    }),
                };
              } else {
                return {
                  type: 'nestedmenuitem',
                  text: item.label,
                  getSubmenuItems: () =>
                    item.children?.map((childItem) => {
                      if (!childItem.disabled)
                        return {
                          type: 'menuitem',
                          text: childItem.label,
                          onAction: () =>
                            this.onAiButtonClicked({
                              ...childItem,
                            }),
                        };
                    }),
                };
              }
            }
          });
          let trimIndex = items.findIndex((x) => x.text === AiPrompts.Trim);
          let trim = items[trimIndex].getSubmenuItems();
          items[trimIndex].getSubmenuItems = () => trim.filter((obj) => obj);
          callback(items);
        },
      });

      editor.ui.registry.addMenuButton('customAiSelectedText', {
        icon: 'AI-SelectedText',
        fetch: (callback) => {
          let selectedContent = this.getSelectedText();
          let responseWordCount = selectedContent
            ? selectedContent?.split(' ')?.length
            : this.editor.getContent({ format: 'text' })?.split(' ')?.length;
          let items = getEditableResponsePrompts(
            this.wordLimit,
            responseWordCount
          ).map((item) => {
            if (!item.disabled) {
              if (!item.children) {
                return {
                  type: 'menuitem',
                  text: item.label,
                  onAction: () =>
                    this.onAiButtonClicked({
                      ...item,
                    }),
                };
              } else {
                return {
                  type: 'nestedmenuitem',
                  text: item.label,
                  getSubmenuItems: () =>
                    item.children?.map((childItem) => {
                      if (!childItem.disabled)
                        return {
                          type: 'menuitem',
                          text: childItem.label,
                          onAction: () =>
                            this.onAiButtonClicked({
                              ...childItem,
                            }),
                        };
                    }),
                };
              }
            }
          });
          let trimIndex = items.findIndex((x) => x.text === AiPrompts.Trim);
          let trim = items[trimIndex].getSubmenuItems();
          items[trimIndex].getSubmenuItems = () => trim.filter((obj) => obj);
          callback(items);
        },
      });
    }
  }

  /**
   * Gets the processed data.
   * @param htmlContent The `HTML` content to process.
   * @returns The processed string.
   */
  private getProcessedData(htmlContent: string): string {
    if (!this.utilService.hasImageInHTML(htmlContent)) {
      const textContent = this.utilService.extractTextFromHTML(htmlContent);
      if (!textContent.trim()) {
        return '';
      }
    }

    return htmlContent;
  }
}

let mentions_fetch = (query, success, teams) => {
  let users = [...teams];
  if (query.term) {
    users = users.filter((user) =>
      user.name.toLowerCase().includes(query.term.toLowerCase())
    );
    users = users.slice(0, 10);
  }
  success(users);
};

let mentions_menu_complete = function (editor, userInfo) {
  var span = editor.getDoc().createElement('span');
  span.className = 'mymention mention-tag-text';
  span.setAttribute('data-mention-id', userInfo.id);
  span.setAttribute('data-email', userInfo.userName);
  span.setAttribute('data-toggle', userInfo.name);
  span.setAttribute('title', userInfo.name);
  span.appendChild(editor.getDoc().createTextNode('@' + userInfo.name));
  return span;
};

let initInstanceCallback = function (editor, edit) {
  setTimeout(() => {
    editor.getBody().setAttribute('contenteditable', edit);
    editor
      .getBody()
      .querySelectorAll('a')
      .forEach((element) => {
        element.onclick = (event) => event.preventDefault();
      });
  });
};

let setupCallback = function (editor) {
  editor.on('SkinLoaded', () =>
    editor.execCommand('ToggleSidebar', false, 'showcomments')
  );
};
