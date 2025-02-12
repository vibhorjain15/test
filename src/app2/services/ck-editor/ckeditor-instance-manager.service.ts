import { Injectable } from '@angular/core';

/**
 * CKEditor intance manager service is used to store
 * editor instances and manage them.
 */
@Injectable({
  providedIn: 'root',
})
export class CKEditorInstanceManagerService {
  private _editorInstances: Map<string, any> = new Map<string, any>();

  /**
   * Gets the editor instance.\
   * [Remeber not to cache the editor instance in an instance property]\
   * [Always fetch it using this method locally, whenever required]
   * @param key The associated `key`.
   * @returns The editor instance or `undefined` (if not found).
   */
  getEditorInstance(key: string): any {
    return this._editorInstances.get(key);
  }

  /**
   * Adds a new entry with the specified key and editor instance to the Map. If an element already exists,
   * the element will be updated.
   * @param key The associated `key`.
   * @param editorInstance The editor instance.
   */
  setEditorInstance(key: string, editorInstance: any): void {
    this._editorInstances.set(key, editorInstance);
  }

  /**
   * Removes the editor instance.
   * @param key The associated `key`.
   * @returns `true` if an instance existed and has been removed, or `false` if the instance does not exist.
   */
  removeEditorInstance(key: string): boolean {
    return this._editorInstances.delete(key);
  }

  /**
   * Clears all the instances stored in the instance manager service.
   */
  clear(): void {
    this._editorInstances.clear();
  }
}
