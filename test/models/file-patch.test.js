import {cloneRepository, buildRepository} from '../helpers';
import path from 'path';
import fs from 'fs';
import dedent from 'dedent-js';

import FilePatch from '../../lib/models/file-patch';
import Hunk from '../../lib/models/hunk';
import HunkLine from '../../lib/models/hunk-line';

describe('FilePatch', function() {
  describe('getStagePatchForLines()', function() {
    it('returns a new FilePatch that applies only the specified lines', function() {
      const filePatch = new FilePatch('a.txt', 'a.txt', 'modified', [
        new Hunk(1, 1, 1, 3, '', [
          new HunkLine('line-1', 'added', -1, 1),
          new HunkLine('line-2', 'added', -1, 2),
          new HunkLine('line-3', 'unchanged', 1, 3),
        ]),
        new Hunk(5, 7, 5, 4, '', [
          new HunkLine('line-4', 'unchanged', 5, 7),
          new HunkLine('line-5', 'deleted', 6, -1),
          new HunkLine('line-6', 'deleted', 7, -1),
          new HunkLine('line-7', 'added', -1, 8),
          new HunkLine('line-8', 'added', -1, 9),
          new HunkLine('line-9', 'added', -1, 10),
          new HunkLine('line-10', 'deleted', 8, -1),
          new HunkLine('line-11', 'deleted', 9, -1),
        ]),
        new Hunk(20, 19, 2, 2, '', [
          new HunkLine('line-12', 'deleted', 20, -1),
          new HunkLine('line-13', 'added', -1, 19),
          new HunkLine('line-14', 'unchanged', 21, 20),
          new HunkLine('No newline at end of file', 'nonewline', -1, -1),
        ]),
      ]);
      const linesFromHunk2 = filePatch.getHunks()[1].getLines().slice(1, 4);
      assert.deepEqual(filePatch.getStagePatchForLines(new Set(linesFromHunk2)), new FilePatch(
        'a.txt', 'a.txt', 'modified', [
          new Hunk(5, 5, 5, 4, '', [
            new HunkLine('line-4', 'unchanged', 5, 5),
            new HunkLine('line-5', 'deleted', 6, -1),
            new HunkLine('line-6', 'deleted', 7, -1),
            new HunkLine('line-7', 'added', -1, 6),
            new HunkLine('line-10', 'unchanged', 8, 7),
            new HunkLine('line-11', 'unchanged', 9, 8),
          ]),
        ],
      ));

      // add lines from other hunks
      const linesFromHunk1 = filePatch.getHunks()[0].getLines().slice(0, 1);
      const linesFromHunk3 = filePatch.getHunks()[2].getLines().slice(1, 2);
      const selectedLines = linesFromHunk2.concat(linesFromHunk1, linesFromHunk3);
      assert.deepEqual(filePatch.getStagePatchForLines(new Set(selectedLines)), new FilePatch(
        'a.txt', 'a.txt', 'modified', [
          new Hunk(1, 1, 1, 2, '', [
            new HunkLine('line-1', 'added', -1, 1),
            new HunkLine('line-3', 'unchanged', 1, 2),
          ]),
          new Hunk(5, 6, 5, 4, '', [
            new HunkLine('line-4', 'unchanged', 5, 6),
            new HunkLine('line-5', 'deleted', 6, -1),
            new HunkLine('line-6', 'deleted', 7, -1),
            new HunkLine('line-7', 'added', -1, 7),
            new HunkLine('line-10', 'unchanged', 8, 8),
            new HunkLine('line-11', 'unchanged', 9, 9),
          ]),
          new Hunk(20, 18, 2, 3, '', [
            new HunkLine('line-12', 'unchanged', 20, 18),
            new HunkLine('line-13', 'added', -1, 19),
            new HunkLine('line-14', 'unchanged', 21, 20),
            new HunkLine('No newline at end of file', 'nonewline', -1, -1),
          ]),
        ],
      ));
    });

    describe('staging lines from deleted files', function() {
      it('handles staging part of the file', function() {
        const filePatch = new FilePatch('a.txt', null, 'deleted', [
          new Hunk(1, 0, 3, 0, '', [
            new HunkLine('line-1', 'deleted', 1, -1),
            new HunkLine('line-2', 'deleted', 2, -1),
            new HunkLine('line-3', 'deleted', 3, -1),
          ]),
        ]);
        const linesFromHunk = filePatch.getHunks()[0].getLines().slice(0, 2);
        assert.deepEqual(filePatch.getStagePatchForLines(new Set(linesFromHunk)), new FilePatch(
          'a.txt', 'a.txt', 'deleted', [
            new Hunk(1, 1, 3, 1, '', [
              new HunkLine('line-1', 'deleted', 1, -1),
              new HunkLine('line-2', 'deleted', 2, -1),
              new HunkLine('line-3', 'unchanged', 3, 1),
            ]),
          ],
        ));
      });

      it('handles staging all lines, leaving nothing unstaged', function() {
        const filePatch = new FilePatch('a.txt', null, 'deleted', [
          new Hunk(1, 0, 3, 0, '', [
            new HunkLine('line-1', 'deleted', 1, -1),
            new HunkLine('line-2', 'deleted', 2, -1),
            new HunkLine('line-3', 'deleted', 3, -1),
          ]),
        ]);
        const linesFromHunk = filePatch.getHunks()[0].getLines();
        assert.deepEqual(filePatch.getStagePatchForLines(new Set(linesFromHunk)), new FilePatch(
          'a.txt', null, 'deleted', [
            new Hunk(1, 0, 3, 0, '', [
              new HunkLine('line-1', 'deleted', 1, -1),
              new HunkLine('line-2', 'deleted', 2, -1),
              new HunkLine('line-3', 'deleted', 3, -1),
            ]),
          ],
        ));
      });
    });
  });

  describe('getUnstagePatchForLines()', function() {
    it('returns a new FilePatch that applies only the specified lines', function() {
      const filePatch = new FilePatch('a.txt', 'a.txt', 'modified', [
        new Hunk(1, 1, 1, 3, '', [
          new HunkLine('line-1', 'added', -1, 1),
          new HunkLine('line-2', 'added', -1, 2),
          new HunkLine('line-3', 'unchanged', 1, 3),
        ]),
        new Hunk(5, 7, 5, 4, '', [
          new HunkLine('line-4', 'unchanged', 5, 7),
          new HunkLine('line-5', 'deleted', 6, -1),
          new HunkLine('line-6', 'deleted', 7, -1),
          new HunkLine('line-7', 'added', -1, 8),
          new HunkLine('line-8', 'added', -1, 9),
          new HunkLine('line-9', 'added', -1, 10),
          new HunkLine('line-10', 'deleted', 8, -1),
          new HunkLine('line-11', 'deleted', 9, -1),
        ]),
        new Hunk(20, 19, 2, 2, '', [
          new HunkLine('line-12', 'deleted', 20, -1),
          new HunkLine('line-13', 'added', -1, 19),
          new HunkLine('line-14', 'unchanged', 21, 20),
          new HunkLine('No newline at end of file', 'nonewline', -1, -1),
        ]),
      ]);
      const lines = new Set(filePatch.getHunks()[1].getLines().slice(1, 5));
      filePatch.getHunks()[2].getLines().forEach(line => lines.add(line));
      assert.deepEqual(filePatch.getUnstagePatchForLines(lines), new FilePatch(
        'a.txt', 'a.txt', 'modified', [
          new Hunk(7, 7, 4, 4, '', [
            new HunkLine('line-4', 'unchanged', 7, 7),
            new HunkLine('line-7', 'deleted', 8, -1),
            new HunkLine('line-8', 'deleted', 9, -1),
            new HunkLine('line-5', 'added', -1, 8),
            new HunkLine('line-6', 'added', -1, 9),
            new HunkLine('line-9', 'unchanged', 10, 10),
          ]),
          new Hunk(19, 21, 2, 2, '', [
            new HunkLine('line-13', 'deleted', 19, -1),
            new HunkLine('line-12', 'added', -1, 21),
            new HunkLine('line-14', 'unchanged', 20, 22),
            new HunkLine('No newline at end of file', 'nonewline', -1, -1),
          ]),
        ],
      ));
    });

    describe('unstaging lines from an added file', function() {
      it('handles unstaging part of the file', function() {
        const filePatch = new FilePatch(null, 'a.txt', 'added', [
          new Hunk(0, 1, 0, 3, '', [
            new HunkLine('line-1', 'added', -1, 1),
            new HunkLine('line-2', 'added', -1, 2),
            new HunkLine('line-3', 'added', -1, 3),
          ]),
        ]);
        const linesFromHunk = filePatch.getHunks()[0].getLines().slice(0, 2);
        assert.deepEqual(filePatch.getUnstagePatchForLines(new Set(linesFromHunk)), new FilePatch(
          'a.txt', 'a.txt', 'deleted', [
            new Hunk(1, 1, 3, 1, '', [
              new HunkLine('line-1', 'deleted', 1, -1),
              new HunkLine('line-2', 'deleted', 2, -1),
              new HunkLine('line-3', 'unchanged', 3, 1),
            ]),
          ],
        ));
      });

      it('handles unstaging all lines, leaving nothign staged', function() {
        const filePatch = new FilePatch(null, 'a.txt', 'added', [
          new Hunk(0, 1, 0, 3, '', [
            new HunkLine('line-1', 'added', -1, 1),
            new HunkLine('line-2', 'added', -1, 2),
            new HunkLine('line-3', 'added', -1, 3),
          ]),
        ]);

        const linesFromHunk = filePatch.getHunks()[0].getLines();
        assert.deepEqual(filePatch.getUnstagePatchForLines(new Set(linesFromHunk)), new FilePatch(
          'a.txt', null, 'deleted', [
            new Hunk(1, 0, 3, 0, '', [
              new HunkLine('line-1', 'deleted', 1, -1),
              new HunkLine('line-2', 'deleted', 2, -1),
              new HunkLine('line-3', 'deleted', 3, -1),
            ]),
          ],
        ));
      });
    });
  });

  it('handles newly added files', function() {
    const filePatch = new FilePatch(null, 'a.txt', 'added', [
      new Hunk(0, 1, 0, 3, '', [
        new HunkLine('line-1', 'added', -1, 1),
        new HunkLine('line-2', 'added', -1, 2),
        new HunkLine('line-3', 'added', -1, 3),
      ]),
    ]);
    const linesFromHunk = filePatch.getHunks()[0].getLines().slice(0, 2);
    assert.deepEqual(filePatch.getUnstagePatchForLines(new Set(linesFromHunk)), new FilePatch(
      'a.txt', 'a.txt', 'deleted', [
        new Hunk(1, 1, 3, 1, '', [
          new HunkLine('line-1', 'deleted', 1, -1),
          new HunkLine('line-2', 'deleted', 2, -1),
          new HunkLine('line-3', 'unchanged', 3, 1),
        ]),
      ],
    ));
  });

  describe('toString()', function() {
    it('converts the patch to the standard textual format', async function() {
      const workdirPath = await cloneRepository('multi-line-file');
      const repository = await buildRepository(workdirPath);

      const lines = fs.readFileSync(path.join(workdirPath, 'sample.js'), 'utf8').split('\n');
      lines[0] = 'this is a modified line';
      lines.splice(1, 0, 'this is a new line');
      lines[11] = 'this is a modified line';
      lines.splice(12, 1);
      fs.writeFileSync(path.join(workdirPath, 'sample.js'), lines.join('\n'));

      const patch = await repository.getFilePatchForPath('sample.js');
      assert.equal(patch.toString(), dedent`
        @@ -1,4 +1,5 @@
        -var quicksort = function () {
        +this is a modified line
        +this is a new line
           var sort = function(items) {
             if (items.length <= 1) return items;
             var pivot = items.shift(), current, left = [], right = [];
        @@ -8,6 +9,5 @@
             }
             return sort(left).concat(pivot).concat(sort(right));
           };
        -
        -  return sort(Array.apply(this, arguments));
        +this is a modified line
         };

      `);
    });

    it('correctly formats new files with no newline at the end', async function() {
      const workingDirPath = await cloneRepository('three-files');
      const repo = await buildRepository(workingDirPath);
      fs.writeFileSync(path.join(workingDirPath, 'e.txt'), 'qux', 'utf8');
      const patch = await repo.getFilePatchForPath('e.txt');

      assert.equal(patch.toString(), dedent`
        @@ -0,0 +1,1 @@
        +qux
        \\ No newline at end of file

      `);
    });
  });

  if (process.platform === 'win32') {
    describe('getHeaderString()', function() {
      it('formats paths with git line endings', function() {
        const oldPath = path.join('foo', 'bar', 'old.js');
        const newPath = path.join('baz', 'qux', 'new.js');

        const patch = new FilePatch(oldPath, newPath, 'modified', []);
        assert.equal(patch.getHeaderString(), dedent`
          --- a/foo/bar/old.js
          +++ b/baz/qux/new.js

        `);
      });
    });
  }
});
