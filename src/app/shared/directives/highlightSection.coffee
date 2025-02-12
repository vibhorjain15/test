angular.module('diligenceVault').directive 'highlightSection', ($sanitize) ->
  restrict: 'A'
  scope: true
  link: (scope, element, attrs) ->
    RegExp.quote = (str) ->
      (str + '').replace /[.?*+^$[\]\\(){}|-]/g, '\\$&'

    search_term = ''

    deregisterer = scope.$watch(attrs.term, (value) ->
      if value
        search_term = value
        deregisterer()
    )

    scope.$watch(attrs.triggerHighlight, (value) ->
      if value
        performHighlight(element[0], search_term)
    )

    performHighlight = (node, term) ->
      regex = new RegExp(term, 'i')
      global_regex = new RegExp(term, 'ig')
      if node.nodeName == '#text' and regex.test(node.textContent)
        textContent = node.textContent.replace(global_regex, (a, b) ->
          "<span class='highlighted-search-result'>" + a + "</span>"
        )
        span = document.createElement('span')
        span.innerHTML = $sanitize(textContent)
        node.replaceWith span
      node.childNodes.forEach (childNode) ->
        performHighlight(childNode, term)
