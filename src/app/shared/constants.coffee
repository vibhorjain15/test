baseUrl = 'https://dv-test-api.azurewebsites.net/api'
# baseUrl = 'https://dv-dev-api.diligencevault.com/api'

angular
  .module('diligenceVault')
  .constant('authenticationUrls', do ->
    {
      'login': baseUrl + '/auth/token'
      'verifyUsername': baseUrl + '/Account/VerifyUserName'
      'forgotPassword': baseUrl + '/Account/ForgotPassword'
      'confirmEmail': baseUrl + '/account/confirm'
      'verifyToken': baseUrl + '/Account/VerifyToken'
      'resetPassword': baseUrl + '/Account/ResetPassword'
      'currentUser': baseUrl + '/account'
    }
  )
  .constant('baseUrl', baseUrl)
  .constant('errorMessageMap',
    required: '{{fieldName}} is required'
    email: 'Please enter a valid email'
    validateEquals: '{{fieldName}} do not match'
    uniqueEmail: 'This email address is taken'
    number: '{{fieldName}} must be a number'
    minlength: '{{fieldName}} is too short. Minimum {{charLength}} characters required'
    maxlength: '{{fieldName}} is too long. Maximum {{charLength}} characters allowed'
    emailExistence: 'This email does not exist in our database'
    url: 'Please enter a valid url'
    uniqueItem: "You've entered this {{fieldName}} already"
    passwordLowercaseChar: 'At least one lowercase letter is required'
    passwordUppercaseChar: 'At least one uppercase letter is required'
    passwordSpecialChar: 'At least one of these symbols is required: !"#$%&\'()*+,-./:;<=>?@[\]^_`{|}~'
    passwordRequiredLength: 'Password needs to be between 8 & 16 characters long'
    passwordNoWhitespace: 'Password should not contain whitespaces'
    passwordNumber:'At least one number is required'
    alphaNumericPlus: 'Only Letters, Numbers, and limited special characters (Underscore, Single Quote, Parenthesis, Comma, Hyphen, Period) allowed'
    avoidFirstSplCharacter: "{{fieldName}} cannot start with a special character"
    validateUserFirmAssociation: "This user is already associated with {{existingFirm}}, please use another user."
    pattern: "{{customPatternMessage}}"
    duplicateColor: 'You can\'t have duplicate colors in the list.'
    duplicateCategory: 'You can\'t have duplicate categories.'
    duplicateTeam: 'You can\'t select a team multiple times.'
    min:'{{fieldName}} should be greater than {{minValue}}'
    digitsOnly: 'Letters or special characters not allowed'
    validPhoneCharsOnly: 'Only Numbers, parenthesis, plus, minus and dot are allowed'
    validCityName: 'Only Alphabets and some special characters allowed'
    validZipcode: 'Zipcode not valid'
    validName: 'Only valid Windows Document name allowed'
    validDateRange: 'Date Range Not Valid'
    validDate: 'Date not valid'
    validDueDate: 'Due date should be greater than or equal to as of date'
    freeUserMessage: 'Available to premium subscribers'
    invalidMinimumMinRange: 'Range should start from 0'
    invalidMinRange: "Minimum range should be one more than the last scale's max range"
    invalidMaxRange: 'Maximum range should be 100'
    invalidMaxRatingRange: 'Maximum range should be greater than Minium Range',
    validPersonName: 'Name not valid',
  )
  .constant('authSettings', {
    client_id: 'DvApp'
  })
  .constant('$brandPrimaryColor', '#126b82')
  .constant('$stateSuccessText', '#43c59e')
  .constant('$stateDangerText', '#dc3545')
  .constant('$inputMaxLength', 320)
  .constant('$avoidFirstSplCharRegex', '^[^+@=\\-]|^$')
  .constant('$tinymceMentionsPlaceholderText', 'Start typing to leave a note. To mention and notify a team member, type @')
  .constant('$tinymcePlugins', 'preview lists hr link autolink image fullscreen powerpaste table footnotes dv_img_selector visualchars visualblocks')
  .constant('$tinymceToolbar1', 'bold italic underline | alignleft aligncenter alignright alignjustify | superscript | forecolor backcolor | footnotes')
  .constant('$tinymceToolbar2', 'table | bullist numlist | hr | undo redo | link dv_img_selector | dv_standard_text | fullscreen | visualchars visualblocks')
  .constant('$tinymceToolbarFull', 'bold italic underline | alignleft aligncenter alignright alignjustify | superscript | forecolor backcolor | link dv_img_selector | table | bullist numlist | hr | undo redo | fullscreen | footnotes | visualchars visualblocks')
  .constant('$tinymceStatusbar','')
  .constant('keywordConstants',{
    Product: 'Fund',
    Products: 'Products',
    Program: 'Program',
    Firm: 'Firm',
    Project: 'Duediligence',
    Document: 'Document',
    Vehicle: 'Vehicle',
    FormADV: 'FormADV',
    MyFirm: 'Myfirm',
    Review: 'Review'
    Contact: 'Contact'
    Rating: 'Rating'
    Strategy: 'Strategy'
    Template: 'Template'
  })
   .constant('hierarchyConstants',{
    Title: 'Strategies'
    Fund: 'fund',
    Masterfund: 'masterfund',
    Strategy: 'strategy'
  })
  .constant('ERROR_CODES',{
    BAD_REQUEST: 409
    ACCEPTED: 202
  })
  .constant('requestSteps',{
    DOC_PARSER: 'document_parser'
    EXCEL_PARCER: 'excel_parser'
    TEMPLATE_BUILDER: 'template_editor'
    COMPLETE_REQUEST: 'complete_request'
  })
  .constant('USER_ROLES',{
    ADMIN: 'superadmin'
    OWNER: 'superowner'
    READONLY: 'superviewer'
    READWRITE: 'supercontributor'
    RESTRICTED: 'restricted'
    SECURITYADMIN: 'securityadmin'
    BUSINESSADMIN: 'businessadmin'
  })
  .constant('total_entity_records',9999999)
  .constant('RequestTypes',{
    SHAREABLE: 'shareable_request'
    INVESTOR: 'investor_request'
    PREAPPROVED: 'preapproved_request'
  })
  .constant('ReportTypes',{
    TEMPLATE: 'template'
    QUESTION: 'question'
  })

  .constant('FILTER_TERNARY_OPERATORS',{
    OR: 'or'
    AND: 'and'
    GENERAL: 'general'
  })
  .constant('FILTER_TYPES',{
    STRING: 'str'
    NUMBER: 'number'
    RANGE: 'range'
    DATE: 'date'
    DROPDOWN:'dropdown'
    CHECKBOX:'checkbox'
    DROP:'drop'
    DYNAMIC:'dynamic'
    PARAGRAPH:'paragraph'
    MULTILINE: 'textmultiline'
    LINK:'link'
    INTEGER:'integer'
    NUMERIC:'numeric'
    TEXT:'text'
    BOOLEAN: 'bool'
    DATETIME: 'datetime'
    INT:'int'
    BOOKENDS: 'Bookends'
  })
  .constant('responseStatus', {
    STARTED: 'Started'
    INREVIEW: 'InReview'
    REVIEWSUCCESS: 'ReviewPassed'
    REVIEWFAILED: 'ReviewFailed'
  })
  .constant('diligenceStatusConstant',{
    COMPLETED: 'Completed'
    PRECOMPLETIONREVIEW: 'InReview'
    POSTCOMPLETIONREVIEW: 'Evaluation'
  })
  .constant('dvThresholds',{
    REVIEW_TIMELIMIT: 15000
  })
  .constant('dvTextLimits',{
    HELP_TEXT_LIMIT: 10000
  })
  .constant('headerConstants',{
    RATINGDEFINITION: 'Rating/Score Definition'
  })
  .constant('ratingConstants',{
    naValue: 0
    ScoreBand: 'ScoreBand'
    Absolute: 'Absolute'
  })
  .constant('proprietaryLicenses',{
    Handsontable: '822cb-b3aa2-217c0-64509-e9c25'
  })
  .constant('statusLabel',{
    ACTIVE: 'Active'
    INACTIVE: 'Deactivated'
  })
  .constant('activeAutofillViews',{
    RESPONSE: 'response'
    RATING: 'rating'
  })
  .constant('entityTypeValue',{
    Firm: 1220
    Fund: 1219
    Product: 1219
    Vehicle: 1217
    Strategy: 5004
    DueDiligence: 1105
  })
  .constant('trackChangeStatus',{
    STARTED: 'Started'
    ACCEPTED: 'Accepted'
    REJECTED: 'Rejected'
  })
  .constant('platformLabels',{
    MANAGER: 'Responder'
    INVESTOR: 'Requestor'
  })
  .constant('PASSKEYS',{
    RSA_PUBLIC_KEY: "-----BEGIN PUBLIC KEY-----
  MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCHtKSuUo36fj6jRSeNaVilQNbq
  qFbQYfFLBVcsXZ1DnnlpRwysersDTUNsb+pVqMp3jMa3F0x9fprzKJ4ywuOJXkGF
  E+9SD5z8tErbSNZjjNXhEeRvOQI82mnZT4lwUmdcvSpc0PMfSKoe6eomXzZ3ZO6C
  MpUVwgKJDl76qcHgmQIDAQAB
  -----END PUBLIC KEY-----"
  })
