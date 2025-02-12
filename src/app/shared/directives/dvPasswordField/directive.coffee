angular.module('diligenceVault').directive 'dvPasswordField', (errorMessageMap) ->
  restrict: 'E'
  replace: true
  template: (element, attrs) ->
    popover_template_url = "'shared/directives/dvPasswordField/popover-template.html'"

    password_attrs = ['password', 'ngChange', 'name', 'placeholder','type']
    html_attr_names= ['data-ng-model', 'data-ng-change', 'name',
                      'placeholder']
    html_attrs = ''

    _(password_attrs).each((attr, idx) ->
      attr_value = attrs[attr]

      if attr_value?
        attr = html_attr_names[idx]

        html_attrs += " #{attr}=\"#{attr_value}\""
    )

    """
    <input
           class="form-control"
           uib-popover-template="#{popover_template_url}"
           popover-placement="right"
           popover-trigger="focus"
           popover-title="Password Criteria"
           popover-class="password-criteria-popover"
           #{html_attrs}
           required>
    """

  link: (scope, element) ->
    ngModel = element.controller('ngModel')

    #since we're sharing the scope, better to namespace our properties
    scope.password_popover_properties =
      ngModel: ngModel
      errorMessageMap: errorMessageMap

    ngModel.$validators.passwordRequiredLength = (modelValue, viewValue) ->
      value = modelValue or viewValue

      value and value.length >= 8 and value.length <= 16

    ngModel.$validators.passwordLowercaseChar = (modelValue, viewValue) ->
      value = modelValue or viewValue

      value and /[a-z]/.test value

    ngModel.$validators.passwordUppercaseChar = (modelValue, viewValue) ->
      value = modelValue or viewValue

      value and /[A-Z]/.test value

    ngModel.$validators.passwordSpecialChar = (modelValue, viewValue) ->
      value = modelValue or viewValue

      value and /[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/.test value

    ngModel.$validators.passwordNumber = (modelValue, viewValue) ->
      value = modelValue or viewValue

      value and /[0-9]/.test value

    ngModel.$validators.passwordNoWhitespace = (modelValue, viewValue) ->
      value = modelValue or viewValue

      value and /\s/.test(value) == false
