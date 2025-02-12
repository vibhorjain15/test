angular.module('diligenceVault').directive 'userAvatar', (Utils, $interpolate, $compile) ->
  restrict: 'E'
  link: (scope, element, attrs) ->
    currentUser = Utils.getCurrentUser()

    render = (user) ->
      avatarURL = user.avatarURL

      if avatarURL
        template = $interpolate('<img src="{{src}}" class="{{avatarClass}}" alt={{alt}} />')(
          src: avatarURL
          avatarClass: attrs.avatarImgClass or attrs.avatarClass or 'img-responsive'
          alt: user.firstName + ' ' + user.lastName
        )
      else
        template = $interpolate('<icon name="{{name}}" size="{{size}}" class="{{avatarClass}}"></icon>')(
          name: user.type
          size: attrs.avatarIconSize
          avatarClass: attrs.avatarIconClass or attrs.avatarClass
        )
        template = $compile(template)(scope)

      element.replaceWith template

    if attrs.user?
      scope.$watch attrs.user, (user) -> render(user) if user?
    else
      scope.$watch (-> currentUser.avatarURL), -> render(currentUser)
