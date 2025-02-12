import {
  Component,
  OnInit,
  Output,
  TemplateRef,
  EventEmitter,
  Input,
  ElementRef,
} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ModalService } from 'src/app2/services/modal.service';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
})
export class ModalComponent implements OnInit {
  @Input() title: string;
  @Input() titleIcon: string;
  @Input() titleIconColor: string;
  @Input() description: string = null;
  @Input() subTitle: string;
  @Input() firstButtonLabel: string;
  @Input() newCreateButtonLabel: string;
  @Input() secondButtonLabel: string;
  @Input() thirdButtonLabel: string;
  @Input() isNewCreateButton: false;
  @Input() isbackButton: boolean = false;
  @Input() cancelButtonLabel: string = 'Cancel';
  @Input() firstButtonType: string = 'primary';
  @Input() cancelButtonType: string = 'default';
  @Input() leftActionButtonLabel: string;
  @Input() isCancelButton: boolean = true;
  @Input() showHeader: boolean = true;
  @Input() showCustomHeader:boolean=false;
  @Input() isFooter: boolean = true;
  @Input() isCustomFooter: boolean = false;
  @Input() footerTemplate: TemplateRef<any>;
  @Input() initialTemplate: TemplateRef<any>;
  @Input() isLoading: boolean = false;
  @Input() isSecondaryLoading: boolean = false;
  @Input() isThirdLoading: boolean = false;
  @Input() isFirstButtonDisabled: boolean = false;
  @Input() secondButtonType:
    | 'primary'
    | 'default'
    | 'orange'
    | 'orange-fill'
    | 'transparent'
    | 'secondary'
    | 'darkBlue'
    | 'link'
    | 'success'
    | 'orange-border'
    | 'btn-link'
    | 'blue-border' = 'default';
  @Input() footerAlignment = 'right';
  @Input() footerClass = '';
  @Input() footerText: string;
  @Input() isSecondButtonDisabled: boolean = false;
  @Input() firstButtonTooltip = '';
  @Input() newCreateTooltip = '';
  @Input() isAngularJs = false;
  @Input() secondButtonTooltip;
  @Input() isInnerScroll: boolean = false;
  @Output() onFirstClick: EventEmitter<() => void> = new EventEmitter();
  @Output() onSecondClick: EventEmitter<() => void> = new EventEmitter();
  @Output() onCancelClick?: EventEmitter<() => void> = new EventEmitter();
  @Output() onThirdClick: EventEmitter<() => void> = new EventEmitter();
  @Output() onBackClick: EventEmitter<() => void> = new EventEmitter();
  @Output() onNewCreateClick: EventEmitter<() => void> = new EventEmitter();
  @Output() onLeftActionClick?: EventEmitter<() => void> = new EventEmitter();

  bgColor;
  currentTemp: TemplateRef<any>;

  constructor(
    public elementRef: ElementRef,
    public bsModalRef: ModalService,
    public bsModalNewRef: BsModalRef,
    private readonly utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.currentTemp = this.initialTemplate;
    if (this.titleIcon && this.titleIconColor)
      this.bgColor = this.utils.getBgWithOpacity(this.titleIconColor);
  }

  handleOnClick() {
    this.onFirstClick.emit(() => {
      this.closeModal();
    });
  }

  handleOnSecondClick() {
    this.onSecondClick.emit(() => {
      this.closeModal();
    });
  }

  handleOnThirdClick() {
    this.onThirdClick.emit(() => {
      this.closeModal();
    });
  }

  handleBackClick() {
    this.onBackClick.emit(() => {
      this.closeModal();
    });
  }

  handleNewCreateClick() {
    this.onNewCreateClick.emit(() => {
      this.closeModal();
    });
  }

  handleOnLeftActionClick() {
    this.onLeftActionClick.emit();
  }

  closeModal() {
    // if (this.isAngularJs) this.bsModalRef.closeAllActiveModals();
    this.bsModalNewRef.hide();
  }

  handleOnCancelClick() {
    if (this.onCancelClick.observers.length > 0) {
      this.onCancelClick.emit(() => {
        this.closeModal();
      });
      return;
    }
    this.closeModal();
  }

  setModalSizeClass(className: string): void {
    this.isAngularJs
      ? this.setAngularJsModalSizeClass(className)
      : this.setAngularModalSizeClass(className);
  }

  private setAngularModalSizeClass(className: string): void {
    this.bsModalNewRef.setClass(className);
  }

  private setAngularJsModalSizeClass(className: string): void {
    let modalContainer: HTMLElement | null = null;
    let currentElement = this.elementRef.nativeElement as HTMLElement;
    while (currentElement) {
      if (currentElement.classList.contains('modal-dialog')) {
        modalContainer = currentElement;
        break;
      }

      currentElement = currentElement.parentElement;
    }

    if (modalContainer) {
      modalContainer.classList.value = `modal-dialog ${className}`;
    }
  }
}
