import { Plugin } from 'ckeditor5';
import { TrackChanges } from 'ckeditor5-premium-features';
import { DVUtils } from '../context-plugins';

export default class TrackChangesIntegration extends Plugin {
  static get requires() {
    return ['TrackChanges', 'UsersIntegration', 'DVUtils'] as const;
  }

  static get pluginName() {
    return 'TrackChangesIntegration' as const;
  }

  init() {
    const trackChangesPlugin = this.editor.plugins.get(
      'TrackChanges'
    ) as TrackChanges;
    const utils = this.editor.plugins.get(DVUtils);
    const dvTrackChangesConfig = this.editor.config.get('dvTrackChanges');

    // Set the adapter to the `TrackChanges#adapter` property.
    trackChangesPlugin.adapter = {
      async getSuggestion(suggestionId) {
        const payload = {
          thread_id: suggestionId,
        };

        // Write a request to your database here.
        // The returned `Promise` should be resolved with the suggestion
        // data object when the request has finished.
        return new Promise(async (resolve, reject) => {
          const response = await dvTrackChangesConfig
            .getSuggestion(payload)
            .catch((error: any) => reject());
          resolve({
            id: response.thread_id,
            type: response.type,
            authorId: `${response.created_by}`,
            data: response.data ? JSON.parse(response.data) : response.data,
            attributes: JSON.parse(response.attributes),
            createdAt: utils.getLocalDateTimeGeneric(response.created_at),
            hasComments: response.has_comments,
          });
        });
      },

      async addSuggestion(suggestionData) {
        const payload = {
          thread_id: suggestionData.id,
          original_suggestion_id: suggestionData.originalSuggestionId,
          type: suggestionData.type,
          has_comments: suggestionData.hasComments,
          data: suggestionData.data
            ? JSON.stringify(suggestionData.data)
            : null,
          attributes: JSON.stringify(suggestionData.attributes),
        };

        // Write a request to your database here.
        // The returned `Promise` should be resolved when the request
        // has finished. When the promise resolves with the suggestion data
        // object, it will update the editor suggestion using the provided data.
        return new Promise(async (resolve, reject) => {
          const response = await dvTrackChangesConfig
            .addSuggestion(payload)
            .catch((error: any) => reject());
          resolve({
            id: response.thread_id,
            type: response.type,
            authorId: `${response.created_by}`,
            data: response.data ? JSON.parse(response.data) : response.data,
            attributes: JSON.parse(response.attributes),
            createdAt: utils.getLocalDateTimeGeneric(response.created_at),
            hasComments: response.has_comments,
          });
        });
      },

      async updateSuggestion(id, suggestionData) {
        const payload = {
          thread_id: id,
          has_comments: suggestionData.hasComments,
          attributes: suggestionData.attributes
            ? JSON.stringify(suggestionData.attributes)
            : null,
          state: suggestionData.state,
        };

        // Write a request to your database here.
        // The returned `Promise` should be resolved when the request
        // has finished.
        return new Promise(async (resolve, reject) => {
          await dvTrackChangesConfig
            .updateSuggestion(payload)
            .catch((error: any) => reject());
          resolve();
        });
      },
    };

    // In order to load comments added to suggestions, you
    // should also integrate the comments adapter.
  }
}
