import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngxs/store';
import { finalize } from 'rxjs/operators';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { QuestionType } from 'src/app2/apis/template/types/question.type';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { TagsType } from '../../components/question-tag-mapper/question-tag-mapper.component';
import { htmlTagGenerator } from '../../components/question-tag-mapper/util/html-tag.util';
import {
  UpdateActivePanelId,
  UpdateLocalQuestion,
} from '../../store/template-builder.action';
import { tagsCostant } from './constant/tags.constant';
import { StandardTextType } from './type/standarized.type';
import { DvEditorComponent } from 'src/app2/shared/components';

@Component({
  selector: 'set-smart-text',
  templateUrl: './set-smart-text.component.html',
  styleUrls: ['./set-smart-text.component.css'],
})
export class SetSmartTextComponent implements OnInit {
  @Input() question: QuestionType;
  @ViewChild('editorInstance') editorInstance: DvEditorComponent;
  tinyMceInit = {
    placeholder: '',
  };
  editor = '';
  editorCopyValue = '';
  preview = '';
  loading = false;
  smartTextForm: FormGroup;
  tagsData: { [id: string]: TagsType } | any = tagsCostant;
  tagsList = [];
  selectedTags = [];
  widgets = { used_widgets: [], widgets: [] };
  previewHtml = {};
  editorCopy;
  constructor(
    private template: TemplateService,
    private store: Store,
    private panel: SidePanelService
  ) {}
  ngOnInit(): void {
    this.smartTextForm = new FormGroup({
      isSmartText: new FormControl(true),
    });
    this.template
      .getStandardizedText(
        this.store.selectSnapshot((state) => state.template.templateId),
        this.question.id
      )
      .subscribe((res: StandardTextType) => {
        if (res) {
          this.editor = res.text;
          this.editorCopy = res.text;
          this.preview = res.html;
          this.widgets.used_widgets = res.used_widgets;
          this.widgets.widgets = res.widgets;
          this.widgets.widgets.map((tagData) => {
            this.previewHtml[tagData.tag] = htmlTagGenerator(
              tagData.type,
              tagData.tag,
              tagData.type_options
            );
          });
        }
      });
  }

  handleSaveClick(route = false): void {
    this.loading = true;
    let payload = {
      template_id: +this.store.selectSnapshot(
        (state) => state.template.templateId
      ),
      question_id: this.question.id,
      standardized_text_data: {
        used_widgets: this.widgets.used_widgets,
        text: this.editor,
        html: this.preview,
        widgets: this.widgets.widgets,
      },
    };
    this.template
      .updateStandardizedText(payload)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        this.store.dispatch(
          new UpdateLocalQuestion(this.question.id, {
            has_standardized_text: true,
          })
        );
        this.store.dispatch(new UpdateActivePanelId(''));
        this.panel.close();
        if (route) {
          this.store.dispatch(
            new UpdateActivePanelId(
              `${this.question.id}-configure-question-mapping`
            )
          );
          this.panel.invoke('configure-question-mapping', {
            question: this.question,
          });
        }
      });
  }

  handleAdd(selectedtags) {
    this.selectedTags = selectedtags;
    this.smartTextForm.patchValue({
      isSmartText: false,
    });
    this.selectedTags.forEach((val) => {
      this.previewHtml[val.rawTag] = val.html;
      this.editorInstance.insertContent('&nbsp;' + val.tag + '&nbsp;');
      if (val.type === 'dropdown') {
        this.widgets.used_widgets.push(val.id);
        this.widgets.widgets.push({
          id: val.id,
          name: val.name,
          tag: val.rawTag,
          type: val.type,
          type_options: val.type_options.map((val) => val),
          is_active: true,
        });
      } else if (val.type === 'date') {
        this.widgets.used_widgets.push(val.id);
        this.widgets.widgets.push({
          id: val.id,
          name: val.name,
          tag: val.rawTag,
          type: val.type,
          type_options: null,
          is_active: true,
        });
      }
    });
  }

  handleEditorChange(val: any) {
    let editorValue = val;
    editorValue = `${editorValue.replace(/\&nbsp;/gi, '')}`;
    this.editor = val;
    this.editorCopyValue = val;
    let localPreviw = val;
    Object.keys(this.previewHtml).map((tags) => {
      if (localPreviw.includes(tags)) {
        localPreviw = localPreviw.replaceAll(
          `{{${tags}}}`,
          this.previewHtml[tags]
        );
      }
    });
    this.preview = localPreviw;
  }

  handleOnCancelClick(): void {
    this.store.dispatch(new UpdateActivePanelId(''));
    this.panel.close();
  }

  handleSave() {
    this.handleSaveClick(true);
  }
}
