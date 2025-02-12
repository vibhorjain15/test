angular.module('diligenceVault').directive 'responseRenderer', ($timeout, Utils, $compile, QuestionnaireWidgetFactory) ->
    restrict: 'E'
    controllerAs: 'vm'
    scope:
        response: '='
        bindTo: '='
        copy: '<'
        preview: '<'
    link: (scope, element, attrs) ->
        deregisterer = scope.$watch 'response', (value) =>
            if value?
                scope.vm.response = value
                scope.vm.copy = scope.copy
                full_width_widgets = ['TextMultiLine', 'aumTable', 'Grid','DynamicGrid','ReturnTable', 'BooleanPlus', 'NoPlus']
                template = QuestionnaireWidgetFactory.getWidgetTemplate(scope.response.attributes.response_type, true, false, false, scope.response.attributes.is_NA,scope.preview)
        
                if scope.response.attributes.response_type in full_width_widgets
                    element.addClass('full-width')

                element.html $compile(template)(scope)
                scope.bindTo = element
                deregisterer()
        
    
    controller: ($scope) ->
        @response = {}
        @copy = true
        
