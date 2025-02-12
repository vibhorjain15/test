import { CdkStep } from '@angular/cdk/stepper';
import {
  Component,
  forwardRef,
  Input,
  Inject,
  OnInit,
  Output,
  EventEmitter,
  TemplateRef,
} from '@angular/core';
import { DvStepperComponent } from '../dv-stepper.component';
import { InvestorService } from 'src/app2/modules/invite/investor/service/investor.service';

@Component({
  selector: 'dv-step',
  templateUrl: './dv-step.component.html',
  providers: [{ provide: CdkStep, useExisting: DvStepComponent }],
  styleUrls: ['./dv-step.component.css'],
})
export class DvStepComponent extends CdkStep implements OnInit {
  @Input() discription: string;
  @Input() ToolTip: string;
  @Input() isBackButton: boolean = false;
  @Input() showDescription: boolean = true;
  @Input() previousLabel;
  @Input() nextLabel;
  @Input() finishLabel;
  @Input() isLoading = false;
  @Input() editorTempRef: TemplateRef<any>;
  @Input() isDisabled = false;
  @Input() isEntityRequestFlow = false;
  @Input() disableFinishbutton = false;
  @Input() FinishButtonTooltip: string = '';

  @Output() onBackClick = new EventEmitter();
  @Output() onNextClick = new EventEmitter();
  @Output() onFinishClick = new EventEmitter();
  subscription: any;
  constructor(
    @Inject(forwardRef(() => DvStepperComponent)) stepper: DvStepperComponent,
    private readonly investor: InvestorService
  ) {
    super(stepper);
    this.subscription = this.investor.nextButtonData$.subscribe((data) => {
      if (this.isEntityRequestFlow) {
        this.isDisabled = data;
      }
    });
  }
  handleBackClick() {
    this.onBackClick.emit();
  }
  handleNextClick() {
    this.onNextClick.emit();
  }
  handleFinishClick() {
    this.onFinishClick.emit();
  }

  ngOnInit() {}
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
