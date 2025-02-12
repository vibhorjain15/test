import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { ManageThresholdsService } from 'src/app2/services/manage-thresholds.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';
import Swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-manage-thresholds',
  templateUrl: './manage-thresholds.component.html',
  styleUrls: ['./manage-thresholds.component.css']
})
export class ManageThresholdsComponent implements OnInit, OnDestroy {
  threshold_forms: {};
  types: any;
  boolean_value_options: { label: string; value: boolean; }[];
  thresholds: any;
  materialThresholds: any;
  operators: any;
  questions: any;
  grouped_thresholds: any[];
  toaster: any;
  subscription: any;
  panelHeadingControls: PanelControl[] = [];
  constructor(private readonly baseDataService: BaseDataService,
    private readonly http: HttpClient,
    private readonly ModalFactory: CustomModalService,
    private readonly sweetAlertService: SweetAlertService,
    private readonly thresholdsService: ManageThresholdsService,
    private readonly utilService: UtilsService) { }

  ngOnInit(): void {
    this.threshold_forms = {};

    this.types = [
      {
        id: 0,
        text: 'Absolute',

      },
      {
        id: 1,
        text: 'Change'
      }
    ]
    this.boolean_value_options = [
      { label: 'Yes', value: true },
      { label: 'No', value: false }
    ];
    this.getQuestions();
    this.subscribeForThresholdChanges();
    this.setPanelHeadingControls();
  }

  setPanelHeadingControls() {
    this.panelHeadingControls  = [
      {
        text: 'New Threshold',
        handleClick: this.addNewThreshold.bind(this),
        leftIcon: 'plus' ,
        tooltip:'Add New Threshold'
      }
    ];
  }

  subscribeForThresholdChanges() {
    this.subscription = this.thresholdsService.thresholdsChanged$.subscribe(() => {
      this.getThresholdsData();
    })
  }

  getOperatorsList() {
    this.baseDataService.getOperators().subscribe((response: any) => {
      this.operators = response;
      this.getThresholds();
    });
  }

  getQuestions() {
    this.http.get('Formadv_Questions/alerts').subscribe((response: any) => {
      this.questions = response;
      this.getOperatorsList();
    });
  }

  getThresholds() {
    this.thresholdsService.getAllThresholds(() => {
      this.getThresholdsData();
    });
  }

  getThresholdsData() {
    this.thresholds = this.thresholdsService.thresholds;

    if (this.thresholds.length) {
      (this.thresholds).forEach((threshold: any) => {
        this.modifyDataForDisplay(threshold);
      });
      this.groupThresholds();
    }
  }

  modifyDataForDisplay(threshold: any) {
    const questionObj = this.questions.find(question => question.id === threshold.question_id);
    if (questionObj) {
      threshold.questionObj = questionObj;
    }
    const operatorObj = this.operators.find(operator => operator.value === threshold.operator_id);
    if (operatorObj) {
      threshold.operatorText = operatorObj.display_label;
    }
    const typeObj = this.types.find(type => type.id === threshold.type);
    if (typeObj) {
      threshold.typeText = typeObj.text;
    }
    if (questionObj) {
      if (['Boolean', 'BooleanPlus', 'NoPlus'].includes(questionObj.response_type)) {
        threshold.threshold_value = threshold.threshold_value === 'true';
      }
      if (['Numeric', 'Integer', 'Percentage'].includes(questionObj.response_type)) {
        threshold.threshold_value = Number(threshold.threshold_value);
      }
    }
  }

  groupThresholds() {
    this.grouped_thresholds = [];

    this.grouped_thresholds = this.utilService.groupByArray(
      this.thresholds,
      'section_name'
    );

    const groups = [];
    Object.values(this.grouped_thresholds).forEach((group: any) => {

      groups.push({
        section_name: group[0].section_name,
        thresholds: group
      });
    });

    this.grouped_thresholds = groups;
  }

  addNewThreshold() {
    this.ModalFactory.invoke('manage-threshold', {
      initialState: {
        threshold: undefined,
        questions: this.questions,
        operators: this.operators,
        types: this.types
      },
      class: 'gray modal-lg'
    });
  }

  editThreshold(threshold: any) {
    this.ModalFactory.invoke('manage-threshold', {
      initialState: {
        threshold: threshold,
        questions: this.questions,
        operators: this.operators,
        types: this.types
      },
      class: 'gray modal-lg'
    });
  }

  removeThreshold(threshold: any) {
    if (threshold.id) {
      this.sweetAlertService.confirm({
        title: "Are you sure you want to remove this threshold?",
        showLoaderOnConfirm: true,
        confirmButtonText: 'Remove',
        focusCancel: true,
        preConfirm: () => {
          this.thresholdsService.deleteThreshold(threshold, () => {
            Swal.close();
          });
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
