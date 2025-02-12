angular.module('diligenceVault').directive 'dvImagePlaceholder', ->
  template: (element, attrs) ->
    placeholder_text = attrs.placeholderText or 'No Image Selected'

    """
    <div class="dv-image-placeholder">
      <div class="text-center space-on-bottom-lg">
        <icon name="picture" size="3x"></icon>
      </div>

      <p class="text-center">#{placeholder_text}</p>
    </div>
    """
