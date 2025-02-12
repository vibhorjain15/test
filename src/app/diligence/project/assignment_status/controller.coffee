class ProjectAssignmentStatusController extends BaseController

  @register 'ProjectAssignmentStatusController'

  @inject 'AssignmentsResource','$stateParams', 'Restangular', '$scope', '$state', 'Utils', 'angularEnabled'

  initialize: ->
    diligenceId = @$stateParams.diligenceId
    @assignments = @AssignmentsResource.$new({diligenceId: diligenceId})

    @$scope.getDueDiligence().then (diligence) =>
      @diligence = diligence

  getPercentageCompleted: (grid, row, col) =>
    if(row.groupHeader && row.treeNode.children.length>0)
      total_answered_count = 0
      total_wip_count = 0
      percentage_completed = 0
      total_questions_count = row.treeNode.children.length
      angular.forEach row.treeNode.children, (child_row) ->
        if child_row.row.entity.answered_at
          total_answered_count += 1

        if child_row.row.entity.is_WIP
          total_wip_count += 1

      percentage_completed = 100*(total_answered_count - total_wip_count)/(total_questions_count)

    return Math.round(percentage_completed)

  redirectToSummary: ->
    # '^' means parent state, so here the parent state of this route is project. So goto -> project.summary
    @$state.go '^.summary'
