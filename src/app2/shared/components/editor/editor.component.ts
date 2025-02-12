import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
// import 'ckeditor5/ckeditor5.css';
// import 'ckeditor5-premium-features/ckeditor5-premium-features.css';

import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CKEditorError, ClassicEditor, type EditorConfig } from 'ckeditor5';
import {
  CommentsOnly,
  Permissions,
  TrackChanges,
} from 'ckeditor5-premium-features';

import { ConfigBuilder } from './models/config-builder.model';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ImageDataService } from 'src/app2/services/ImageData/ImageDataService.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { getProperTooltip } from '../ai-text-generator/ai-dropdown.constants';
import { READONLY_LOCK, Comments_Lock } from './models/editor.constant';
import { AddCommentData } from '../../models/ckeditor.model';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { CKEditorMessageService } from 'src/app2/services/ck-editor/ckeditor-message.service';
import { CKEditorInstanceManagerService } from 'src/app2/services/ck-editor/ckeditor-instance-manager.service';
import { ToastrService } from 'ngx-toastr';
import { CKEditorPermissionService } from 'src/app2/services/ck-editor/ckeditor-permission.service';
import { CKEditorUtilService } from 'src/app2/services/ck-editor/ckeditor-util.service';
import { ErrorHandlerService } from 'src/app2/services/error-handler.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
})
export class EditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input('ckEditorInitConfig') ckEditorInitConfig: any;
  @Input('value') value: string = '';
  @Input('isLite') isLite: boolean = false; // Used to determine whether you want to enable the whole lite system or not
  @Input('mentionsList') mentionsList: Array<any> = [];
  @Input() enableAI: boolean = false;
  @Input() id: string = null;
  @Input() uniqueQuestionId: string; // Used to manage editor instance for questionnaire only
  @Input() wordLimit: number = null;
  @Input() literVersion: boolean = false;
  @Input('isComments') isComments: boolean = false;
  @Input('isTrackChange') isTrackChange: boolean = false;
  @Input() isMentions: boolean = false;
  @Input() imageSelector: boolean = true;
  @Input() disabled: boolean = false;
  @Input() isDoubleToolbar: boolean = false; // control to wrap toolbar to next line without grouping
  @Input() isReadonly: boolean = false;
  @Input() isTrackChangeEnabled: boolean = false; // Deals with default behavior of track change button on editor init

  @Output('onChange') change = new EventEmitter<any>();
  @Output('onReviewCommentFocused') onReviewCommentFocused =
    new EventEmitter<void>();
  @Output('onAiButtonClick') onAiButtonClick = new EventEmitter<void>();
  @Output('onAddReviewComment')
  onAddReviewComment: EventEmitter<AddCommentData> =
    new EventEmitter<AddCommentData>();

  isLayoutReady: boolean = false;
  editor: ClassicEditor = null;
  Editor = ClassicEditor;
  config: EditorConfig = {};
  clickInsideComponent: boolean = false;
  isReadOnly: boolean = false;
  customToolbar: string[] = null;
  hasSuggestions: boolean = false; // used to sync trackchanges dataa.
  beforeValue: string; // this is before change value for comment compare
  isSidePanelOpen: boolean = false; // Used to keep track of side-panel state for add comment
  reviewCommentDisabled: boolean = false;
  placeholder = null;
  private _destroy$: Subject<void> = new Subject<void>();

  constructor(
    private readonly store: Store,
    private readonly imageDataService: ImageDataService,
    private readonly sidePanelService: SidePanelService,
    private readonly customModalService: CustomModalService,
    private readonly ckEditorMessageService: CKEditorMessageService,
    private readonly utils: UtilsService,
    private readonly ckeditorInstanceManagerService: CKEditorInstanceManagerService,
    private readonly ckEditorPermissionService: CKEditorPermissionService,
    private readonly ckEditorUtilService: CKEditorUtilService,
    private readonly toaster: ToastrService,
    private readonly errorHandlerService: ErrorHandlerService
  ) {}

  ngAfterViewInit(): void {
    const firmPref = this.store.selectSnapshot(
      (state) => state.user.firmPreference
    );

    // Making a copy here before modifying the content of actual object reference
    // as it was causing the next editor in loop to not have correct `Placeholder` value
    const configKeys = Object.keys(this.ckEditorInitConfig ?? {});
    if (configKeys.length === 1 && configKeys[0] === 'placeholder') {
      this.ckEditorInitConfig = JSON.parse(
        JSON.stringify(this.ckEditorInitConfig)
      );
    }

    this.isReadOnly = this.ckEditorInitConfig?.readonly || this.isReadonly;
    this.placeholder = this.ckEditorInitConfig?.placeholder;
    this.customToolbar = this.ckEditorInitConfig?.CkToolbar;
    if (this.ckEditorInitConfig) {
      this.ckEditorInitConfig.hasOwnProperty('readonly') &&
        delete this.ckEditorInitConfig.readonly;
      this.ckEditorInitConfig.hasOwnProperty('toolbar') &&
        delete this.ckEditorInitConfig.toolbar;
      this.ckEditorInitConfig.hasOwnProperty('plugins') &&
        delete this.ckEditorInitConfig.plugins;
      this.ckEditorInitConfig.hasOwnProperty('placeholder') &&
        delete this.ckEditorInitConfig.placeholder;
    }

    this.config = {
      ...this.getConfig(),
      ...this.ckEditorInitConfig,
      wordLimit: this.wordLimit,
    };
    this.config.dvUpload = {
      callback: this.imageUpload,
      adapterCallback: this.imageUploadAdapterCallback,
    };
    this.config.dvCommentUIConfig = {
      callback: this.addCommentCallback,
    };

    if (this.enableAI) {
      this.config.ai_config = {
        callback: this.onAiButtonClicked,
        tooltip: getProperTooltip(this.utils, firmPref, false),
        is_enabled:
          firmPref.enable_system_gen_ai &&
          firmPref.enable_gen_ai &&
          !this.isReadOnly,
      };
    }

    this.enableEditorMode();
    setTimeout(() => {
      this.isLayoutReady = true;
    }, 200);
    // this.config.comments.editorConfig.mention.feeds[0].feed = this.mentionsList;
    // this.isLite ? this.enableReadOnlyMode() : this.enableEditorMode();
    this.beforeValue = this.value;

    // Keep track of side-panel state, to open
    // the side-panel, if it is closed, on add comment.
    this.isSidePanelOpen =
      this.sidePanelService.sidePanelState === 'open' &&
      this.sidePanelService.activePanelName?.includes('ck-comments-panel');
    this.sidePanelService.sidePanelSub
      .pipe(takeUntil(this._destroy$))
      .subscribe((isOpen: boolean) => {
        this.isSidePanelOpen =
          isOpen &&
          this.sidePanelService.activePanelName?.includes('ck-comments-panel');
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes &&
      changes.isReadonly &&
      !changes.isReadonly.firstChange &&
      changes.isReadonly.currentValue !== changes.isReadonly.previousValue
    ) {
      this.isLayoutReady = false;
      this.isReadOnly = changes.isReadonly.currentValue;
      if (this.isReadOnly && !this.isComments) {
        this.editor?.enableReadOnlyMode(READONLY_LOCK);
        this.config.ai_config.is_enabled = false;
      } else if (this.isReadOnly && this.isComments) {
        this.editor &&
          ((this.editor.plugins.get('CommentsOnly') as CommentsOnly).isEnabled =
            true);
        this.config.ai_config.is_enabled = false;
      } else {
        this.editor?.disableReadOnlyMode(READONLY_LOCK);
        this.editor &&
          ((this.editor.plugins.get('CommentsOnly') as CommentsOnly).isEnabled =
            false);
        if (this.config.ai_config) this.config.ai_config.is_enabled = true;
      }
      this.enableEditorMode();
      setTimeout(() => (this.isLayoutReady = true));
    }

    if (
      (changes?.isComments &&
        changes.isComments.currentValue !== changes.isComments.previousValue &&
        !changes.isComments.firstChange) ||
      (changes?.isTrackChange &&
        changes.isTrackChange.currentValue !==
          changes.isTrackChange.previousValue &&
        !changes.isTrackChange.firstChange)
    ) {
      this.isLayoutReady = false;
      this.ngAfterViewInit();
      return; // return from here, as we're re-initializing the editor.
    }

    if (changes.value && !changes.value.firstChange) {
      const editorData = this.editor?.getData();
      // Update the editor data, if it is different.
      if (this.editor && editorData != (changes.value.currentValue ?? '')) {
        this.editor.data.set(changes.value.currentValue ?? '', {
          batchType: { isUndoable: true },
        });
      }
    }

    // WE NEED TO UPDATE THE INITIAL EDITOR DATA IF WE INITIALIZE EDITOR INSTANCE FROM OUTSIDE
    if (
      changes &&
      changes.isLite &&
      changes.isLite.currentValue !== changes.isLite.previousValue &&
      changes.isLite.currentValue
    ) {
      this.enableEditorMode();
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();

    this.editor = null;
    if (this.uniqueQuestionId) {
      this.ckeditorInstanceManagerService.removeEditorInstance(
        this.uniqueQuestionId
      );
    }
  }

  enableEditorMode(): void {
    this.config.initialData = this.value ?? '';
  }

  //#region Editor callback

  onChange({ editor }: { editor: ClassicEditor }): void {
    // Restrict the further events using "isManualDataSet" property.
    if (!editor) {
      return;
    }

    this.value = editor.getData();

    // onlyComment VAR IS USED TO SKIP DRAFT SERVICE AND DIRECTLY AUTOSAVE THE RESPONSE ON EMIT to directly sync everything with BE to avoid any errors
    if (this.isComments) {
      this.change.emit({
        value: this.value,
        onlyComments:
          this.checkForCommentsOnly(this.beforeValue, this.value) ||
          this.checkIfCommentsWereRemoved(this.beforeValue, this.value),
      });
    } else {
      this.change.emit(this.value);
    }

    this.beforeValue = this.value;
  }

  onReady(editor: ClassicEditor): void {
    editor.editing.view.focus();
    this.editor = editor;
    if (this.id) {
      editor['customId'] = this.id;
    }

    if (this.uniqueQuestionId) {
      this.ckeditorInstanceManagerService.setEditorInstance(
        this.uniqueQuestionId,
        editor
      );
    }

    editor.on(
      'set:state',
      (eventInfo, name: string, value: string, oldValue: string) => {
        if (value === 'destroyed') {
          this.editor = null;
          if (this.uniqueQuestionId) {
            this.ckeditorInstanceManagerService.removeEditorInstance(
              this.uniqueQuestionId
            );
          }
        }
      }
    );

    // This method will add the focus cursor at the end of sentence instead of beginning
    editor.model.change((writer) => {
      writer.setSelection(
        writer.createPositionAt(editor.model.document.getRoot(), 'end')
      );
    });

    // This event will prevent users from entering words more than the word limit
    if ((this.isTrackChange || this.isComments) && this.wordLimit) {
      editor.model.document.on('change:data', (evt, batch) => {
        // Get the editor's data as plain text (without formatting)
        const editorData = editor.getData();

        const wordCount = this.utils.tinymceGetWordCount(
          this.utils.stripCommentsAndTrackChanges(editorData)
        );

        // Code to handle to prevent auto save when response word count exceeds word limit
        if (wordCount > this.wordLimit) {
          this.toaster.error('Word limit exceeded');
          this.editor.execute('undo');
        }
      });
    }

    if (this.isReadOnly && !this.isComments) {
      editor.enableReadOnlyMode(READONLY_LOCK);
    }

    if (this.isReadOnly && this.isComments) {
      (editor.plugins.get('CommentsOnly') as CommentsOnly).isEnabled = true;
    }

    if (this.isTrackChange && this.isTrackChangeEnabled) {
      editor.execute('trackChanges'); // enable track changes
      // editor.commands.get('trackChanges').forceDisabled('suggestionsMode'); // disable the track changes toggle option, so that user can't turn it on or off
    }

    // this will take care of disabling track changes and review comments when editor is initialized with full word limit
    if ((this.isTrackChange || this.isComments) && this.wordLimit) {
      const wordCount = this.utils.tinymceGetWordCount(
        this.utils.stripCommentsAndTrackChanges(this.value)
      );

      if (wordCount > this.wordLimit)
        this.toggleReviewCommentsTrackChanges(true);
      else if (wordCount === this.wordLimit) {
        this.toggleReviewCommentsTrackChanges(false);
        if (this.editor.commands.get('trackChanges').value)
          this.editor.execute('trackChanges'); // for toggling track changes
        this.editor.commands.get('trackChanges').forceDisabled(Comments_Lock);
      }
    }

    if (this.isSidePanelOpen) {
      // Update the side-panel
      this.onAddReviewComment.emit({ source: 'editor-on-ready' });
    }

    // Remove user permissions, if user doesn't has permission
    if (
      (this.isComments || this.isTrackChange) &&
      !this.ckEditorPermissionService.canPerformOperationsOnComments
    ) {
      // Reference - https://ckeditor.com/docs/ckeditor5/latest/api/module_collaboration-core_permissions-Permissions.html
      const permissions = this.editor?.plugins?.get(
        'Permissions'
      ) as Permissions;
      !!permissions && permissions.setPermissions([]);
    }

    this.checkForSuggestions();
    this.activeAnnotationChangeListener();
  }

  onError(error: CKEditorError): void {
    this.errorHandlerService.handleError(error, null, null, true, false, {
      ErrorSource: 'CKEditorInitializationFailed',
    });
  }

  //#endregion

  private getConfig(): EditorConfig {
    const configBuilder = new ConfigBuilder(this.value)
      .addToolbar(this.literVersion, this.isDoubleToolbar, this.isReadOnly)
      .addCustomToolBar(this.customToolbar)
      .groupToolbarItems()
      .addPlaceholder(this.placeholder)
      .addPlugins(this.literVersion, this.isReadOnly)
      .addExtraPlugins(this.literVersion, this.isReadOnly)
      .addBalloonToolbar(this.isReadOnly)
      .addFontFamily()
      .addFontSize()
      .addFontColors()
      .addHeading()
      .addLink()
      .addBlockIndent()
      .addImageToolbar()
      .addMention()
      .addTable()
      .addGeneralHTMLSupport();

    this.ckEditorUtilService.addUsers(configBuilder.getConfig());

    // Comments
    // Add comments config as it is required by track changes.
    if (this.isComments || this.isTrackChange) {
      configBuilder.addComments();

      this.fetchMentionList();
      // this.config.mention.feeds[0].feed = this.mentionsList;
      this.config = configBuilder.getConfig();
      this.config.comments.editorConfig.mention.feeds[0].feed =
        this.mentionsList;
    }

    if (!this.isComments) {
      configBuilder.removeToolbarItem('dvComment');
    }

    if (!this.enableAI && !this.isReadOnly) {
      configBuilder.removeToolbarItem('AIwritingAssistant');
      configBuilder.removePlugin('AIwritingAssistant');
    }

    if (this.isTrackChange) {
    } else {
      configBuilder.removeToolbarItem('trackChanges');
    }

    if (!this.isMentions) {
      configBuilder.removePlugin('DVMention');
      configBuilder.removePlugin('Mention');
    } else {
      const config = configBuilder.getConfig();
      this.fetchMentionList();
      config.mention.feeds[0].feed = this.mentionsList;
    }

    if (!this.imageSelector) {
      // DVImageUploadPlugin - is used for uploading copy-paste images
      // DVImageUploadUI - this plugin registers the `dvUploadImage` button & it's functionalities
      configBuilder.removePlugin(['DVImageUploadPlugin', 'DVImageUploadUI']);
      configBuilder.removeToolbarItem('dvUploadImage');
    }

    return configBuilder.getConfig();
  }

  private fetchMentionList(): void {
    if (this.mentionsList && this.mentionsList.length) {
      return;
    }

    this.mentionsList = this.ckEditorUtilService.getUserMentionList();
  }

  private activeAnnotationChangeListener(): void {
    const editor = this.editor;
    const annotationsPlugin = editor.plugins.get('Annotations');
    const annotationsUIsPlugin = editor.plugins.get('AnnotationsUIs');

    annotationsUIsPlugin.deactivate('inline');
    annotationsPlugin.on(
      'change:activeAnnotations',
      (eventInfo, name: string, value: Set<any>, oldValue: Set<any>) => {
        if (value.size === 0) {
          // no comment is focused
          // [TODO]: re-arrange comments
          // annotationsPlugin.refreshVisibility(); [Not working]
          // annotationsPlugin.refreshPositioning(); [Not working]
        }

        if (!this.isSidePanelOpen) {
          this.onReviewCommentFocused.emit(); // To open the side panel (if closed)
        }
      }
    );
  }

  //#region Image upload support

  imageUpload = () => {
    this.customModalService.invoke('questionnaire-upload-image', {
      initialState: {
        editor: this.editor,
        isCKEditor: true,
        insertImageIntoCKEditor: (editor: ClassicEditor, imageUrl: string) => {
          const command = editor.commands.get('insertImage');
          command.execute({ source: imageUrl });
        },
      },
      closeInterceptor: () => {
        return new Promise<void>((resolve) => {
          resolve();
          this.editor.editing.view.focus();
        });
      },
      class: 'modal-xl',
    });
  };

  imageUploadAdapterCallback = (file: File) => {
    const payload = new FormData();
    payload.append('file', file, file.name + new Date().getTime() + '.png');

    return this.imageDataService.uploadImageDirect(payload).toPromise();
  };

  //#endregion

  addCommentCallback = () => {
    if (this.isSidePanelOpen) {
      // If side-panel is already open, then send the message to
      // side-panel to add a comment.
      this.ckEditorMessageService.sendMessage({
        source: 'editor-component',
        data: 'addCommentThread',
      });
    } else {
      // If side-panel is closed, then open the side panel first.
      // Side-panel will handle the add comment based on source.
      this.onAddReviewComment.emit({ source: 'editor-toolbar' });
    }
  };

  onAiButtonClicked = (dropdonObj) => {
    this.onAiButtonClick.emit(dropdonObj);
  };

  getSelectedText() {
    const editor = this.editor;
    const selection = editor.model.document.selection;
    const sHtmlSelection = editor.data.stringify(
      editor.model.getSelectedContent(selection)
    );
    return sHtmlSelection;
  }

  // Method to remove the comments wrapper tags from the response
  stripComments(content) {
    if (!content) return;
    // Remove any comment spans, assuming comments are wrapped in tags with specific attributes
    return content
      .replace(/<comment-start name="[^"]*"><\/comment-start>/g, '') // Matches <comment-start ...>
      .replace(/<\/comment-start>/g, '') // Matches </comment-start>
      .replace(/<comment-end name="[^"]*"><\/comment-end>/g, '') // Matches <comment-end ...>
      .replace(/<\/comment-end>/g, '') // Matches </comment-end>
      .replace(/data-comment-start-before="[^"]*/g, '')
      .replace(/data-comment-end-after="[^"]*/g, '')
      .replace(/data-comment-start-after/g, '')
      .replace(/data-comment-end-before/g, '')
      .trim();
  }

  checkForCommentsOnly(initial, current) {
    // Strip comments from both initial and current content
    let strippedInitial = this.stripComments(initial);
    let strippedCurrent = this.stripComments(current);

    // If stripped content matches, only comments were added
    if (strippedInitial === strippedCurrent) {
      return true;
    } else {
      return false;
    }
  }

  checkIfCommentsWereRemoved(initial, current) {
    // check for comments
    if (
      (initial?.match(/<comment-start name="[^"]*"><\/comment-start>/g) || [])
        .length >
        (current?.match(/<comment-start name="[^"]*"><\/comment-start>/g) || [])
          .length ||
      (initial?.match(/data-comment-start-before="[^"]*/g) || []).length >
        (current?.match(/data-comment-start-before="[^"]*/g) || []).length
    )
      return true;
  }

  // Used to insert data at a specific selected position or at cursor
  public insertContentAtSelection(data) {
    const editor = this.editor;

    const viewFragment = editor.data.processor.toView(data);

    const modelFragment = editor.data.toModel(viewFragment);

    editor.model.insertContent(modelFragment);
  }

  // this function handles disabling/enabling review comments and track changes at once ( used incase the word count exceed word limit)
  public toggleReviewCommentsTrackChanges(disable: boolean) {
    if (!this.editor) return;
    if (disable) {
      if (this.isTrackChange) {
        if (this.editor.commands.get('trackChanges').value)
          this.editor.execute('trackChanges'); // for toggling track changes
        this.editor.commands.get('trackChanges').forceDisabled(Comments_Lock);
        this.editor.commands
          .get('acceptSuggestion')
          .forceDisabled(Comments_Lock);
        this.editor.commands
          .get('acceptAllSuggestions')
          .forceDisabled(Comments_Lock);
        this.editor.commands
          .get('discardAllSuggestions')
          .forceDisabled(Comments_Lock);
        this.editor.commands
          .get('discardSuggestion')
          .forceDisabled(Comments_Lock);
      }

      if (this.isComments)
        this.editor.commands
          .get('addCommentThread')
          .forceDisabled(Comments_Lock);
    } else {
      if (this.isTrackChange) {
        this.editor.commands
          .get('trackChanges')
          .clearForceDisabled(Comments_Lock);
        this.editor.commands
          .get('acceptSuggestion')
          .clearForceDisabled(Comments_Lock);
        this.editor.commands
          .get('acceptAllSuggestions')
          .clearForceDisabled(Comments_Lock);
        this.editor.commands
          .get('discardAllSuggestions')
          .clearForceDisabled(Comments_Lock);
        this.editor.commands
          .get('discardSuggestion')
          .clearForceDisabled(Comments_Lock);

        if (
          !this.editor.commands.get('trackChanges').value &&
          this.isTrackChangeEnabled
        )
          this.editor.execute('trackChanges');
      }

      if (this.isComments)
        this.editor.commands
          .get('addCommentThread')
          .clearForceDisabled(Comments_Lock);
    }
  }

  //#region Trackchanges

  private checkForSuggestions(): void {
    if (!this.isTrackChange) {
      return;
    }

    const trackChanges = this.editor.plugins.get(
      'TrackChanges'
    ) as TrackChanges;
    this.hasSuggestions = trackChanges.getSuggestions().length >= 0;
  }

  getTrackChangesIds(): Array<string> | null {
    if (!this.isTrackChange) {
      return null;
    }

    const trackChanges = this.editor.plugins.get(
      'TrackChanges'
    ) as TrackChanges;
    const suggestionIds = trackChanges
      .getSuggestions({ skipNotAttached: true, toJSON: true })
      .map((suggestion) => suggestion.id);

    if (this.hasSuggestions || suggestionIds.length) {
      return suggestionIds;
    }

    return null;
  }

  //#endregion
}
