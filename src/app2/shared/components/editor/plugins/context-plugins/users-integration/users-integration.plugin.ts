import { ContextPlugin } from 'ckeditor5';

export default class UsersIntegration extends ContextPlugin {
  static get requires() {
    return ['Users'];
  }

  static get pluginName() {
    return 'UsersIntegration' as const;
  }

  init() {
    const usersPlugin = this.context.plugins.get('Users');
    const dvUserConfig = this.context.config.get('dvUserConfig');

    // Load the users data.
    if (
      dvUserConfig &&
      dvUserConfig.users &&
      dvUserConfig.users.length &&
      dvUserConfig.currentUserId
    ) {
      dvUserConfig.users.forEach((user) => {
        usersPlugin.addUser({ id: `${user.id}`, name: user.name });
      });

      usersPlugin.defineMe(`${dvUserConfig.currentUserId}`);
    } else {
      usersPlugin.useAnonymousUser();
    }
  }
}
