angular.module('diligenceVault').directive 'rbQuestionnaire', ($compile) ->
  restrict: 'E'
  template: '<div></div>'
  replace: true
  link: (scope, element) ->
    displaySpinner = ->
      element.html $compile('<spinner></spinner>')(scope)

    scope.$render = ->

      options = eval scope.component.options
      scope.selectedNodes = eval options.selectedNodes
      scope.questionnaireTree = eval options.questionnaireTree
      scope.diligence = eval options.selectedDiligence
      scope.selectedIds = eval '[' + options.selectedIds + ']'
      scope.sectionFilters = {}
      scope.isEntityAssociated = (eval options.entity_id)?
      scope.isNodesSelected = Boolean eval(options.selectedIds)

      template = """
          <h4 class="clear-margin-top text-center text-uppercase">#{options.title}</h4>
          <div ng-if="!isEntityAssociated">
              <p>Questionnaire Section will appear here, once entity is associated.<p>
          </div>
          <div ng-if="isEntityAssociated">
              <div ng-if="!isNodesSelected">
                  <p>
                      Selected questions or sections will appear here.
                  </p>
              </div>
              <div ng-if="isNodesSelected && questionnaireTree">
                  <div id="due-diligence-preview" class="due-diligence-preview">
                      <display-questionnaire filters="sectionFilters"
                                     readonly
                                     print-preview
                                     no-response-controls
                                     questionnaire-tree="selectedNodes"
                                     selected-ids="selectedIds"
                                     diligence="diligence[0]"></dsiplay-questionnaire>
                  </div>
              </div>
          </div>
      """

      displaySpinner()

      element.html $compile(template)(scope)

    scope.$render()
