import {Emitter, CompositeDisposable, Disposable} from 'event-kit';
import {autobind} from 'core-decorators';

import DeferredCallbackQueue from '../deferred-callback-queue';
import Repository from './repository';
import ResolutionProgress from './conflicts/resolution-progress';
import FileSystemChangeObserver from './file-system-change-observer';
import WorkspaceChangeObserver from './workspace-change-observer';

const createRepoSym = Symbol('createRepo');

let absentWorkdirContext;

/*
 * Bundle of model objects associated with a git working directory.
 *
 * Provides synchronous access to each model in the form of a getter method that returns the model or `null` if it
 * has not yet been initialized, and asynchronous access in the form of a Promise generation method that will resolve
 * once the model is available. Initializes the platform-appropriate change observer and proxies select filesystem
 * change events.
 */
export default class WorkdirContext {

  /*
   * Available options:
   * - `options.window`: Browser window global, used on Linux by the WorkspaceChangeObserver.
   * - `options.workspace`: Atom's workspace singleton, used on Linux by the WorkspaceChangeObserver.
   * - `options.promptCallback`: Callback used to collect information interactively through Atom.
   */
  constructor(directory, options = {}) {
    this.directory = directory;
    this.repository = (options[createRepoSym] || (() => new Repository(directory)))();

    const {window: theWindow, workspace, promptCallback} = options;

    this.destroyed = false;
    this.emitter = new Emitter();
    this.subs = new CompositeDisposable();

    this.observer = this.useWorkspaceChangeObserver()
      ? new WorkspaceChangeObserver(theWindow, workspace, this.repository)
      : new FileSystemChangeObserver(this.repository);
    this.resolutionProgress = new ResolutionProgress();
    this.deferredCallbackQueue = new DeferredCallbackQueue(3000, collection => {
      this.repository.observeFilesystemChange(collection);
    });

    if (promptCallback) {
      this.repository.setPromptCallback(promptCallback);
    }

    // Wire up event forwarding among models
    this.subs.add(this.repository.onDidChangeState(this.repositoryChangedState));
    this.subs.add(this.observer.onDidChange(events => {
      const paths = events.map(e => e.special || e.path);
      this.deferredCallbackQueue.push(...paths);
    }));
    this.subs.add(this.observer.onDidChangeWorkdirOrHead(() => this.emitter.emit('did-change-workdir-or-head')));
    this.subs.add(new Disposable(() => this.deferredCallbackQueue.destroy()));

    // If a pre-loaded Repository was provided, broadcast an initial state change event.
    this.repositoryChangedState({from: null, to: this.repository.state});
  }

  static absent() {
    if (!absentWorkdirContext) {
      absentWorkdirContext = new AbsentWorkdirContext();
    }
    return absentWorkdirContext;
  }

  static destroyAbsent() {
    if (absentWorkdirContext) {
      absentWorkdirContext.destroy();
      absentWorkdirContext = null;
    }
  }

  static guess(options) {
    const projectPathCount = options.projectPathCount || 0;
    const initPathCount = options.initPathCount || 0;

    const createRepo = (projectPathCount === 1 || (projectPathCount === 0 && initPathCount === 1)) ?
      () => Repository.loadingGuess() :
      () => Repository.absentGuess();

    return new WorkdirContext(null, {[createRepoSym]: createRepo});
  }

  /**
   * Respond to changes in `Repository` state. Load resolution progress and start the change observer when it becomes
   * present. Stop the change observer when it is destroyed. Re-broadcast the event to context subscribers
   * regardless.
   *
   * The ResolutionProgress will be loaded before the change event is re-broadcast, but change observer modifications
   * will not be complete.
   */
  @autobind
  repositoryChangedState(payload) {
    if (this.destroyed) {
      return;
    }

    if (this.repository.isPresent()) {
      this.observer.start().then(() => this.emitter.emit('did-start-observer'));
    } else if (this.repository.isDestroyed()) {
      this.emitter.emit('did-destroy-repository');

      this.observer.destroy();
    }

    this.emitter.emit('did-change-repository-state', payload);
  }

  isPresent() {
    return true;
  }

  isDestroyed() {
    return this.destroyed;
  }

  useWorkspaceChangeObserver() {
    return !!process.env.ATOM_GITHUB_WORKSPACE_OBSERVER || process.platform === 'linux';
  }

  // Event subscriptions

  onDidStartObserver(callback) {
    return this.emitter.on('did-start-observer', callback);
  }

  onDidChangeWorkdirOrHead(callback) {
    return this.emitter.on('did-change-workdir-or-head', callback);
  }

  onDidChangeRepositoryState(callback) {
    return this.emitter.on('did-change-repository-state', callback);
  }

  onDidUpdateRepository(callback) {
    return this.emitter.on('did-update-repository', callback);
  }

  onDidDestroyRepository(callback) {
    return this.emitter.on('did-destroy-repository', callback);
  }

  /**
   * Return a Promise that will resolve the next time that a Repository transitions to the requested state. Most
   * useful for test cases; most callers should prefer subscribing to `onDidChangeRepositoryState`.
   */
  getRepositoryStatePromise(stateName) {
    return new Promise(resolve => {
      const sub = this.onDidChangeRepositoryState(() => {
        if (this.repository.isInState(stateName)) {
          resolve();
          sub.dispose();
        }
      });
    });
  }

  /**
   * Return a Promise that will resolve the next time that a ChangeObserver successfully starts. Most useful for
   * test cases.
   */
  getObserverStartedPromise() {
    return new Promise(resolve => {
      const sub = this.onDidStartObserver(() => {
        resolve();
        sub.dispose();
      });
    });
  }

  getWorkingDirectory() {
    return this.directory;
  }

  getRepository() {
    return this.repository;
  }

  getChangeObserver() {
    return this.observer;
  }

  getResolutionProgress() {
    return this.resolutionProgress;
  }

  /*
   * Cleanly destroy any models that need to be cleaned, including stopping the filesystem watcher.
   */
  async destroy() {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;

    this.subs.dispose();
    this.repository.destroy();
    this.emitter.dispose();

    await this.observer.destroy();
  }
}

class AbsentWorkdirContext extends WorkdirContext {
  constructor() {
    super(null, {[createRepoSym]: () => Repository.absent()});
  }

  isPresent() {
    return false;
  }
}
