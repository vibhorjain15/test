import { Component, OnInit } from '@angular/core';

import { DataService } from 'src/app2/services/data.service';
@Component({
  selector: 'app-faqs',
  templateUrl: './faqs.component.html',
  styleUrls: ['./faqs.component.css']
})
export class FAQsComponent implements OnInit {
  isLastOneOpen = false;
  sidebarTemplate: string;
  search_text = '';
  sidebarTitle;
  sidebarContent;
  displaySidebarPanel;
  investment: {};
  tag_list: {};
  tags = [];
  faqs = [
    {
      section_id: 1,
      section_title: "My Account Security",
      questions:[
        {
          id: 1,
          text: "Do I need a login and password?",
          is_premium: false,
          answer: "<p> Yes, for enhanced security, everyone on the DiligenceVault platform needs a login and password. In addition to other features and protocols that DiligenceVault has in place to protect its community, a password and login help protect your information as well as that of your business partners. Features such as passwords and logins help make the DiligenceVault platform more secure than email-based information exchange. </p>"
        },
        {
          id: 2,
          text: "Can I have multi-factor authentication?",
          is_premium: false,
          answer: "<p> Yes, for enhanced security, everyone on the DiligenceVault platform needs a login and password. In addition to other features and protocols that DiligenceVault has in place to protect its community, a password and login help protect your information as well as that of your business partners. Features such as passwords and logins help make the DiligenceVault platform more secure than email-based information exchange. </p>"
        }
      ]
    },
    {
      section_id: 2,
      section_title: "Team Management",
      questions:[
        {
          id: 3,
          text: "How do I view who else from my firm / team has access to DiligenceVault?",
          is_premium: false,
          answer: '<p> Go to the top right corner, and select "Users & Teams". This page will show you list of all team members and their access levels. </p>'
        },
        {
          id: 4,
          text: "How do I add team members to the DiligenceVault platform?",
          is_premium: false,
          answer: '<p> Go to the top right corner, and select "Users & Teams". Once on the users page, please click on "+ Add New" button. The information fields should be self-explanatory. The more the merrier! </p>'
        },
        {
          id: 5,
          text: "How do change access level of team members?",
          is_premium: false,
          answer: '<p> Go to the top right corner, and select "Users & Teams". Once on the users page, navigate to the team member and change access level to Admin, Viewer or Owner. </p>'
        },
        {
          id: 6,
          text: "How do I re-send invitation to join the platform?",
          is_premium: false,
          answer: '<p> Go to the top right corner, and select "Users & Teams". Once on the users page, navigate to the team member and click on the refresh icon to re-send the invite. </p>'
        },
        {
          id: 7,
          text: "How do I unlock a user?",
          is_premium: false,
          answer: '<p> What if I get an alert about unlocking a user? Go to the top right corner, and select "Users & Teams". This page will show you list of all team members and the team member who is locked out would have a red border. Click on the open lock icon to re-enable your team members access. They will get an email that their account has been unlocked. </p>'
        },
        {
          id: 8,
          text: "What if I get an alert about approving a user? How do I approve a user's access?",
          is_premium: false,
          answer: "<p> From time to time certain users who join the platform would require approval from firm's admin for security reasons. Go to the top right corner, and select 'Users & Teams'. This page will show you list of all team members and the team member whose access is pending approval would have a light orange shade. Click on the check icon to approve your team members access. They will get an approval email. </p>"
        },
        {
          id: 9,
          text: "How do I remove a user from the team?",
          is_premium: false,
          answer: '<p> Go to the top right corner, and select "Users & Teams". Once on the page, navigate to the team member and click on the trash can icon to remove the user. </p>'
        }
      ]
    },
    {
      section_id: 3,
      section_title: "Due diligence Project",
      questions:[
        {
          id: 10,
          text: "How do I assign question / sections to team members?",
          is_premium: false,
          answer: "<p> Click on the person icon next to the section name, as well as on the right of each question and select a team member. They will receive a notification, and you can track status of the assignments in the Assignment tab </p>"
        },
        {
          id: 11,
          text: "Can the asset managers edit information after submission?",
          is_premium: false,
          answer: "<p> No, managers cannot edit any answers after submission. If they want to, they would have to request a restart of the project. </p>"
        },
        {
          id: 12,
          text: "Can asset managers request extension of due date?",
          is_premium: false,
          answer: "<p> Yes, you would receive an email notification, and you can approve due date extension or assign another due date on the Project Summary page. </p>"
        },
        {
          id: 13,
          text: "What are follow-ups?",
          is_premium: false,
          answer: "<p> This is when you want more information from asset managers. You will find this under the Diligence menu for any Project under the Questionnaire tab. When an investor wants more information, this can be significant, so Follow-ups is one of the menu items at the top of the Questionnaire screen. You will instantly see if you have any follow-ups, and you can filter the questionnaire to find your follow-ups. </p>"
        },
        {
          id: 14,
          text: "Do I have the ability to print on the DiligenceVault platform or to export documents?",
          is_premium: false,
          answer: "<p> Yes! Many people find it helpful to see a printout. For any Questionnaire you are working on, when you mouse over More Actions, you will find Preview. When you click on Preview, you will see options to print the whole questionnaire, or to filter by and print those questions that are answered or unanswered only. You can print what is relevant for you – either in hard copy on paper or you can just create a pdf if you prefer.</p>"
        },
        {
          id: 15,
          text: "What are internal notes and to-dos?",
          is_premium: false,
          answer: "<p>These features are found within Questionnaires and they exist to enhance collaboration and communication among your team. They are private to your team and are not shared with the investor. On the right side of the screen you will see three dots associated with any given question. These allow you to add Notes, or supporting comments, regarding a question, or stipulate a To-do (or task), among other things. You can alert any of your team members to this information with </p>"
        }
      ]
    },
    {
      section_id: 4,
      section_title: "Documents / Attachments",
      questions:[
        {
          id: 16,
          text: "What types of attachments are supported?",
          type: 'html',
          is_premium: false,
          answer: "<p>You can upload the following file types with upto 50MB each:</p> <ol><li>Document (doc, docx, pdf)</li><li>Excel (xls, xlsx)</li><li>Presentation (ppt, pptx, pps, ppsx, key)</li><li>Images (png, jpeg, jpg)</li><li>Emails (msg, eml)</li><li>Compressed (zip, rar)</li></ol>"
        },
        {
          id: 17,
          text: "How do I attach a document?",
          is_premium: false,
          answer: "<p> If the questionnaire asks for an attachment, click on the Upload and pick attachments to upload. If you wish to add attachments not requested, navigate to Documents tab and click on 'Add New' and populate the fields. </p>"
        },
        {
          id: 18,
          text: "How do I open or download an attachment? When I click on the file name, it doesn't open or download",
          is_premium: false,
          answer: "<p> Please check that you do not have a pop-up blocker active. You will see a red alert dot in your browser bar indicating that the document is blocked. You can select to download the document. But since you trust us, you can select the radio button that says always download from diligencevault.com :). </p>"
        },
        {
          id: 19,
          text: "How do I update a document version?",
          is_premium: false,
          answer: '<p> Navigate to Documents tab and click on the document. You can then access "Update Document" menu to add a new version of the document. </p>'
        },
        {
          id: 20,
          text: "How do I delete a document?",
          is_premium: false,
          answer: '<p> Navigate to Documents tab and click on the document. You can then access "Delete Document" to delete a document. </p>'
        },
        {
          id: 21,
          text: "How do I share a document? ",
          is_premium: true,
          answer: "<p> Navigate to Documents tab and click on the document. You can then access 'Share Document'and then select the group of firms or individual firm with which you'd like to share the document. You can also Share the document when you are attaching a document. </p>"
        },
        {
          id: 22,
          text: "How do I mark a document as reviewed? ",
          is_premium: false,
          answer: '<p> Navigate to Documents tab and click on the document. You can then access "Review Document" to mark a document as reviewed. </p>'
        },
        {
          id: 23,
          text: "Can I add an internal note for the document?",
          is_premium: false,
          answer: '<p> Yes. Navigate to Documents tab and click on the document. You can then access "Add Note" to add internal notes for a document. </p>'
        },
        {
          id: 24,
          text: "How do I search for a document?",
          is_premium: false,
          answer: '<p> You can search by name, document type and as of dates from the Documents menu. Keyword search inside the content of the document is enabled for <span class="space-on-left badge badge-success" uib-tooltip="This is a Premium feature">PREMIUM</span> subscribers. </p>'
        },
        {
          id: 24,
          text: "How do I tag a document?",
          is_premium: false,
          answer: '<p> Navigate to Documents tab and click on the document. You can then access "Update Document" to edit tags for a document. </p>'
        }
      ]
    },
    {
      section_id: 5,
      section_title: "Your Questions & Answer Bank",
      questions:[
        {
          id: 25,
          text: "What is Question / Answer Bank?",
          is_premium: false,
          answer: "<p> This is a repository of all your questions and answers across investors requests on the platform. It gives you a reference point for historical requests, along with audit trail of who answered what and when. Access this via Diligence > Q & A Bank </p>"
        }
      ]
    },
    {
      section_id: 6,
      section_title: "Questionnaire & DDQ Templates",
      questions:[
        {
          id: 26,
          text: "How do I create new templates?",
          is_premium: true,
          answer: '<p> Hover over "New" in the menubar, and click "Template" to get started </p>'
        },
        {
          id: 27,
          text: "How do I access existing templates?",
          is_premium: true,
          answer: '<p> Hover over "Diligence" in the menubar, and click "Template" to get started </p>'
        }
      ]
    },
    {
      section_id: 7,
      section_title: "Manage Products",
      questions:[
        {
          id: 28,
          text: "How do I create new products?",
          is_premium: true,
          answer: '<p> Hover over "New" in the menubar, and click "Product" to get started </p>'
        },
        {
          id: 29,
          text: "How do I modify existing products?",
          is_premium: true,
          answer: '<p> Hover over "Manage" in the menubar, and click "Products" to access the product list. Next, pick a product that you want to modify and edit the details </p>'
        },
        {
          id: 30,
          text: "How do I add another shareclass or fund series?",
          is_premium: true,
          answer: '<p> Hover over "Manage" in the menubar, and click "Products" to access the product list. Next, pick a product, and you will be taken to AUM and Track Record tab. Here you can edit a shareclass or add a new shareclass and populate AUM and performance history. </p>'
        },
        {
          id: 31,
          text: "How do I add internal DDQ for a product?",
          is_premium: true,
          answer: '<p> Hover over "Manage" in the menubar, and click "Products" to access the product list. Next, pick a product, and navigate to Internal DDQ tab. Here you can edit existing DDQ project or add a new one. </p>'
        }
      ]
    },
    {
      section_id: 8,
      section_title: "Form ADV Filings",
      questions:[
        {
          id: 32,
          text: "What is Form ADV menu all about?",
          is_premium: true,
          answer: '<p> You can review SEC ADV filings for firms of interest, including your peers, your investment counterparts and yourself via this module. You can create your sub portfolio by tracking firms of interest, and can also subscribe to alerts to be notified when these firms udpate their filings. </p>'
        },
        {
          id: 33,
          text: "What information is available in the ADV filing?",
          is_premium: true,
          answer: '<p> Form ADV includes a lot of information about the firms.. starting with regulatory assets, firm size, employees, funds and SMAs, service providers, investor base, key risk flags, and more. You can access snapshot profiles, listing of service providers, key ownership interests, listing of funds and more via this module. </p>'
        }
      ]
    },
    {
      section_id: 9,
      section_title: "Preferences",
      questions:[
        {
          id: 34,
          text: "What are design preferences?",
          is_premium: true,
          answer: '<p> Now you can bring your brand preferences to DiligenceVault. Upload your logo, add your colors (up to 10). This will ensure that any output from DiligenceVault matches your brand colors and includes your logo. </p>'
        },
        {
          id: 35,
          text: "What are firm preferences?",
          is_premium: true,
          answer: '<p> There are customizable elements for your firm ranging from password reset requirements, notifications, disclosure texts, and regulatory alert frequencies and default views. </p>'
        }
      ]
    }
  ]
  constructor(private readonly dataService:DataService) { }

  ngOnInit(): void {
    // this.toggleFeedbackPanel = this.LayoutUtils.toggleFeedbackPanel;
  }
  isOpenChange(event, question) {
    question.isOpen = event;
  }
  isLastOneOpenEvent(event) {
    this.isLastOneOpen = event;
  }
  selectedProduct;
  toggleFeedbackPanel() {

  this.dataService.setfeedBack(true);
  }
}
