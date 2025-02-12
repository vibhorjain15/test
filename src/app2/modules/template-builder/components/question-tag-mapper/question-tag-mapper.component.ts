import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngxs/store';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { forkJoin } from 'rxjs';
import { tagsCostant } from '../../side-panels/set-smart-text/constant/tags.constant';
import { ProjectTagsType } from '../../side-panels/set-smart-text/type/project-tags.type';
import { MappingQuestionsType } from '../../side-panels/configure-question-mapping/type/mapping-question.type';
import { QuestionType } from 'src/app2/apis/template/types/question.type';
import { WidgetType } from '../../side-panels/set-smart-text/type/widget.type';
import { htmlTagGenerator } from './util/html-tag.util';
import { UpdateActivePanelId } from '../../store/template-builder.action';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { UtilsService } from 'src/app2/services/utils.service';

export type TagsType = {
  id: number;
  text: string;
  alertInfo: string;
  tags: Array<{
    id: number;
    text: string;
    tag: string;
    responseType: string;
    isSelected: boolean;
    previewOptions: Array<{ id: number; text: string }>;
  }>;
};

export type previewOptionsType = {
  text: string;
  type: 'text';
  type_options: { type: string };
  id: number;
  is_active: boolean;
};
@Component({
  selector: 'question-tag-mapper',
  templateUrl: './question-tag-mapper.component.html',
  styleUrls: ['./question-tag-mapper.component.css'],
})
export class QuestionTagMapperComponent implements OnInit {
  activeTag;
  searchTerm = '';
  tagTypes = [];
  @Input() questionId;
  @Input() question;
  @Input() isTouched;
  @Input() editorValue;
  @Output() onAdd = new EventEmitter();
  @Output() onSave = new EventEmitter();
  tagsData: { [id: string]: TagsType } | any = JSON.parse(
    JSON.stringify(tagsCostant)
  );
  placeholder;
  loader = false;
  isTagsSelected = false;
  constructor(
    private modal: CustomModalService,
    private readonly SweetAlert: SweetAlertService,
    private template: TemplateService,
    private store: Store,
    private panelService: SidePanelService,
    private http: HttpClient,
    private util: UtilsService
  ) {}

  ngOnInit(): void {
    this.loader = true;
    forkJoin([
      this.template.getProjectTags(),
      this.template.getMappedQuestions(
        this.store.selectSnapshot((state) => state.template.templateId),
        this.questionId
      ),

      this.template.getQuestionsFromTemplateId(
        this.store.selectSnapshot((state) => state.template.templateId)
      ),
      this.template.getWidgets(),
    ]).subscribe(
      ([projects, mapped, questions, widgets]: [
        ProjectTagsType[],
        MappingQuestionsType[],
        QuestionType[],
        WidgetType[]
      ]) => {
        projects.map((project, index) => {
          this.tagsData[1].tags[index + 1] = {
            id: index + 1,
            text: project.item1,
            tag: `{{${project.item2}}}`,
            rawTag: project.item2,
            isSelected: false,
          };
        });
        mapped.map((map) => {
          this.tagsData[2].tags[map.mapped_question_group_id] = {
            id: map.mapped_question_group_id,
            text: map.mapped_question_text,
            tag: `{{${map.mapped_template_id}_${map.mapped_question_group_id}_1}}`,
            rawTag: `${map.mapped_template_id}_${map.mapped_question_group_id}_1`,
            isSelected: false,
          };
        });
        questions.map((question) => {
          this.tagsData[3].tags[question.group_id] = {
            id: question.group_id,
            text: question.text.split('<separator>')[0],
            tag: `{{self_${question.group_id}}}`,
            rawTag: question.group_id,
            isSelected: false,
          };
        });
        widgets.map((widget) => {
          this.tagsData[4].tags[widget.id] = {
            id: widget.id,
            text: widget.name,
            tag: `{{${widget.tag}}}`,
            rawTag: widget.tag,
            responseType: widget.type,
            isSelected: false,
            previewOptions: widget?.type_options?.map((val, index) => ({
              id: index,
              text: val,
            })),
          };
        });
        this.convertTolist();
        this.activeTag = this.tagTypes.find((x) => x.id === 4);
        this.placeholder = `Search in ${this.activeTag.text.toLowerCase()}`;
        this.loader = false;
      }
    );
  }

  convertTolist() {
    let tagsCopy = JSON.parse(JSON.stringify(this.tagsData));
    let localData = Object.values(tagsCopy).map((tag: any) => {
      tag.tags = Object.values(tag.tags);
      return { ...tag };
    });
    this.tagTypes = localData;
    if (this.activeTag)
      this.activeTag = this.tagTypes.find((x) => x.id === this.activeTag.id);
  }

  showTags(id: number) {
    this.tagTypes.forEach((tag: TagsType) => {
      if ((tag.tags as Array<any>).some((tag) => tag.isSelected))
        tag.tags.forEach((internalTag) => {
          internalTag.isSelected = false;
        });
    });
    this.activeTag = this.tagTypes.find((x) => x.id === id);
    if (this.activeTag.id === 3)
      this.activeTag.tags = this.activeTag.tags.filter(
        (val) => val.id !== this.questionId
      );
    this.placeholder = `Search in ${this.activeTag.text.toLowerCase()}`;
    this.isTagsSelected = false;
    if (this.activeTag.id === 2) {
      setTimeout(() => {
        let AllDownloadLinks: any = document.querySelectorAll('#attachmentUrl');
        AllDownloadLinks.forEach((element) => {
          element.addEventListener('click', this.downloadAttachment.bind(this));
        });
      }, 1000);
    }
  }

  handleOnSelect(tag) {
    tag.isSelected = !tag.isSelected;
    this.isTagsSelected = this.activeTag.tags.some(
      (x: { isSelected: any }) => x.isSelected
    );
  }

  handleOnEdit(activetag, tag) {
    this.modal.invoke('manage-widget', {
      initialState: {
        widget: { ...tag },
        onSuccess: (res) => {
          this.tagsData[activetag.id].tags[res.id] = {
            id: res.id,
            text: res.name,
            tag: `{{${res.tag}}}`,
            rawTag: res.tag,
            responseType: res.type,
            isSelected: false,
            previewOptions: res?.type_options?.map((val, index) => ({
              id: index,
              text: val,
            })),
          };
          this.convertTolist();
        },
      },
    });
  }

  handleOnDelete(activetag, tag) {
    this.SweetAlert.confirm({
      title: `Are you sure you want to delete this widget ?`,
      confirmButtonText: 'Yes, delete!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: async () => {
        return new Promise<void>((resolve) => {
          this.template
            .updateWidget(tag.id, {
              id: tag.id,
              is_active: false,
              name: tag.text,
              type: tag.responseType,
            })
            .pipe(finalize(() => resolve()))
            .subscribe((res) => {
              delete this.tagsData[activetag.id].tags[tag.id];
              this.convertTolist();
            });
        });
      },
    }).then(() => {
      this.SweetAlert.close();
    });
  }

  handleAddNewWidget(activeTag) {
    this.modal.invoke('manage-widget', {
      initialState: {
        onSuccess: (res) => {
          this.tagsData[activeTag.id].tags[res.id] = {
            id: res.id,
            text: res.name,
            tag: `{{${res.tag}}}`,
            rawTag: res.tag,
            responseType: res.type,
            isSelected: false,
            previewOptions: res?.type_options?.map((val, index) => ({
              id: index,
              text: val,
            })),
          };
          this.convertTolist();
        },
      },
    });
  }

  handleAdd() {
    let selectedTags = {};
    this.activeTag.tags.map((tag: any) => {
      if (tag.isSelected) {
        selectedTags[tag.id] = {
          id: tag.id,
          tag:
            tag.responseType === 'date' || tag.responseType === 'dropdown'
              ? this.getCustomTagText(tag).tag
              : tag.tag,
          rawTag:
            tag.responseType === 'date' || tag.responseType === 'dropdown'
              ? this.getCustomTagText(tag).rawTag
              : tag.rawTag,
          name: tag.text,
          html: tag.tag,
          type: tag.responseType,
        };
        if (tag.responseType === 'date') {
          selectedTags[tag.id] = {
            ...selectedTags[tag.id],
            html: htmlTagGenerator('date', selectedTags[tag.id].rawTag),
            is_active: true,
          };
        }
        if (tag.responseType === 'dropdown') {
          selectedTags[tag.id] = {
            ...selectedTags[tag.id],
            html: htmlTagGenerator(
              'dropdown',
              selectedTags[tag.id].rawTag,
              tag.previewOptions.map((val) => val.text)
            ),
            is_active: true,
            type_options: tag.previewOptions.map((val) => val.text),
          };
        }
      }
    });
    this.onAdd.emit(Object.values(selectedTags));
  }

  getCustomTagText(tag: any) {
    // append _1, _2.. at the end when same custom tag gets added multiple times
    if (this.editorValue.indexOf(tag.rawTag) > -1) {
      const count = this.editorValue.split(tag.rawTag).length - 1;
      if (count > 0) {
        return {
          tag: `{{${tag.rawTag}_${count}}}`,
          rawTag: `${tag.rawTag}_${count}`,
        };
      }
    }
    return { tag: tag.tag, rawTag: tag.rawTag };
  }

  handleMappingQuestion() {
    if (this.isTouched) {
      const title = 'Are you sure you want to leave this page? ';
      this.SweetAlert.confirm({
        title,
        text: 'You have unsaved change. All your unsaved answers will be lost if you leave this page',
        confirmButtonText: 'Save & Exit',
        cancelButtonText: 'Do Not Save',
        focusCancel: true,
        preConfirm: () => this.onSave.emit(),
      }).then((isConfirm) => {
        if (!isConfirm) {
          this.store.dispatch(
            new UpdateActivePanelId(
              `${this.question.id}-configure-question-mapping`
            )
          );
          this.panelService.invoke('configure-question-mapping', {
            question: this.question,
          });
        }
      });
    } else {
      this.store.dispatch(
        new UpdateActivePanelId(
          `${this.question.id}-configure-question-mapping`
        )
      );
      this.panelService.invoke('configure-question-mapping', {
        question: this.question,
      });
    }
  }

  downloadAttachment(event) {
    let targetUrl = this.util.extractDownloadUrl(event);
    this.util.downloadAttachment(targetUrl);
  }
}
