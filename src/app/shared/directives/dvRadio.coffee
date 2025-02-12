angular.module('diligenceVault').directive 'dvRadio', ($compile) ->
  restrict: 'E'
  transclude: true
  template: (element, attrs) ->
    look_like_checkbox = angular.isDefined(attrs.lookLikeCheckbox)
    base_class = if look_like_checkbox then 'checkbox' else 'radio'
    radio_type_class = "#{base_class}-info"
    radio_attrs = ['disabled', 'ngDisabled', 'ngModel',
                    'name', 'ngValue', 'ngChange',
                    'ngClick', 'value', 'checked']
    html_attrs = ['disabled', 'data-ng-disabled', 'data-ng-model',
                  'name', 'data-ng-value', 'data-ng-change',
                  'data-ng-click', 'value', 'checked']
    attr_string = ''

    _(radio_attrs).each((attr, idx) ->
      attr_value = attrs[attr]

      if attr_value?
        attr = html_attrs[idx]

        attr_string += " #{attr}=\"#{attr_value}\""
    )

    if attrs.type?
      # converts "foo    bar baz" to "foo bar baz"
      radio_type_classes = _(attrs.type.split(/\s+/)).map (type) ->
        "#{base_class}-#{type}"

      radio_type_class = radio_type_classes.join(' ')

    """
    <div class="#{base_class} #{radio_type_class}">
      <input #{attr_string}
             type="radio" />
      <label>#{attrs.label || ''}</label>
    </div>
    """
  link: (scope, element, attrs, controllers, transclude) ->
    id = attrs.id or _.uniqueId("dv-radio-")
    $label = element.find('label')

    element.find('input').attr('id', id)
    $label.attr('for', id)

    transclude scope, (clone, innerScope) ->
      dv_radio_label = _(clone).find (el) ->
        el.nodeName.toLowerCase() is 'dv-radio-label'

      if dv_radio_label?
        label_html = $compile(dv_radio_label.innerHTML)(scope)

        $label.html(label_html)
