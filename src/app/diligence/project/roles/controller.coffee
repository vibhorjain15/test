class ProjectRolesController extends BaseController

  @register 'ProjectRolesController'

  @inject '$stateParams', 'Restangular', '$scope', '$state', 'BaseDataService', 'toaster'

  initialize: ->
    @$scope.getDueDiligence().then (diligence) =>
      @diligence = diligence

    diligenceId = @$stateParams.diligenceId

    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @teamMembers = _(teamMembers).map (teamMember) ->
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

    @Restangular.one('diligences', diligenceId).all('roles').getList().then (response) =>
      @roles = response
      @role_count = response.length

  assignTeamMember: (role) ->
    params = _(role).pick('userID', 'roleID')

    if role.userID
      @Restangular.one('diligences', @$stateParams.diligenceId).all('roles').customPUT(params).then =>
        teamMember = _(@teamMembers).findWhere(id: role.userID)
        @toaster.pop 'success', '', "#{role.role} is now asssigned to #{teamMember.fullname}"
    else
      params.diligenceId = @$stateParams.diligenceId

      @Restangular.all('diligenceroles_assignments').remove(params).then =>
        @toaster.pop 'success', '', "#{role.role} is not asssigned to anyone"
