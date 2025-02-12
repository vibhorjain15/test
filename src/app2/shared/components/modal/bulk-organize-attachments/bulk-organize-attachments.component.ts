import { HttpClient, HttpContext } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  ErrorStatusCode,
  SKIP_400_ALERT,
} from 'src/app2/shared/constants/constant';

@Component({
  selector: 'bulk-organize-attachments',
  templateUrl: './bulk-organize-attachments.component.html',
  styleUrls: ['./bulk-organize-attachments.component.css'],
})
export class BulkOrganizeAttachmentsModal implements OnInit {
  @Input() callback;
  @Input() selectedTab: 'MyAttachments' | 'Received';
  loading: boolean = false;
  folderSchemes = [];
  isValid = true;
  asOfDateFolderTypes = [
    {
      id: 1,
      label: 'Year',
      icon: null,
      iconSize: null,
      isSelected: true,
      organizeBy: 'as_of_date_year',
    },
    {
      id: 2,
      label: 'Month',
      icon: null,
      iconSize: null,
      isSelected: false,
      organizeBy: 'as_of_date_year,as_of_date_month',
    },
    {
      id: 3,
      label: 'Individual Dates',
      icon: null,
      iconSize: null,
      isSelected: false,
      organizeBy: 'as_of_date_year,as_of_date_month,as_of_date',
    },
  ];
  folderSchemeForm;

  constructor(
    private readonly toastrService: ToastrService,
    private readonly httpClient: HttpClient
  ) {}

  ngOnInit() {
    this.folderSchemeForm = new FormGroup({
      id: new FormControl(1, [Validators.required]),
    });
    if (this.selectedTab == 'MyAttachments') {
      this.folderSchemes = [
        {
          id: 1,
          label: 'As of Date',
          helpText: 'Organize documents into folders by As of Date',
          isSelected: true,
        },
      ];
    } else {
      this.folderSchemes = [
        {
          id: 1,
          label: 'As of Date',
          helpText: 'Organize documents into folders by As of Date',
          isSelected: true,
        },
        {
          id: 2,
          label: 'Owner Firm',
          helpText: 'Organize documents into folders by Owner Firm name',
          isSelected: false,
        },
        {
          id: 3,
          label: 'Owner Firm & As of Date',
          helpText:
            'Organize documents into folders by Owner Firm name and associated As of Date',
          isSelected: false,
        },
      ];
    }
  }

  save(callback) {
    let organizeBy = '';
    switch (this.folderSchemeForm.value.id) {
      case 1:
        organizeBy = this.asOfDateFolderTypes.find(
          (item) => item.isSelected
        ).organizeBy;
        break;
      case 2:
        organizeBy = 'associated_firm';
        break;
      case 3:
        organizeBy =
          'associated_firm,' +
          this.asOfDateFolderTypes.find((item) => item.isSelected).organizeBy;
        break;
    }
    if (!organizeBy) {
      this.toastrService.error('Please select a valid folder scheme');
      return;
    }
    this.loading = true;
    this.httpClient
      .post(
        'document_folders/bulk_organize',
        {
          type: this.selectedTab.toLowerCase(),
          organize_by: organizeBy,
        },
        {
          context: new HttpContext().set(SKIP_400_ALERT, true),
        }
      )
      .subscribe(
        () => {
          this.toastrService.success(
            'Applicable documents have been organized successfully!'
          );
          if (this.callback) this.callback();
          callback();
          this.loading = false;
        },
        (err) => {
          if (err.status === ErrorStatusCode.BadRequest && err.error?.message) {
            this.toastrService.error(err.error.message);
          } else {
            this.toastrService.error(
              'Something went wrong while organizing the documents'
            );
          }
          this.loading = false;
        }
      );
  }

  handleFolderSchemeSelectionChange() {
    this.asOfDateFolderTypes.forEach((type) => {
      type.isSelected = type.id == 1;
    });
  }
}
