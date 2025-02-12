import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'add-disclaimer',
  templateUrl: './add-disclaimer.component.html',
  styleUrls: ['./add-disclaimer.component.css'],
})
export class AddDisclaimerComponent implements OnInit {
  @Input() entityId: number;
  @Input() entityType: string;
  @Input() disclaimerId: number;
  @Input() entityName: string;
  @Input() success: any;
  @Input() updating: boolean;
  disclaimers: any[];
  saving: boolean;
  disclaimer: any;
  constructor(
    private readonly questionnaireService: QuestionnaireService,
    private readonly router: RouterService,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.getDisclaimers();
  }

  getDisclaimers() {
    this.questionnaireService.getDisclaimers().subscribe((response: any) => {
      this.disclaimers = response;
      if (this.disclaimerId) {
        this.disclaimer = this.disclaimers.find(
          (x) => x.id === this.disclaimerId
        );
      }
    });
  }

  redirectToDisclaimerDefinitions() {
    this.router.navigate('app.firm.settings.disclaimers');
  }

  onSelectChange(disclaimer) {
    this.disclaimer = disclaimer;
  }

  submit(modalCallback) {
    if (this.disclaimers.length && this.disclaimer?.id) {
      this.saving = true;
      const params = {
        entity_type: this.entityType,
        entity_id: this.entityId,
        disclaimer_id: this.disclaimer.id,
      };

      this.questionnaireService
        .saveDisclaimerAssignment(params)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe((response: any) => {
          this.toaster.success('Disclaimer successfully attached!');
          if (this.success) {
            this.success(this.disclaimer);
          }
          modalCallback();
        });
    }
  }
}
