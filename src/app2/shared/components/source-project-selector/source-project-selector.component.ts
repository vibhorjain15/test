import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'source-project-selector',
  templateUrl: './source-project-selector.component.html',
  // styleUrls: ['./source-project-selector.component.css'],
})
export class SourceProjectSelector implements OnInit {
  @Input() review_template;
  @Output() onChange = new EventEmitter();
  @Input() diligences;
  @Input() isReport = true;
  diligencesCopy;
  isNoDiligenceData;
  is_internal;
  review_diligence_templates;
  review_entity_type = 'All';
  filter: any = {
    diligence_entity: null,
  };
  filterBy;
  is_loading;

  filters_applied = false;

  diligence_funds;
  diligence_firms;
  diligence_strategies;
  diligence_vehicles;
  active_step_template;
  select_all_entities;
  disable_select_all;

  filters_section: any = {
    show: false,
  };

  constructor(
    private readonly toaster: ToastrService
  ) {}
  ngOnInit() {
    this.diligencesCopy = this.diligences;
    this.filters_section.show = false;
    this.active_step_template = this.review_template;
    this.filterByEntity(this.review_entity_type);
    this.diligence_funds = this.getDiligenceFunds();
    this.diligence_firms = this.getDiligenceFirms();
    this.diligence_strategies = this.getDiligenceStrategies();
    this.diligence_vehicles = this.getDiligenceVehicles();
    this.filter.diligence_entity = null;
  }

  getDiligenceFunds() {
    const arr = [];
    if (this.active_step_template && this.active_step_template.id) {
      const dupes = [];
      this.diligences.map((diligence) => {
        if (
          diligence.entity_type === 'Fund' &&
          diligence.template_id === this.active_step_template.id &&
          dupes.indexOf(diligence.entity_id) === -1
        ) {
          arr.push(diligence);
          dupes.push(diligence.entity_id);
        }
      });
    }
    return arr;
  }

  getDiligenceFirms() {
    const arr = [];
    if (this.active_step_template && this.active_step_template.id) {
      const dupes = [];
      this.diligences.map((diligence) => {
        if (
          diligence.entity_type === 'Firm' &&
          diligence.template_id === this.active_step_template.id &&
          dupes.indexOf(diligence.entity_id) === -1
        ) {
          arr.push(diligence);
          dupes.push(diligence.entity_id);
        }
      });
    }
    return arr;
  }

  getDiligenceStrategies() {
    const arr = [];
    if (this.active_step_template && this.active_step_template.id) {
      const dupes = [];
      this.diligences.map((diligence) => {
        if (
          diligence.entity_type === 'Strategy' &&
          diligence.template_id === this.active_step_template.id &&
          dupes.indexOf(diligence.entity_id) === -1
        ) {
          arr.push(diligence);
          dupes.push(diligence.entity_id);
        }
      });
    }
    return arr;
  }

  getDiligenceVehicles() {
    const arr = [];
    if (this.active_step_template && this.active_step_template.id) {
      const dupes = [];
      this.diligences.map((diligence) => {
        if (
          diligence.entity_type === 'Vehicle' &&
          diligence.template_id === this.active_step_template.id &&
          dupes.indexOf(diligence.entity_id) === -1
        ) {
          arr.push(diligence);
          dupes.push(diligence.entity_id);
        }
      });
    }
    return arr;
  }

  filterByEntity(type: string) {
    if (this.active_step_template && this.active_step_template.id) {
      if (type === 'Firm') {
        this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Firm' &&
            diligence.template_id === this.active_step_template.id
        );
      } else if (type === 'Strategy') {
        this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Strategy' &&
            diligence.template_id === this.active_step_template.id
        );
      } else if (type === 'Fund') {
        this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Fund' &&
            diligence.template_id === this.active_step_template.id
        );
      } else if (type === 'Vehicle') {
        this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Vehicle' &&
            diligence.template_id === this.active_step_template.id
        );
      } else if (type === 'Custom' || type === 'Review') {
        this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Review' &&
            diligence.template_id === this.active_step_template.id
        );
      } else if (type === 'All') {
        this.diligences = this.diligencesCopy.filter(
          (diligence: { id: any; template_id: any }) =>
            diligence.id &&
            diligence.template_id === this.active_step_template.id
        );
      }
    }
  }

  setEntityType(entity_type: any) {
    this.review_entity_type = entity_type;
    this.filter.diligence_entity = null;
    this.filterByEntity(entity_type);
    this.diligence_funds = this.getDiligenceFunds();
    this.diligence_firms = this.getDiligenceFirms();
    this.diligence_strategies = this.getDiligenceStrategies();
    this.diligence_vehicles = this.getDiligenceVehicles();
    this.filters_section.show = false;
  }

  getDiligenceTemplates() {
    const arr = [];
    const dupes = [];
    this.diligences.map((diligence) => {
      if (dupes.indexOf(diligence.template_id) === -1) {
        arr.push({ id: diligence.template_id, name: diligence.template_name });
        dupes.push(diligence.template_id);
      }
    });
    return arr;
  }

  filterDiligences(value: { entity_id: any }, type: string) {
    if (
      (type === 'Fund' ||
        type === 'Firm' ||
        type === 'Strategy' ||
        type === 'Vehicle') &&
      this.active_step_template &&
      this.active_step_template.id
    ) {
      this.diligences = this.diligencesCopy.filter(
        (diligence: { entity_id: any; template_id: any }) =>
          diligence.entity_id === value.entity_id &&
          diligence.template_id === this.active_step_template.id
      );
    }
  }

  addToSelection(
    entry: { rowIndex: string | number },
    diligence,
    index = null
  ) {
    if (
      this.review_diligence_templates.length <= 1 &&
      this.review_diligence_templates[index].selection_list.length >= 5
    ) {
      this.toaster.error('', 'Maximum limit reached');
      return;
    }
    if (
      this.review_diligence_templates.length > 1 &&
      this.review_diligence_templates[index].selection_list.length >= 1
    ) {
      this.toaster.error('', 'Maximum limit reached');
      return;
    }

    const ids = this.review_diligence_templates[index].selection_list.map(
      (val) => val.id
    );
    if (!ids.includes(diligence.id)) {
      diligence.is_selected = true;
      this.review_diligence_templates[index].selection_list.push(diligence);
    }
    this.onChange.emit(diligence.map((val) => val.is_selected));
  }

  clearSelectionList(entry: { selection_list: { length: number } }) {
    this.handleDeselection(entry.selection_list);
    entry.selection_list.length = 0;
    this.disable_select_all = false;
  }

  handleDeselection(diligences: any) {
    diligences.forEach((diligence) => {
      const diligence_from_main_list: any = this.diligences.find(
        (val) => val.id === diligence.id
      );

      if (diligence_from_main_list) {
        diligence_from_main_list.is_selected = false;
      }
    });

    this.select_all_entities = false;
  }

  handleInputChange(val) {
    if (this.isReport) {
      this.diligences = this.diligencesCopy.filter(
        (diligence: any) =>
          val.includes(diligence.name) || val.includes(diligence.entity_name)
      );
    } else {
      this.diligences = this.diligencesCopy.filter(
        (diligence: any) =>
          val.includes(diligence.tofirm_name) || val.includes(diligence.name)
      );
    }
  }

  removeFromSelection(entry, diligence) {
    this.setEntityType(diligence.entity_type);
    this.handleDeselection([diligence]);
    entry.selection_list.splice(entry.selection_list.indexOf(diligence), 1);
    this.onChange.emit(diligence.map((val) => val.is_selected));
  }

  trackById(index: number, val: any): number {
    return val.id;
  }

  toggleFiltersSection() {
    this.filters_section.show = !this.filters_section.show;
  }
}
