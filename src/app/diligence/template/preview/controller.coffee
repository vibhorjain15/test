class DiligenceTemplatePreviewController extends BaseController

  @register 'DiligenceTemplatePreviewController'

  @inject '$stateParams', 'Utils', '$scope', '$state', '$timeout', 'toaster', '$rootScope','angularTemplateEnabled'

  initialize: ->
    if angular.isDefined(@$stateParams.refresh)
      ###
          Technically api/template/{templateID} should only return template related info
          and a separate api should be used to fetch sections. That way this controller always
          fetches new set of sections & we won't need to talk via PubSub!
      ###
      @$rootScope.$emit 'refresh:template'


    @$scope.getTemplate().then (template) =>
      @template = template

    if angular.isDefined(@$scope.setSelectedSection)
      @$scope.$watch 'vm.selected_section', (value) =>
        @$scope.setSelectedSection(value)

  redirectToSections: ->
    @$state.go 'app.diligence.template.categories', add: true
