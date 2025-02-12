import { Action, Selector, State, StateContext } from '@ngxs/store';
import {
  SetActive,
  SetDownload,
  SetDownloadList,
  WebsocketFileReceived,
} from './download.action';
import { DownloadList, DownloadInfo } from './download.model';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { WebSocketDisconnected } from '@ngxs/websocket-plugin';
import { DownloadStatus } from 'src/app2/shared/constants/constant';

@State<DownloadList>({
  name: 'downloadList',
  defaults: {
    downloads: [],
    active: false,
  },
})
@Injectable()
export class WebsocketMessageState {
  constructor(private readonly toaster: ToastrService) {}

  @Selector()
  static getDownloads(state: DownloadList) {
    return state.downloads;
  }

  @Action(WebsocketFileReceived)
  WebsocketFileReceived(
    { getState, patchState }: StateContext<DownloadList>,
    resource: DownloadInfo
  ) {
    let state = JSON.parse(JSON.stringify(getState()));
    if (resource.status == DownloadStatus.success) {
      let filename = resource.file_data?.reduce(
        (previousValue, currentValue, idx) => {
          return idx == 0
            ? currentValue.file_name
            : previousValue + ', ' + currentValue.file_name;
        },
        ''
      );
      let newDownload = {
        file_data: resource.file_data,
        filename: filename,
        expiry_date: resource.expiry_date,
        downloaded_on: resource.downloaded_at ? resource.downloaded_at : null,
        task_id: resource.task_id,
        status: resource.status,
        requested_on: resource.insert_time_stamp,
        task_name: resource.task_name,
        expired: resource.expired,
        is_downloadable: resource.is_downloadable,
      };
      state.downloads.push(newDownload);
      this.toaster.success('Your document is ready for download.');
    } else if (resource.status == DownloadStatus.failed) {
      this.toaster.error(
        'Your document export request was unsuccessful. Please try again.'
      );
    }
    patchState(state);
  }

  @Action(SetDownloadList)
  SetDownloadList(state, { downloadlist }: SetDownloadList) {
    state.setState(downloadlist);
  }

  @Action(WebSocketDisconnected)
  WebSocketDisconnected({ patchState }, handler) {
    patchState({ active: false });
  }

  @Action(SetDownload)
  SetDownload({ getState, patchState }, { editedDownload }: SetDownload) {
    let state = JSON.parse(JSON.stringify(getState()));
    let index = state.downloads.findIndex((download) => {
      return download.task_id == editedDownload.task_id;
    });
    let newDownload = JSON.parse(JSON.stringify(editedDownload));
    if (index > -1) {
      state.downloads[index] = {
        ...newDownload,
        downloaded_at: newDownload.downloaded_on,
        insert_time_stamp: newDownload.requested_on,
      };
    }
    patchState(state);
  }

  @Action(SetActive)
  SetActive({ patchState }, active) {
    patchState(active);
  }

  @Selector()
  static getActive(state: DownloadList) {
    return state.active;
  }
}
