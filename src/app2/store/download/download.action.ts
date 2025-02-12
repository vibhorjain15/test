import { DownloadInfo, DownloadList } from './download.model';

export class WebsocketFileReceived {
  static readonly type = '[Websocket] FileReceived';
  constructor(public newDownload: DownloadInfo) {}
}

export class SetDownloadList {
  static readonly type = '[Websocket] SetDownloadList';
  constructor(public downloadlist: DownloadList) {}
}

export class SetDownload {
  static readonly type = '[Websocket] SetDownload';
  constructor(public editedDownload: DownloadInfo) {}
}

export class SetActive {
  static readonly type = '[Websocket] SetActive';
  constructor(public active: boolean) {}
}
