import { Component, Input, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { forkJoin } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { RouterService } from 'src/app2/services/router.service';
import { EntityType } from 'src/app2/shared/constants/constant';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';
@Component({
  selector: 'template-info',
  templateUrl: './template-info.component.html',
  styleUrls: ['./template-info.component.css'],
})
export class TemplateInfoComponent implements OnInit {
  diligence: DiligenceType;
  @Select(UserState.getCurrentUserData) userData;
  isAdmin: any;
  @Input() showFirstButton: boolean = false;
  templateData: any;
  title: string;
  loading: boolean;
  buttonLoad: boolean;
  is_due: boolean;
  showDueDate: boolean = true;
  @Input() templateMetaData: any;
  @Input() description: any;
  @Input() user: any;
  constructor(
    private readonly store: Store,
    private questionnaire: QuestionnaireService,
    private readonly route: RouterService
  ) {}

  ngOnInit(): void {
    this.userData.pipe(take(2),tap((userData) => {
      if (!userData) {
        this.store.dispatch(new GetCurrentUser());
      }
    })).subscribe((data) => {
      if (data) {
        this.isAdmin = data.isAdmin;
      }
    });
    this.loading = true;
    this.diligence = this.store.selectSnapshot(
      (state) => state.questionnaire.diligence
    );

    this.is_due = [
      'Started',
      'Followup',
      'ExtensionRequested',
      'Completed',
      'Approved',
    ].includes(this.diligence.status);

    if (this.diligence.diligence_type === 'dd_profile') {
      this.showDueDate = false;
    }

    this.templateData = {
      templateInfo: {
        is_draft: true,
        id: this.diligence.template_id,
      },
      version: this.diligence.template_version,
      isManager: true,
      status: this.diligence.status,
    };

    if (!this.description && !this.templateMetaData) {
      let obj = [];
      obj.push(this.questionnaire.getTemplateDesc(this.diligence.template_id));
      obj.push(
        this.questionnaire.getTemplateInfo(
          this.diligence.template_id,
          this.diligence.template_version
        )
      );

      forkJoin(obj).subscribe((res) => {
        this.description = res[0];
        let regex = /<br>|<br \/>|&nbsp;/g;
        if (this.description)
          this.description = this.description.replace(regex, '');
        this.templateMetaData = res[1];
        this.loading = false;
      });
    } else {
      this.loading = false;
    }
  }

  handleDontShowAgain(close) {
    this.buttonLoad = true;
    this.questionnaire
      .putModalPopUpInfo({
        entity_id: this.diligence.id,
        entity_type: EntityType.Project,
        intro_json: { template_info_modal: true },
      })
      .subscribe(
        (res) => {
          this.buttonLoad = false;
          close();
        },
        (err) => {
          this.buttonLoad = false;
        }
      );
  }
  navigateToFirmPref(){
    this.route.navigateWithParams('app.firm.settings.preferences',{
      '#': 'QuestionnaireDefaults'
    });
  }
  navigateToMyAdmins(){
    this.route.navigate(`app.settings.my_admins`);
  }
}
