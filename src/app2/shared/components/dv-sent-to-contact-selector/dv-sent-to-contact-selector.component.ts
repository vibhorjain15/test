import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';

@Component({
  selector: 'app-dv-sent-to-contact-selector',
  templateUrl: './dv-sent-to-contact-selector.component.html',
  styleUrls: ['./dv-sent-to-contact-selector.component.css'],
})
export class DvSentToContactSelectorComponent implements OnInit {
  @Input() diligence: any;
  @Input() sentToContactsList: any[] = [];
  @Output() onChange = new EventEmitter<any>();
  contactLoaded: boolean;
  all_contacts: any[] = [];
  contacts: any[] = [];
  textFilter: string = '';
  @ViewChild('contactForm') form: NgForm;
  saving_contact: boolean;

  constructor(
    private readonly ProjectSummaryService: ProjectSummaryService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.contactLoaded = false;
    this.getRelatedContacts();
  }

  getRelatedContacts() {
    this.ProjectSummaryService.getRelatedContacts(
      this.diligence.tofirm_id,
      'Firm',
      true
    ).subscribe((response: any) => {
      this.all_contacts = response;
      this.contactLoaded = true;
      this.modifyRelatedContacts();
    });
  }

  modifyRelatedContacts() {
    const allMembers = this.all_contacts;
    this.contacts = allMembers.filter((f: any) => {
      return !this.sentToContactsList.some((d: any) => {
        return d.user_id === f.id;
      });
    });
    this.contacts.map(
      (member: any) =>
        (member.joinedName = member.firstName + ' ' + member.lastName)
    );
  }

  addNewContactEmail() {
    this.form.form.markAllAsTouched();
    if (this.form.valid) {
      this.saving_contact = true;
      const params = {
        firmInfo: { id: this.diligence.tofirm_id },
        send_invitation: true,
        userName: this.form.value.email,
      };
      this.http
        .post('contacts?skip_name_validation=true', params).subscribe((response: any) => {
          this.saving_contact = false;
          const message = 'Contact added Successfully';
          this.toaster.success(message);
          this.onChange.emit(response);
          this.form.reset();
          this.getRelatedContacts();
        },(error: any) => {
          this.saving_contact = false;
        });
    }
  }

  select(user) {
    this.onChange.emit(user);
  }
}
