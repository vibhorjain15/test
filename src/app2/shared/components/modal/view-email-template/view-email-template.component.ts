import { Component, Input, OnInit } from '@angular/core';
import { IEmailTemplate } from 'src/app2/services/manage-email-template/manage-email-template.types';

@Component({
  selector: 'view-email-template',
  templateUrl: './view-email-template.component.html',
  styleUrls: ['./view-email-template.component.css'],
})
export class ViewEmailModal implements OnInit {
  @Input() emailObj: IEmailTemplate;
  text: string;
  title: string;
  ngOnInit() {
    this.text = this.emailObj.content.replace(/<br\s*[\/]?>/gi, '\n');
    this.title = this.emailObj.name;
  }
}
