import { HttpClient } from '@angular/common/http';
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { saveAs } from 'file-saver';
import { UtilsService } from 'src/app2/services/utils.service';
import { Regex, TooltipMessage } from 'src/app2/shared/constants/constant';
type IconListType = {
  name: string;
  tooltip: string;
  isactive?: boolean;
  isDisabled?: boolean;
  isHighlighted?: boolean;
};
@Component({
  selector: 'dv-move-row',
  templateUrl: './dv-move-row.component.html',
  styleUrls: ['./dv-move-row.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DvMoveRowComponent implements OnInit, AfterViewInit {
  @Input() hideMoveIcon = false;
  @Input() isHover = false;
  @Input() boldTitleText = false;
  @Input() title = 'INvesteents of rthe future';
  @Input() iconList: IconListType[] = [
    { name: 'pencil', tooltip: 'Edit' },
    { name: 'trashcan', tooltip: 'Delete', isactive: true },
  ];
  @Input() showIconsAlways = false;
  @Input() isActive = false;
  @Input() isConditionalQuestion = false;

  @Output() onIconClick = new EventEmitter();
  @Output() onRowClick = new EventEmitter();
  tooltipMessage = TooltipMessage;
  showIcons = false;
  constructor(private elementRef: ElementRef, private utils: UtilsService) {}
  ngOnInit(): void {
    this.iconList = this.iconList.filter((x) => !x.isDisabled);
  }

  ngAfterViewInit(): void {
    const attachmentQuestion =
      this.elementRef.nativeElement.querySelector('#attachmentUrl');
    if (attachmentQuestion) {
      attachmentQuestion.addEventListener(
        'click',
        this.downloadAttachment.bind(this)
      );
    }
  }

  mouseEnter() {
    this.showIcons = true;
  }
  mouseLeave() {
    this.showIcons = false;
  }
  handleIconClick(event, icon) {
    event.stopPropagation();
    if (icon.isDisabled) return;
    this.onIconClick.emit(icon);
  }
  handleRowClick(event) {
    event.stopPropagation();
    this.onRowClick.emit();
  }

  downloadAttachment(event) {
    event.stopPropagation();
    const targetUrl = this.utils.extractDownloadUrl(event);
    this.utils.downloadAttachment(targetUrl);
  }
}
