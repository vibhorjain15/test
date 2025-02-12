angular.module('diligenceVault').directive 'rbImageSelector', ($compile, $templateCache, ImageDataService) ->
  restrict: 'E'
  replace: true
  link: (scope, element) ->
    renderImage = (image) ->
      tplImage = """
        <img src="#{image.blobUrl}" class="img-responsive" />
      """

      alignmentClass = ''
      switch scope.component.options.alignment
       when 'center'
         alignmentClass = 'text-center'
       when 'left'
         alignmentClass = 'text-left'
       when 'right'
         alignmentClass = 'text-right'

      tplLogo = """
        <div class="#{alignmentClass}">
          <img src="#{image.blobUrl}" class="report-logo" />
        </div>
      """

      tpl = if scope.component.options.type == 'image' then tplImage else tplLogo

      element.html(tpl)

    getImage = (id) ->
      ImageDataService.getImage(id)

    onImageUpload = (response) ->
      image = response[0][0]

      scope.component.options.image_id = image.id

    renderImageSelector = ->
      template = """
        <dv-image-placeholder placeholder-text="Select to upload or pick an existing image">
        </dv-image-placeholder>
      """

      element.html($compile(template)(scope))

    scope.$render = ->
      image_id = parseInt scope.component.options.image_id

      if image_id? and not isNaN(image_id)
        getImage(image_id).then (image) ->
          renderImage(image)
      else
        renderImageSelector()

    scope.onImageUpload = onImageUpload

    scope.$render()
