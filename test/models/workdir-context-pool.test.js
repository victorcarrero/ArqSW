import temp from 'temp';
import {Disposable} from 'event-kit';

import {cloneRepository} from '../helpers';

import WorkdirContextPool from '../../lib/models/workdir-context-pool';

describe('WorkdirContextPool', function() {
  let pool;
  let mockWindow, mockWorkspace;

  beforeEach(function() {
    mockWindow = {
      addEventListener: sinon.spy(),
      removeEventListener: sinon.spy(),
    };

    mockWorkspace = {
      observeTextEditors: sinon.stub().returns(new Disposable()),
    };

    pool = new WorkdirContextPool({
      window: mockWindow,
      workspace: mockWorkspace,
    });
  });

  describe('add', function() {
    let workingDirectory;

    beforeEach(async function() {
      workingDirectory = await cloneRepository('three-files');
    });

    it('adds a WorkdirContext for a new working directory', function() {
      assert.equal(pool.size(), 0);
      assert.isFalse(pool.getContext(workingDirectory).isPresent());

      pool.add(workingDirectory);

      assert.equal(pool.size(), 1);
      assert.isTrue(pool.getContext(workingDirectory).isPresent());
    });

    it('is a no-op if the working directory already has a context', function() {
      pool.add(workingDirectory);
      assert.equal(pool.size(), 1);

      const context = pool.getContext(workingDirectory);
      assert.isTrue(context.isPresent());

      pool.add(workingDirectory);
      assert.equal(pool.size(), 1);
    });

    it('begins but does not await the asynchronous initialization process', async function() {
      pool.add(workingDirectory);
      const context = pool.getContext(workingDirectory);
      assert.isTrue(context.getRepository().isLoading());
      assert.isTrue(context.getResolutionProgress().isEmpty());
      assert.isFalse(context.getChangeObserver().isStarted());

      await context.getRepositoryStatePromise('Present');
      assert.isTrue(context.getRepository().isPresent());
    });
  });

  describe('replace', function() {
    it('adds a WorkdirContext if one is absent', function() {
      const directory = temp.mkdirSync();

      assert.equal(pool.size(), 0);
      assert.isFalse(pool.getContext(directory).isPresent());

      pool.replace(directory);

      assert.equal(pool.size(), 1);
      assert.isTrue(pool.getContext(directory).isPresent());
    });

    it('removes an existing WorkdirContext if one is present', async function() {
      const directory = await cloneRepository('three-files');

      pool.add(directory);
      assert.equal(pool.size(), 1);
      const context = pool.getContext(directory);
      assert.isTrue(context.isPresent());
      const original = context.getRepository();

      pool.replace(directory);
      assert.equal(pool.size(), 1);
      assert.isTrue(pool.getContext(directory).isPresent());
      const replaced = pool.getContext(directory).getRepository();

      assert.notStrictEqual(original, replaced);
    });
  });

  describe('remove', function() {
    let existingDirectory, existingContext;

    beforeEach(async function() {
      existingDirectory = await cloneRepository('three-files');
      pool.add(existingDirectory);

      existingContext = pool.getContext(existingDirectory);
    });

    it('removes a WorkdirContext for an existing working directory', function() {
      assert.equal(pool.size(), 1);
      pool.remove(existingDirectory);
      assert.isFalse(pool.getContext(existingDirectory).isPresent());
      assert.equal(pool.size(), 0);
    });

    it('is a no-op if the working directory is not present', function() {
      assert.equal(pool.size(), 1);
      pool.remove('/nope');
      assert.equal(pool.size(), 1);
    });

    it('begins but does not await the termination process', function() {
      const repo = existingContext.getRepository();
      sinon.spy(repo, 'destroy');

      assert.isFalse(existingContext.isDestroyed());
      pool.remove(existingDirectory);
      assert.isTrue(existingContext.isDestroyed());
      assert.isTrue(repo.destroy.called);
    });
  });

  describe('set', function() {
    let dir0, dir1, dir2;

    beforeEach(async function() {
      [dir0, dir1, dir2] = await Promise.all([
        cloneRepository('three-files'),
        cloneRepository('three-files'),
        cloneRepository('three-files'),
      ]);

      pool.add(dir0);
      pool.add(dir1);
    });

    it('adds new directories, removes missing ones, and maintains kept ones', function() {
      const context0 = pool.getContext(dir0);
      const context1 = pool.getContext(dir1);

      pool.set([dir1, dir2]);

      assert.equal(pool.size(), 2);

      assert.isFalse(pool.getContext(dir0).isPresent());
      assert.isTrue(pool.getContext(dir1).isPresent());
      assert.isTrue(pool.getContext(dir2).isPresent());

      assert.isTrue(context0.isDestroyed());
      assert.isFalse(context1.isDestroyed());
    });
  });

  describe('getContext', function() {
    let dir;

    beforeEach(async function() {
      dir = await cloneRepository('three-files');
      pool.add(dir);
    });

    it('returns a context by directory', function() {
      const context = pool.getContext(dir);
      assert.isTrue(context.isPresent());

      const repo = context.getRepository();
      assert.strictEqual(dir, repo.getWorkingDirectoryPath());
    });

    it('returns a null context when missing', function() {
      const context = pool.getContext('/nope');
      assert.isFalse(context.isPresent());
    });
  });

  describe('clear', function() {
    it('removes all resident contexts', async function() {
      const [dir0, dir1, dir2] = await Promise.all([
        cloneRepository('three-files'),
        cloneRepository('three-files'),
        cloneRepository('three-files'),
      ]);

      pool.add(dir0);
      pool.add(dir1);
      pool.add(dir2);

      assert.equal(pool.size(), 3);

      pool.clear();

      assert.equal(pool.size(), 0);
      assert.isFalse(pool.getContext(dir0).isPresent());
      assert.isFalse(pool.getContext(dir1).isPresent());
      assert.isFalse(pool.getContext(dir2).isPresent());
    });
  });
});
