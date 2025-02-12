angular.module('diligenceVault').filter 'sanitizehtml', ($sce) ->
  (html) ->
    if html
      newHTML = new tinymce.html.Serializer().serialize(new tinymce.html.DomParser().parse(html));
      newHTML
