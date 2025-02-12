import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngxs/store';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { RouterService } from 'src/app2/services/router.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import {
  EntityType,
  ResponseType,
} from '../../../constants/Response-type.constant';
import { AumDefinitionType, AumGridType } from '../../../types/aum.type';
import { QuestionAttributeType } from '../../../types/questions.type';
import { CacheUtil } from '../../../service/cache.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { diligenceStatusConstant } from '../../../constants/quick-view-headers.constant';

@Component({
  selector: 'aum-response',
  templateUrl: './aum-response.component.html',
  styleUrls: ['./aum-response.component.css'],
})
export class AumResponseComponent implements OnInit {
  @Input() question: QuestionAttributeType;
  @Input() isReadOnly: boolean = false;
  @Input() isReadOnlyEditable: boolean = true;
  @Input() isPrintPreview: boolean = false;
  @Output() onChange = new EventEmitter();
  aumData = [];
  dropdownValue;
  emptyLabel =
    'No AUM history available. Please visit this entity’s profile page to add AUM history.';
  diligence;
  isTableListLoading: boolean = false;
  displayGrid: boolean = false;
  diligenceData;
  constructor(
    private questionnaire: QuestionnaireService,
    private store: Store,
    private router: RouterService,
    private cache: CacheUtil,
    private modal: CustomModalService
  ) {}
  ngOnInit(): void {
    const diligence = this.store.selectSnapshot(
      (state) => state.questionnaire.diligence
    );
    this.diligenceData = diligence;
    let user = this.store.selectSnapshot((state) => state.user.currentUser);
    let isReadonlyEditable =
      diligence.status == diligenceStatusConstant.InReview ||
      (user.isManager && diligence.diligence_type == 'dd_profile');
    let aumTable_id;
    if (this.question.responseType === ResponseType.ReturnTable) {
      this.emptyLabel =
        'No track record available. Please visit this entity’s profile page to add track record.';
      aumTable_id = this.question.answer.attributes.returnTable_id;
    } else {
      aumTable_id = this.question.answer.attributes.aumTable_id;
    }
    this.diligence = this.store.selectSnapshot(
      (state) => state.questionnaire.diligence
    );
    if (this.cache.AUMCACHE[this.question.id]) {
      this.aumData = this.cache.AUMCACHE[this.question.id];
      if (aumTable_id) {
        this.dropdownValue = this.aumData.filter(
          (val) => val.id === aumTable_id
        )[0];
        this.displayGrid = true;
      }
    } else {
      this.isTableListLoading = true;
      // Both input isReadOnlyEditable and calculated isReadOnlyEditable need to be true to
      // set isEditable as false. Essentially, the isReadOnlyEditable input is being used to override and ensure
      // isEditable is set as false. Used in mapped-questions component.
      let params: any = {
        isEditable:
          !this.isReadOnly || (isReadonlyEditable && this.isReadOnlyEditable),
        type:
          this.question.responseType === ResponseType.aumTable
            ? 'aum'
            : 'track_record',
        firmId:
          this.diligence.entity_type === keywordConstants.Firm
            ? this.diligence.entity_id
            : this.diligence.fromfirm_id,
      };

      if (this.isPrintPreview) {
        params.isEditable = !(
          this.diligenceData.isLocked || this.diligenceData.isReadOnly
        );
      }

      let resourceUri = '';
      switch (this.diligence.entity_type) {
        case keywordConstants.Product:
          resourceUri = `funds/${this.diligence.entity_id}`;
          break;
        case keywordConstants.Vehicle:
          resourceUri = `funds/${this.diligence.parent_entity_id}/vehicles/${this.diligence.entity_id}`;
          break;
        case keywordConstants.Strategy:
          resourceUri = `strategies/${this.diligence.entity_id}`;
          break;
      }

      params.resourceUri = resourceUri;
      this.questionnaire
        .getAumTrackRecordDefinition(params)
        .subscribe((res: AumDefinitionType[]) => {
          this.cache.AUMCACHE[this.question.id] = res;
          this.aumData = res;
          if (aumTable_id) {
            this.dropdownValue = this.aumData.filter(
              (val) => val.id === aumTable_id
            )[0];
            this.displayGrid = true;
          }
          this.isTableListLoading = false;
        });
    }
  }

  handleSelectChange(data) {
    this.displayGrid = false;
    this.onChange.emit({
      value: { id: data?.id ?? null },
      isError: !data?.currency_id,
    });
    // re-render share-class-table component
    setTimeout(() => (this.displayGrid = true), 100);
  }

  openUploadModal() {
    this.modal.invoke('upload-aum-file', {
      initialState: {
        entity_id: this.diligenceData.entity_id,
        entity_type: EntityType[this.diligenceData.entity_type],
      },
    });
  }

  handleAumClick() {
    let diligence = this.diligenceData;
    if (diligence.entity_type == keywordConstants.Firm)
      this.router.navigateWithParams('app.firms.profile.aum_tr', {
        firmId: diligence.entity_id,
      });
    else if (diligence.entity_type == keywordConstants.Product)
      this.router.navigateWithParams('app.firms.funds.profile.aum_tr', {
        firmId: diligence.fromfirm_id,
        fundId: diligence.entity_id,
      });
    else if (diligence.entity_type == keywordConstants.Vehicle)
      this.router.navigateWithParams(
        'app.firms.funds.vehicles.profile.aum_tr',
        {
          firmId: diligence.fromfirm_id,
          fundId: diligence.parent_entity_id,
          vehicleId: diligence.entity_id,
        }
      );
    else if (diligence.entity_type == keywordConstants.Strategy)
      this.router.navigateWithParams('app.firms.strategies.profile.aum_tr', {
        firmId: diligence.fromfirm_id,
        strategyId: diligence.entity_id,
      });
  }
}
