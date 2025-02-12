class FirmSettingsDesignPreferencesController extends BaseController
  @register 'FirmSettingsDesignPreferencesController'

  @inject 'Restangular', 'firmSettingsService', 'ModalFactory', 'toaster', 'FirmPreferenceDataService', 'toaster',
    'Utils', '$scope', 'SweetAlert','angularEnabled'

  initialize: ->
    @defaultPrimaryColor = '#126B82'
    @color = @defaultPrimaryColor
    @selectedColors = [].concat @Utils.getFirmColorScheme()
    @logoLink = @Utils.getFirmPreferences().logo_link
    @miniColorSettings =
      changeDelay: 300
      control: 'hue'
      theme: 'bootstrap'
      position: 'bottom left'
      letterCase: 'uppercase'

    @getFirmPreferences()

    @$scope.$watch 'vm.selectedColors', (value) =>
      if value
        @setModelValidity()
    , true

  getFirmPreferences: () =>
    @loadingFirmPreference = true
    @logoLink = null
    @FirmPreferenceDataService.getFirmPreferences().then (response) =>
      @firmPreferences = response
      @loadingFirmPreference = false
      @logoLink = @firmPreferences.logo_link

  makeItSticky: ->
    if $(document).height() > $(window).height()
      $('.sticky_savebar').affix({offset: {bottom: 50} })

  addNewColor: () ->
    @selectedColors.push @defaultPrimaryColor

  removeColor: (idx) ->
    @selectedColors.splice idx, 1

  resetColors: () ->
    @selectedColors = [].concat @Utils.getDefaultColorScheme()

  openImageUpdateDialog: () ->
    @ModalFactory.invokeModal 'update_image',
      success: (image) =>
        @logoLink = null
        @logoLink = image.blobUrl
        @updateDesignPreferences()

  setModelValidity: () =>
    if @designPreferenceForm
      _(@designPreferenceForm.$$controls).forEach (formGroup) =>
        occurrence = 0
        _(@selectedColors).forEach (color) ->
          if formGroup.$name and formGroup.$name.indexOf("color-") > -1 and color and formGroup.$modelValue
            if color.toUpperCase() == formGroup.$modelValue.toUpperCase()
              occurrence++

        formGroup.$setValidity('duplicateColor', occurrence < 2)

  updateFirmPreferences: () =>
    if !@logoLink
      @toaster.pop 'error', 'Logo Missing', 'To save design preferences, please upload a firm logo.'
      return

    if !@designPreferenceForm.$valid
      return

    @savingFirmPreferences = true

    @firmPreferences.color_codes = @selectedColors
    @firmPreferences.logo_link = @logoLink

    @FirmPreferenceDataService.updateFirmPreferences(@firmPreferences).then((response) =>
      @Utils.updateFirmColorScheme(response.color_codes)
      @Utils.updateFirmLogo(response.logo_link)
      @toaster.pop 'success', 'Updated Design Preferences', 'We have successfully saved your design preferences.'
    ).finally => @savingFirmPreferences = false

  deleteLogoConfirmation: () ->
    @SweetAlert.confirm({
      title: "Are you sure you want to remove the previously selected logo?"
      confirmButtonText: 'Yes, remove logo'
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @firmPreferences.logo_link = null
        @FirmPreferenceDataService.updateFirmPreferences(@firmPreferences).then((response) =>
          @logoLink = null
          @toaster.pop 'success', 'Successfully Removed Logo', 'We have successfully removed your selected logo.'
        ).finally => swal.close()
    })
