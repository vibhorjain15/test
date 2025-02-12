angular.module('diligenceVault').directive 'dvCheckbox', ($compile) ->
  restrict: 'E'
  transclude: true
  template: (element, attrs) ->
    checkbox_type_class = "checkbox-info"
    checkbox_attrs = ['disabled', 'ngDisabled', 'ngModel',
                      'name', 'ngTrueValue', 'ngFalseValue',
                      'ngChange', 'checked', 'dvClick',
                      #following are required for checklist-model, https://github.com/vitalets/checklist-model
                      'checklistModel', 'checklistChange',
                      'checklistValue', 'value', 'checklistComparator',
                      'checklistBeforeChange']
    html_attrs = ['disabled', 'data-ng-disabled', 'data-ng-model',
                  'name', 'data-ng-true-value', 'data-ng-false-value',
                  'data-ng-change', 'checked', 'data-ng-click',
                  #following are required for checklist-model, https://github.com/vitalets/checklist-model
                  'checklist-model', 'checklist-change',
                  'checklist-value', 'value', 'checklist-comparator',
                  'checklist-before-change']
    attr_string = ''

    _(checkbox_attrs).each((attr, idx) ->
      attr_value = attrs[attr]

      if attr_value?
        attr = html_attrs[idx]

        attr_string += " #{attr}=\"#{attr_value}\""
    )

    if attrs.type?
      # converts "foo    bar baz" to "foo bar baz"
      checkbox_type_classes = _(attrs.type.split(/\s+/)).map (type) ->
        "checkbox-#{type}"

      checkbox_type_class = checkbox_type_classes.join(' ')

    """
    <div class="checkbox #{checkbox_type_class}">
      <input class="styled"
             #{attr_string}
             type="checkbox" />
      <label>#{attrs.label || ''}</label>
    </div>
    """
  link: (scope, element, attrs, controllers, transclude) ->
    id = attrs.id or _.uniqueId("dv-checkbox-")
    $label = element.find('label')

    element.find('input').attr('id', id)
    $label.attr('for', id)

    transclude scope, (clone, innerScope) ->
      dv_checkbox_label = _(clone).find (el) ->
        el.nodeName.toLowerCase() is 'dv-checkbox-label'

      if dv_checkbox_label?
        label_html = $compile(dv_checkbox_label.innerHTML)(scope)

        $label.html(label_html)
