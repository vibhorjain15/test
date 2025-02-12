###
Note: We're bypassing the position:absolute for the page to be printed as the window.print() isn't compatible with FF and IE for printing the whole page.
      We're now using position:relative, while hiding the elements that are not required using the class 'hide-in-print-view'.
      Refer: less/utils/print-utilities.less
###

angular.module('diligenceVault').directive 'printSection', ($timeout, $window, $templateCache, $compile, $http) ->
  restrict: 'A'
  scope: true
  link: (scope, element, attrs) ->
    if attrs.sectionTemplateUrl? && !attrs.buttonLoader
      element.attr 'button-loader', 'is_printing'
      element.replaceWith $compile(element)(scope)
      return

    options = {}
    locals = {}

    scope.$watch(attrs.printOptions, (value) ->
      if value
        locals = value.locals
        options = _(value).omit('locals')
    )

    printSection = (el) ->
      $body = $('body')
      $body.addClass('print-initiated')
      el.addClass('print-section')

      $window.print()

      $timeout ->
        $body.removeClass('print-initiated')

    waitForRenderAndPrint = (printScope, el) ->
      if (printScope.$$phase || $http.pendingRequests.length)
        $timeout -> waitForRenderAndPrint(printScope, el)
      else
        printSection(el).then ->
          $(el).remove()
          printScope.$destroy()
          scope.is_printing = false

    appendAndPrintSection = (templateUrl) ->
      template = $templateCache.get(templateUrl)
      printScope = angular.extend(scope.$new(), locals)

      el = $compile(template)(printScope)

      el.addClass('visible-print')
      $('body').append(el)

      $timeout -> waitForRenderAndPrint(printScope, el)

    element.on 'click', ->
      scope.$apply ->

        if attrs.sectionId?
          el = $("#"+attrs.sectionId)
          printSection(el)
        else if attrs.sectionTemplateUrl?
          templateUrl = scope.$eval(attrs.sectionTemplateUrl)
          scope.is_printing = true
          $timeout -> # so that the spinner can kick in instantly
            appendAndPrintSection(templateUrl)
