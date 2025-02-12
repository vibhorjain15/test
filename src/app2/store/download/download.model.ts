export class DownloadInfo {
  status: number;
  task_id: number;
  file_data: any;
  type: string;
  downloaded_at: string;
  downloaded_by: string;
  expiry_date: string;
  insert_time_stamp: string;
  task_name: string;
  expired: boolean;
  is_downloadable: boolean;
}

export class DownloadList {
  downloads: DownloadInfo[];
  active: boolean;
}
