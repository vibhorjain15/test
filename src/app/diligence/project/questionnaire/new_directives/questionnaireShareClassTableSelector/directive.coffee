angular.module('diligenceVault').directive 'questionnaireShareClassTableSelector', ($compile)->
  restrict: 'E'
  scope: true
  controller: "QuestionnaireShareClassTableSelectorController"
  controllerAs: 'vm'
  templateUrl: 'diligence/project/questionnaire/new_directives/questionnaireShareClassTableSelector/template.html'
  link: (scope, element) ->
    $container = element.find('.js-share-class-table-container')

    scope.renderShareClassTable = (share_class) ->
      directive = """
      <share-class-table share-class="vm.selected_share_class"
                         resource="vm.selected_share_class"
                         readonly="true">
      </share-class-table>
      """
      children = $container.children()

      if children.length
        sct_scope = angular.element(children).scope()
        sct_scope.$destroy()
        children.remove()

      if share_class?
        $container.html($compile(directive)(scope))
