import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-recent-documents',
  templateUrl: './recent-documents.component.html',
})
export class RecentDocumentsComponent implements OnInit {
  public gridDataSource: any = [];
  isLoading = false;
  @Input('heading') public title;

  constructor(
    private router: RouterService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.getDataSource();
  }

  getDataSource() {
    let self = this;
    self.isLoading = true;
    // this.toaster.info('Please wait...');
    let url =
      '/attachments?sort_by=as_of_date&sort_direction=Ascending&recordsPerPage=5';
    try {
      self.http.get(url).subscribe(
        (response: any) => {
          self.toaster.clear();
          self.gridDataSource = response;
          self.isLoading = false;
        },
        (error: any) => {
          self.toaster.clear();
        }
      );
    } catch (error) {
      self.toaster.clear();
    }
  }

  redirectToDocDetail(docId) {
    this.router.navigateWithParams('app.content.document.detail', {
      documentId: docId,
    });
  }

  redirectToMore() {
    this.router.navigate('app.content.documents');
  }
}

