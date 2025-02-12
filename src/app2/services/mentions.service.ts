import { Injectable } from '@angular/core';
import { BaseDataService } from './base-data.service';

@Injectable({
  providedIn: 'root',
})
export class MentionsService {
  teamMembers = [];
  constructor(private readonly BaseDataService: BaseDataService) {
    this.getTeamMembers();
  }

  getTeamMembers() {
    this.BaseDataService.getTeamMembers().subscribe(
      (response: any) => (this.teamMembers = response)
    );
  }

  clearTeamMembersCache() {
    this.teamMembers = [];
  }

  getFilteredMembers(term: any) {
    const regex = new RegExp(term, 'i');
    const filteredTeamMembers = this.teamMembers.filter(
      (teamMember) =>
        regex.test(teamMember.firstName) ||
        regex.test(teamMember.lastName) ||
        regex.test(teamMember.userName)
    );
    return filteredTeamMembers;
  }

  getDisplayName(user, isTinyMce) {
    if (isTinyMce) {
      return (
        `<span contenteditable='false' data-email='${user.userName}' class='mention-tag-text' title='${user.firstName} ${user.lastName}'>` +
        `@${user.firstName} ${user.lastName}` +
        '</span>'
      );
    } else {
      return `@${user.firstName}_${user.lastName}`;
    }
  }

  getMentionedIds(text, isTinyMce) {
    const mentioned_members = this.teamMembers.filter((team_member) => {
      if (isTinyMce) {
        return (
          text.indexOf(
            '@' + team_member.firstName + ' ' + team_member.lastName
          ) > -1
        );
      } else {
        return (
          text.indexOf(
            '@' + team_member.firstName + '_' + team_member.lastName
          ) > -1
        );
      }
    });
    const mentioned_members_ids = [];
    mentioned_members.forEach((member) => {
      mentioned_members_ids.push(member.id);
    });
    return mentioned_members_ids;
  }
}
