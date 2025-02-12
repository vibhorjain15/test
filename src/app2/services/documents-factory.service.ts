import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { PopupCheckerService } from './popup-checker.service';
import { GridService } from './grid.service';

@Injectable({
  providedIn: 'root',
})
export class DocumentsFactoryService {
  documentPageUrl = '';
  Navigator: any = navigator;
  Window: any = window;

  constructor(
    private readonly toaster: ToastrService,
    private readonly http: HttpClient,
    private readonly popupCheckerService: PopupCheckerService,
    private readonly gridService: GridService
  ) {}

  formatTagsTooltip(tagsList) {
    if (tagsList && tagsList.length > 1) {
      return tagsList.slice(1).join(',');
    }
  }

  setDocumentPageUrl(url) {
    this.documentPageUrl = url;
  }

  getDocumentPageUrl() {
    return this.documentPageUrl;
  }

  documentGroupName(grid, row, col) {
    let entity;
    if (row.groupHeader && row.treeNode.children[0]) {
      ({ entity } = row.treeNode.children[0].row);
      const group = entity.group_names.length
        ? entity.group_names != null
          ? entity.group_names.join()
          : undefined
        : 'Ungrouped';
      return group;
    }
    return row.entity.name;
  }

  getDocumentGroupName(grid, row, col) {
    const { entity } = row;
    const group = entity.group_names.length
      ? entity.group_names != null
        ? entity.group_names.join()
        : undefined
      : 'Ungrouped';
    return group;
  }

  getGroupHeaderName(grid, row, col) {
    //Hack to display the group header name. when the grouping has null values. It was not displaying the
    //group name properly. this logic iterates through the treenode aggregations array and displays the group name
    //only if groupVal is not empty otherwise we generate custom groupname
    for (
      let i = 0, end = row.treeNode.aggregations.length, asc = 0 <= end;
      asc ? i < end : i > end;
      asc ? i++ : i--
    ) {
      const agg = row.treeNode.aggregations[i];
      if (agg.groupVal) {
        if (agg.groupVal.length > 0) {
          return agg.rendered;
        } else {
          return 'Ungrouped(' + agg.value + ')';
        }
      }
    }
  }

  getSignedURL(entity, openDocument = true) {
    if (openDocument) {
      this.toaster.info('Opening the requested document.');
    }
    const id = entity.attachment_id ? entity.attachment_id : entity.id;
    let request = this.http.get(`attachments/${id}/signed_url`);

    if (openDocument) {
      request.subscribe((response: any) => {
        const popup = window.open(response, '_blank');
        this.popupCheckerService.check(popup);
      });
    }
    return request;
  }

  downloadDocument(entity: any) {
    let id = entity.attachment_id ? entity.attachment_id : entity.id;
    let request = this.http.get(`attachments/${id}/download`, {
      responseType: 'blob',
      observe: 'response',
    });
    return request;
  }

  saveDownloadAudit(entity) {
    let params = {
      no_of_records: 1,
      file_name: entity.name,
      task_name: 'Document',
    };
    this.gridService.saveDownloadAudit(params).subscribe((response) => {
      return;
    });
  }

  // Similar to excel download in excel sync
  downloadAttachment(url: any) {
    return this.http
      .get(url, { responseType: 'arraybuffer', observe: 'response' })
      .subscribe((response: any) => {
        let blob: any, ex: any;
        const octetStreamMime = 'application/octet-stream';
        let success = false;
        // Get the filename from the x-filename header or default to "download.bin"
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename_from_header = contentDisposition
          .split(';')[1]
          .split('filename')[1]
          .split('=')[1]
          .trim();
        const filename = filename_from_header || 'download.xlsx';
        // Determine the content type from the header or default to "application/octet-stream"
        const contentType =
          response.headers.get('content-type') || octetStreamMime;
        try {
          // Try using msSaveBlob if supported
          blob = new Blob([response.body], { type: contentType });
          if (this.Navigator.msSaveBlob) {
            this.Navigator.msSaveBlob(blob, filename);
          } else {
            // Try using other saveBlob implementations, if available
            const saveBlob =
              this.Navigator.webkitSaveBlob ||
              this.Navigator.mozSaveBlob ||
              this.Navigator.saveBlob;
            if (!saveBlob) {
              throw 'Not supported';
            }
            saveBlob(blob, filename);
          }
          success = true;
        } catch (error) {
          ex = error;
        }
        if (!success) {
          // Get the blob url creator
          const urlCreator =
            this.Window.URL ||
            this.Window.webkitURL ||
            this.Window.mozURL ||
            this.Window.msURL;
          if (urlCreator) {
            // Try to use a download link
            let url: any;
            const link = document.createElement('a');
            if ('download' in link) {
              // Try to simulate a click
              try {
                // Prepare a blob URL
                blob = new Blob([response.body], { type: contentType });
                url = urlCreator.createObjectURL(blob);
                link.setAttribute('href', url);
                // Set the download attribute (Supported in Chrome 14+ / Firefox 20+)
                link.setAttribute('download', filename);
                // Simulate clicking the download link
                const event = document.createEvent('MouseEvents');
                event.initMouseEvent(
                  'click',
                  true,
                  true,
                  window,
                  1,
                  0,
                  0,
                  0,
                  0,
                  false,
                  false,
                  false,
                  false,
                  0,
                  null
                );
                link.dispatchEvent(event);
                success = true;
              } catch (error1) {
                ex = error1;
              }
            }
            if (!success) {
              // Fallback to window.location method
              try {
                // Prepare a blob URL
                // Use application/octet-stream when using window.location to force download
                blob = new Blob([response.body], { type: octetStreamMime });
                url = urlCreator.createObjectURL(blob);
                window.location = url;
                success = true;
              } catch (error2) {
                ex = error2;
              }
            }
          }
        }
      });
  }
}
