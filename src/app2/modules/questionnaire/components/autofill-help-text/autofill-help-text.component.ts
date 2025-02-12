import { Component, Input, SimpleChanges } from '@angular/core';
import { AutoFill, TabType } from '../../types/auto-fill.type';
import { Store } from '@ngxs/store';
import { keywordConstants } from 'src/app2/shared/constants/constant';

@Component({
  selector: 'autofill-help-text',
  templateUrl: './autofill-help-text.component.html',
  styleUrls: ['./autofill-help-text.component.css'],
})
export class AutofillHelpTextComponent {
  @Input() selectedButton: AutoFill;
  @Input() selectedTab: TabType;
  @Input() entityName: string;
  @Input() firmName: string;
  @Input() diligence: any;
  primaryText: string;
  secondaryText: string;
  user: any;

  constructor(private readonly store: Store) {}

  ngOnInit(): void {
    this.user = this.store.selectSnapshot((state) => state.user.currentUser);
    this.getHelpText();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && this.user) {
      this.getHelpText();
    }
  }

  getHelpText() {
    this.secondaryText = '';
    if (this.selectedTab === TabType.Advanced) {
      this.primaryText = `Advanced auto-fill will populate responses by 
        applying your specific content, entity, tags, and percent similarity match settings below.`;
    } else {
      if (this.selectedButton === AutoFill.From_Diligence_Project) {
        this.primaryText = `Auto-fill will populate responses by searching for matches in a selected project. 
        Filter the project list by entity and date range to narrow your search.`;
      } else if (this.selectedButton === AutoFill.From_Mapped_Responses) {
        this.primaryText = `Auto-fill will populate the mapped responses with exact match.`;
      } else {
        if (this.user.isManager && !this.user.isFreeSubscription) {
          this.primaryText = `Auto-fill will populate responses by searching for exact matches 
            and similar matches given your settings below.`;
        } else {
          this.primaryText = `Auto-fill will populate responses by searching for exact matches 
            given your settings below.`;
        }
        // don't show firm details for manager internal projects with no investor association
        const showFirmDetails = !(
          this.user.isManager &&
          this.diligence.is_internal &&
          this.diligence.investorfirm_id === this.user.firmInfo.id
        );
        // don't show entity details when we are not in most recent screen or investor side, the entity type is firm
        const showEntityDetails =
          (this.selectedButton === AutoFill.Most_Recent &&
            this.user.isManager) ||
          this.diligence.entity_type !== keywordConstants.Firm;

        if (this.selectedButton === AutoFill.Most_Recent) {
          const entity = this.entityName ? this.entityName : 'the same entity';
          const firm = this.firmName ? this.firmName : 'the same firm';
          if (this.user.isInvestor) {
            if (!showEntityDetails) {
              this.secondaryText = `<p><strong>Selecting 'Most Recent' will populate the most recent content in the
              following order:</strong></p>
              <p>1. All responses for ${firm}</p>
              <p>2. All responses from any firm (applies only when the firm
              toggle is disabled)</p>`;
            } else {
              this.secondaryText = `<p><strong>Selecting 'Most Recent' will populate the most recent content in the
                following order:</strong></p>
                <p>1. All responses for ${entity} and ${firm}</p>
                <p>2. All responses for ${entity} and for any firm (applies only when the firm
                toggle is disabled)</p>
                <p>3. All responses from any entity for ${firm} (applies only when the entity
                toggle is disabled)</p>
                <p>4. All responses from any entity and for any firm (applies only when both toggles
                are disabled)</p>`;
            }
          } else if (this.user.isFreeSubscription) {
            if (!showFirmDetails) {
              this.secondaryText = `<p><strong>Selecting 'Most Recent' will populate the most recent content in the
              following order:</strong></p>
              <p>1. All responses for ${entity}</p>
              <p>2. All responses from any entity (applies only when the entity
                toggle is disabled)</p>`;
            } else {
              this.secondaryText = `<p><strong>Selecting 'Most Recent' will populate the most recent content in the
              following order:</strong></p>
              <p>1. All responses for ${entity} and submitted to ${firm}</p>
              <p>2. All responses for ${entity} and for any investor firm (applies only when the investor firm
              toggle is disabled)</p>
              <p>3. All responses from any entity submitted to ${firm} (applies only when the entity
              toggle is disabled)</p>
              <p>4. All responses from any entity and for any investor firm (applies only when both toggles
              are disabled)</p>`;
            }
          } else {
            if (!showFirmDetails) {
              this.secondaryText = `<p><strong>Auto-filling from the Q/A Center and including project responses will 
              populate content in the following order:</strong></p>
              <p>1. Q/A library responses for ${entity}</p>
              <p>2. All responses for ${entity}</p>
              <p>3. Q/A library responses from any entity (applies only when the entity
                toggle is disabled)</p>
              <p>4. All responses from any entity (applies only when the entity
                toggle is disabled)</p>`;
            } else {
              this.secondaryText = `<p><strong>Auto-filling from the Q/A Center and including project responses will 
                populate content in the following order:</strong></p>
                <p>1. Q/A library responses for ${entity}</p>
                <p>2. All responses for ${entity} and submitted to ${firm}</p>
                <p>3. All responses for ${entity} and for any investor firm (applies only when the investor firm
                toggle is disabled)</p>
                <p>4. Q/A library responses from any entity (applies only when the entity
                  toggle is disabled)</p>
                <p>5. All responses from any entity submitted to ${firm} (applies only when the entity
                toggle is disabled)</p>
                <p>6. All responses from any entity and for any investor firm (applies only when both toggles
                are disabled)</p>`;
            }
          }
        } else {
          const entity = this.entityName
            ? this.entityName
            : 'the selected entity';
          const firm = this.firmName ? this.firmName : 'the same firm';
          if (this.user.isInvestor) {
            this.secondaryText = `<p><strong>Selecting a specific entity will populate content in the
              following order:</strong></p>
              <p>1. All responses for ${entity} and ${firm}</p>
              <p>2. All responses for ${entity} and for any firm (applies only when the firm
                toggle is disabled)</p>`;
          } else if (this.user.isFreeSubscription) {
            if (!showFirmDetails) {
              this.secondaryText = `<p><strong>Selecting a specific entity will populate content in the
              following order:</strong></p>
              <p>1. All responses for ${entity}</p>`;
            } else {
              this.secondaryText = `<p><strong>Selecting a specific entity will populate content in the
                following order:</strong></p>
                <p>1. All responses for ${entity} and submitted to ${firm}</p>
                <p>2. All responses for ${entity} and for any investor firm (applies only when the firm
                toggle is disabled)</p>`;
            }
          } else {
            if (!showFirmDetails) {
              this.secondaryText = `<p><strong>Auto-filling from a selected entity and including project
               responses will populate content in the following order:</strong></p>
              <p>1. Q/A library responses for ${entity}</p>
              <p>2. All responses for ${entity}</p>`;
            } else {
              this.secondaryText = `<p><strong>Auto-filling from a selected entity and including project
              responses will populate content in the following order:</strong></p>
                <p>1. Q/A library responses for ${entity}</p>
                <p>2. All responses for ${entity} and submitted to ${firm}</p>
                <p>3. All responses for ${entity} and for any investor firm (applies only when the firm
                toggle is disabled)</p>`;
            }
          }
        }
      }
    }
  }
}
