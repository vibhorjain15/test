angular.module('diligenceVault').directive 'dvMention', (BaseDataService) ->
  restrict: 'E'
  template: (element, attrs) ->
    """
    <textarea class="form-control"
              mentio
              mentio-template-url="shared/directives/dvMention/template.html"
              mentio-typed-text="typedTerm"
              mentio-select="getDisplayName(item)"
              mentio-items="filteredTeamMembers"
              mentio-search="filterTeamMembers(term)"
              data-ng-model="#{attrs.ngModel}"></textarea>
    """

  link: (scope, element, attrs) ->
    teamMembers = null

    BaseDataService.getTeamMembers().then (response) =>
      teamMembers = response

    scope.getDisplayName = (user) -> "@#{user.firstName}"

    scope.filterTeamMembers = (term) ->
      unless term
        scope.filteredTeamMembers = teamMembers
        return

      regex = new RegExp(term, 'i')

      scope.filteredTeamMembers = teamMembers.filter (teamMember) =>
        (regex.test(teamMember.firstName) ||
          regex.test(teamMember.lastName) ||
          regex.test(teamMember.userName))
