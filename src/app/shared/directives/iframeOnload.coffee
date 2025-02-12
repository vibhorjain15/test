angular.module('diligenceVault').directive 'iframeOnload', ($timeout) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    scope.$watch attrs.iframeUrl, (url) ->
      if url?
        $.ajax({
          url: url
          success: (html) ->
            iframe = element[0]
            content_document =
              (iframe.contentWindow or
                iframe.contentDocument?.document or
                iframe.contentDocument)

            content_document.document.open()
            content_document.document.write(html)
            content_document.document.close()

            $timeout ->
              scope.$eval attrs.iframeOnload
        })
