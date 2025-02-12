import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-document-groups',
  templateUrl: './document-groups.component.html',
  styleUrls: ['./document-groups.component.css'],
})
export class DocumentGroupsComponent implements OnInit {
  contactInfo;
  documentTags;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.contactInfo = {
      label: 'Document Groups',
      name: 'Attachments',
      desc: 'grouping of documents, eg. Compliance, Marketing, Investments, etc',
    };
    this.getDocumentTypes();
  }

  getDocumentTypes() {
    this.http
      .get('tags', { params: { type: 'Attachments' } })
      .subscribe((response: any) => {
        this.documentTags = response;
        this.sortTags();
      });
  }

  sortTags() {
    this.documentTags.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
  }
}

