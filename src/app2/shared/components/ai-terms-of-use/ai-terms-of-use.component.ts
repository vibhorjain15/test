import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import * as angular from 'angular';
import { AI_Policy_Condensed } from '../../constants/policy.constants';

@Component({
  selector: 'ai-terms-of-use',
  templateUrl: './ai-terms-of-use.component.html',
  styleUrls: ['./ai-terms-of-use.component.css'],
})
export class AiTermsOfUseComponent {
  AI_Policy_Condensed = AI_Policy_Condensed;
}
