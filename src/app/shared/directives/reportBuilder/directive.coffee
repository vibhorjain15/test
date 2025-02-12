angular.module('diligenceVault').directive 'reportBuilder', ($parse, RbComponentFactory, $q) ->
  templateUrl: 'shared/directives/reportBuilder/template.html'
  controller: 'ReportBuilderController'
  controllerAs: 'rb_controller'
  scope: true
  replace: true
  restrict: 'E'
  require: ['ngModel', 'reportBuilder']
  link: (scope, element, attrs, controllers) ->
    [ngModel, reportBuilderController] = controllers
    PAGE_BREAK = '*|dv:page_break|*'
    template_deferred = $q.defer()
    options_deferred = $q.defer()
    promises = [template_deferred.promise]

    reportBuilderController.onCanvasUpdate = (pages) ->
      pages = _(pages).map (page) ->
        RbComponentFactory.formatComponents(page.components)

      merge_tag_template = pages.join(PAGE_BREAK)
      $parse("#{attrs.ngModel}.definition").assign(scope.$parent, merge_tag_template)

      reportBuilderController.updateTemplate(reportBuilderController.template)

    tpl_deregisterer = scope.$parent.$watch attrs.ngModel, (template) ->
      if template?
        template_deferred.resolve(template)

        tpl_deregisterer()

    if angular.isDefined(attrs.options)
      options_deregisterer = scope.$parent.$watch attrs.options, (value) ->
        if value?
          options_deferred.resolve(value)

          options_deregisterer()

      promises.push(options_deferred.promise)

    $q.all(promises).then (resolutions) ->
      [template, options] = resolutions

      definition = template.definition || ''
      pages = definition.split(PAGE_BREAK)

      pages = _(pages).map (page_tpl) ->
        components = RbComponentFactory.parseTemplate(page_tpl)

        { components: components }

      reportBuilderController.setPages(pages)
      reportBuilderController.setTemplate(template)
      reportBuilderController.setOptions(options)
