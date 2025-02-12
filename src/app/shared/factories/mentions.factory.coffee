angular.module('diligenceVault').factory 'MentionsFactory', ($interval, BaseDataService) ->

  new class MentionsFactory

    teamMembers = []
    constructor: ->
      @getTeamMembers()

    getTeamMembers: =>
      BaseDataService.getTeamMembers()?.then (response) =>
        teamMembers = response

    clearTeamMembersCache: =>
      teamMembers = []

    getFilteredMembers: (term) =>
      regex = new RegExp(term, 'i')
      filteredTeamMembers = teamMembers.filter (teamMember) =>
        (regex.test(teamMember.firstName) ||
          regex.test(teamMember.lastName) ||
          regex.test(teamMember.userName))

      return filteredTeamMembers

    getDisplayName: (user, isTinyMce) =>
      if isTinyMce
        return "<span contenteditable='false' data-mention-id='#{user.id}' data-email='#{user.userName}' class='mention-tag-text' title='#{user.firstName} #{user.lastName}'>" + "@#{user.firstName} #{user.lastName}" + "</span>"
      else
        "@#{user.firstName}_#{user.lastName}"

    getMentionedIds: (text, isTinyMce) =>
      mentioned_members = _(teamMembers).filter (team_member) =>
        if isTinyMce
          text.indexOf('@'+team_member.firstName+' '+team_member.lastName)>-1
        else
          text.indexOf('@'+team_member.firstName+'_'+team_member.lastName)>-1
      mentioned_members_ids = []
      _(mentioned_members).each (member) =>
        mentioned_members_ids.push(member.id)
      return mentioned_members_ids
