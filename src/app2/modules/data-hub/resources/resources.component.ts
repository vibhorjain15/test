import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-data-hub-resources',
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.css']
})
export class ResourcesComponent implements OnInit {
  resources: Array<any>;

  constructor() { }

  ngOnInit(): void {
    this.resources = [
      {
        name: 'ADV Instructions & Glossary',
        link: 'https://www.sec.gov/about/forms/formadv-instructions.pdf',
        desc: 'Instructions to be read before filing Form ADV'
      },
      {
        name: 'Form ADV Part 1A',
        link: 'https://www.sec.gov/rules/final/2011/ia-3221-appb.pdf',
        desc: 'Instructions for certain items in Part 1A'
      },
      {
        name: 'Form ADV Part 1B (NASAA)',
        link: 'http://www.nasaa.org/industry-resources/uniform-forms/form-adv/revisions-to-form-adv-part-1b/',
        desc: 'Revisions to Form ADV Part 1B'
      },
      {
        name: 'Form ADV Part 2',
        link: 'https://www.sec.gov/about/forms/formadv-part2.pdf',
        desc: 'Instructions for Part 2'
      },
      {
        name: 'Execution Pages',
        link: 'https://www.sec.gov/about/forms/formadv-execution.pdf',
        desc: 'Execution Pages for FormADV'
      },
      {
        name: 'About Mercer Fund Watch',
        link: 'https://www.mercerfundwatch.com/',
        desc: 'Mercer Fund Watch Research Integration'
      }
    ];
  }
}
