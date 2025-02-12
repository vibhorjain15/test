angular.module('diligenceVault').directive 'fieldPreview', ($compile,ModalFactory) ->
  restrict: 'E'
  link: (scope, element, attrs) ->
    editable = angular.isDefined(attrs.editable)
    dontAllowOtherOption = angular.isDefined(attrs.dontAllowOtherOption)

    render = (fieldName) ->
      # I know this is ugly! having html inside js but we don't have time right now!
      return element.empty() unless fieldName

      placeholder = ({
        TextEmail: 'Their email response',
        Numeric: 'Their numeric response',
        Identifier: 'Their identifier response',
        Integer: 'Their integer response',
        Percentage: 'Their percentage response',
        TextPhone: 'Their phone number response',
        Text: 'Their one line text response',
        TextMultiLine: 'Their multiline text response'
      })[fieldName]

      getRadio = (checked, label, class_name='') ->
        """
          <dv-radio
            type="info inline"
            label="#{label}"
            class="#{class_name}"
            #{(if checked then 'checked="true"' else '')}
            disabled="true">
          </dv-radio>
        """

      switch fieldName
        when 'TextEmail', 'Numeric', 'Integer', 'Percentage', 'TextPhone', 'Text', 'Identifier'
          directive = """
            <input type="text" class="form-control field-preview" placeholder="#{placeholder}" readonly="true" />
          """
        when 'TextMultiLine'
          directive = """
            <textarea class="form-control field-preview"
                      msd-elastic="\n"
                      data-ng-model="textResponse"
                      readonly="true"
                      placeholder="#{placeholder}"></textarea>
          """
        when 'Date'
          directive = """
            <div class="input-group datepicker-group">
              <input type="text"
                     class="form-control field-preview"
                     placeholder="Their selected date"
                     readonly="true"/>

              <span class="input-group-btn">
                <button btn-type="button" disabled>
                  <icon name="calendar"></icon>
                </button>
              </span>
            </div>
          """
        when 'CheckBox', 'Dropdown'
          if !editable and fieldName is 'Dropdown'
            directive = """
              <select class="form-control field-preview">
                <option data-ng-repeat="option in question.options" value="option.text">{{option.text}}</option>
              </select>

              <textarea class="form-control field-preview space-on-top"
                        readonly="true"
                        msd-elastic="\n"
                        data-ng-model="textResponse"
                        data-ng-show="question.has_other_option"
                        placeholder="Their explanation when the choice 'Other' is selected"></textarea>
            """
          else
            directive = """
              <div>
                <p class="dynamic-Header">Other and None are system options. Please do not repeat those while adding your options.</p>
                <dv-option-selector #{if editable then "editable" else ""}
                                    options="#{attrs.question}.options"
                                    allow-other-option
                                    has-other-option="#{attrs.question}.has_other_option"
                                    field-name="#{fieldName}"></dv-option-selector>
              </div>
            """
        when 'Bookends'
          directive = """
            <div class="row clearfix">
              <div class="col-md-6">
                <input type="number"
                       class="form-control field-preview"
                       readonly="true"
                       placeholder="Min Value" />
              </div>

              <div class="col-md-6">
                <input type="number"
                       class="form-control field-preview"
                       readonly="true"
                       placeholder="Max Value" />
              </div>
            </div>
          """
        when 'Boolean', 'BooleanPlus', 'NoPlus'
          directive = """
            <div>
              #{getRadio(fieldName is 'BooleanPlus', 'Yes')}
              #{getRadio(fieldName is 'NoPlus', 'No', 'space-on-left')}
            </div>
          """

          if fieldName isnt 'Boolean'
            directive += """
              <div class="space-on-top">
                <textarea class="form-control field-preview"
                          msd-elastic="\n"
                          readonly="true"
                          data-ng-model="textResponse"
                          placeholder="Their explanation"></textarea>
              </div>
            """
        when 'Grid'
          if editable
            directive = """
              <spreadsheet-creator columns="#{attrs.question}.columns"
                                   rows="#{attrs.question}.rows"
                                   dynamic-element="#{attrs.question}.dynamic_element"></spreadsheet-creator>
            """
          else
            directive = """
              <spreadsheet-preview columns="#{attrs.question}.columns"
                                   column-label-name="text"
                                   row-label-name="text"
                                   rows="#{attrs.question}.rows"></spreadsheet-preview>
            """
        when 'ReturnTable'
          directive = '<return-table-preview></return-table-preview>'
        when 'aumTable'
          directive = '<aum-table-preview></aum-table-preview>'
        when 'Attachment'
          if editable
            directive = """
              <div class="text-center">
                <button btn-type="default" ng-class="{'btn-primary':vm.question.attachmentUploadEnabled}" data-ng-click="attachmentUpload()">
                  <icon name="upload" class="align-middle"></icon>
                  Upload File
                </button>
                <a data-ng-click="vm.downloadAttachment(vm.question)" class="link-disguise">
                  <dv-checkbox
                          disabled="disabled"
                          checked="checked"
                          data-ng-show="vm.question.filename">
                    <dv-checkbox-label>
                      <span class="break-all" data-ng-bind="vm.question.filename"
                        uib-tooltip="{{vm.question.filename}}">
                      </span>
                    </dv-checkbox-label>
                  </dv-checkbox>
                </a>
              </div>
            """
          else
            directive = """
              <div class="text-center">
                <button btn-type="default">
                  <icon name="upload" class="align-middle"></icon>
                  Upload File
                </button>
              </div>
            """
        when 'DynamicGrid'
          if editable
            directive = """
              <dynamic-spreadsheet-creator columns="#{attrs.question}.columns"
                                   rows="#{attrs.question}.rows"
                                   dynamic-element="#{attrs.question}.dynamic_element"></dynamic-spreadsheet-preview>

            """
          else
            directive = """
              <spreadsheet-preview columns="#{attrs.question}.columns"
                                   column-label-name="text"
                                   row-label-name="text"
                                   rows="#{attrs.question}.rows"
                                   dynamic-element="#{attrs.question}.dynamic_element"></spreadsheet-preview>
            """

      element.html $compile(directive)(scope)

    scope.$watch "#{attrs.question}.responseType.text", (value) ->
      render value

    scope.$watch attrs.question, (newValue, oldValue) ->
      return unless newValue and oldValue

      # if two questions are switched but if they share same responseType then the above $watcher won't fire
      # this watcher catches that case
      if newValue isnt oldValue && newValue.responseType.text is oldValue.responseType.text
        render newValue.responseType.text

    scope.attachmentUpload = =>
      if scope.vm.question.attachmentUploadEnabled
        ModalFactory.invokeModal 'add_attachment_document',
          resolve:
            question: -> scope.vm.question
