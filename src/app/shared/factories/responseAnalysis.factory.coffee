angular.module('diligenceVault').factory 'ResponseAnalysisFactory', (SidebarViewService) ->
  new class ResponseAnalysisFactory
    openDiligenceSidebar: (aggregate, questionId, templateId, tagId, customDateFilter) ->
      SidebarViewService.open({
        templateUrl: 'sidebars/dd_by_responses/template.html'
        controller: 'DDByResponsesController'
        controllerAs: 'vm'
        title: 'Due Diligences'
        size: 'lg'
        resolve:
          aggregate: -> aggregate
          questionId: -> questionId
          templateId: -> templateId
          tagId: -> tagId
          customDateFilter: -> customDateFilter
      })
