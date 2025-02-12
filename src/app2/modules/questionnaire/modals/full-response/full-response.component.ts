import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { ToastrService } from 'ngx-toastr';
import { DvHandsontableComponent } from 'src/app2/shared/components';
import { HandsOnTableGridHelper } from 'src/app2/shared/helpers/handsOnTableGridHelper';
import { ResponseType } from '../../constants/Response-type.constant';
import { copyHtml } from '../../util/copy-html.util';
@Component({
  selector: 'app-full-response',
  templateUrl: './full-response.component.html',
  styleUrls: ['./full-response.component.css'],
})
export class FullResponseModal {
  @Input() qaItem;
  ResponseType = ResponseType;

  constructor(
    private readonly clipboard: ClipboardService,
    private readonly toaster: ToastrService
  ) {}

  submit(close) {
    if (
      this.qaItem.responseType != ResponseType.Grid &&
      this.qaItem.responseType != ResponseType.DynamicGrid
    ) {
      copyHtml(this.qaItem.responseTextCopy, this.clipboard, this.toaster);
    } else {
      copyHtml(
        this.getSimpleTable(this.qaItem?.gridData?.tableData),
        this.clipboard,
        this.toaster
      );
    }
    close();
  }

  getSimpleTable(data) {
    const gridData = data;

    // Create an HTML string representing the table structure
    let html = '<table border="1">';
    for (let i = 0; i < gridData.length; i++) {
      html += '<tr>';

      for (let j = 0; j < gridData[i].length; j++) {
        let data =
          gridData[i][j] == null || gridData[i][j] == undefined
            ? ''
            : gridData[i][j];
        html += '<td>' + data + '</td>';
      }
      html += '</tr>';
    }
    html += '</table>';
    return html;
  }
}
