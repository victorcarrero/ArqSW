import Hunk from './hunk';
import {toGitPathSep} from '../helpers';

export default class FilePatch {
  constructor(oldPath, newPath, status, hunks) {
    this.oldPath = oldPath;
    this.newPath = newPath;
    this.status = status;
    this.hunks = hunks;
    this.changedLineCount = this.hunks.reduce((acc, hunk) => {
      return acc + hunk.getLines().filter(line => line.isChanged()).length;
    }, 0);
  }

  getOldPath() {
    return this.oldPath;
  }

  getNewPath() {
    return this.newPath;
  }

  getPath() {
    return this.getOldPath() || this.getNewPath();
  }

  getStatus() {
    return this.status;
  }

  getHunks() {
    return this.hunks;
  }

  getStagePatchForHunk(selectedHunk) {
    return this.getStagePatchForLines(new Set(selectedHunk.getLines()));
  }

  getStagePatchForLines(selectedLines) {
    if (this.changedLineCount === [...selectedLines].filter(line => line.isChanged()).length) {
      return this;
    }

    let delta = 0;
    const hunks = [];
    for (const hunk of this.getHunks()) {
      const newStartRow = (hunk.getNewStartRow() || 1) + delta;
      let newLineNumber = newStartRow;
      const lines = [];
      let hunkContainsSelectedLines = false;
      for (const line of hunk.getLines()) {
        if (line.getStatus() === 'nonewline') {
          lines.push(line.copy({oldLineNumber: -1, newLineNumber: -1}));
        } else if (selectedLines.has(line)) {
          hunkContainsSelectedLines = true;
          if (line.getStatus() === 'deleted') {
            lines.push(line.copy());
          } else {
            lines.push(line.copy({newLineNumber: newLineNumber++}));
          }
        } else if (line.getStatus() === 'deleted') {
          lines.push(line.copy({newLineNumber: newLineNumber++, status: 'unchanged'}));
        } else if (line.getStatus() === 'unchanged') {
          lines.push(line.copy({newLineNumber: newLineNumber++}));
        }
      }
      const newRowCount = newLineNumber - newStartRow;
      if (hunkContainsSelectedLines) {
        // eslint-disable-next-line max-len
        hunks.push(new Hunk(hunk.getOldStartRow(), newStartRow, hunk.getOldRowCount(), newRowCount, hunk.getSectionHeading(), lines));
      }
      delta += newRowCount - hunk.getNewRowCount();
    }

    return new FilePatch(
      this.getOldPath(),
      this.getNewPath() ? this.getNewPath() : this.getOldPath(),
      this.getStatus(),
      hunks,
    );
  }

  getUnstagePatch() {
    let invertedStatus;
    switch (this.getStatus()) {
      case 'modified':
        invertedStatus = 'modified';
        break;
      case 'added':
        invertedStatus = 'deleted';
        break;
      case 'deleted':
        invertedStatus = 'added';
        break;
      default:
        throw new Error(`Unknown Status: ${this.getStatus()}`);
    }
    const invertedHunks = this.getHunks().map(h => h.invert());
    return new FilePatch(
      this.getNewPath(),
      this.getOldPath(),
      invertedStatus,
      invertedHunks,
    );
  }

  getUnstagePatchForHunk(hunk) {
    return this.getUnstagePatchForLines(new Set(hunk.getLines()));
  }

  getUnstagePatchForLines(selectedLines) {
    if (this.changedLineCount === [...selectedLines].filter(line => line.isChanged()).length) {
      return this.getUnstagePatch();
    }

    let delta = 0;
    const hunks = [];
    for (const hunk of this.getHunks()) {
      const oldStartRow = (hunk.getOldStartRow() || 1) + delta;
      let oldLineNumber = oldStartRow;
      const lines = [];
      let hunkContainsSelectedLines = false;
      for (const line of hunk.getLines()) {
        if (line.getStatus() === 'nonewline') {
          lines.push(line.copy({oldLineNumber: -1, newLineNumber: -1}));
        } else if (selectedLines.has(line)) {
          hunkContainsSelectedLines = true;
          if (line.getStatus() === 'added') {
            lines.push(line.copy());
          } else {
            lines.push(line.copy({oldLineNumber: oldLineNumber++}));
          }
        } else if (line.getStatus() === 'added') {
          lines.push(line.copy({oldLineNumber: oldLineNumber++, status: 'unchanged'}));
        } else if (line.getStatus() === 'unchanged') {
          lines.push(line.copy({oldLineNumber: oldLineNumber++}));
        }
      }
      const oldRowCount = oldLineNumber - oldStartRow;
      if (hunkContainsSelectedLines) {
        // eslint-disable-next-line max-len
        hunks.push(new Hunk(oldStartRow, hunk.getNewStartRow(), oldRowCount, hunk.getNewRowCount(), hunk.getSectionHeading(), lines));
      }
      delta += oldRowCount - hunk.getOldRowCount();
    }

    return new FilePatch(
      this.getOldPath() ? this.getOldPath() : this.getNewPath(),
      this.getNewPath(),
      this.getStatus(),
      hunks,
    ).getUnstagePatch();
  }

  toString() {
    return this.getHunks().map(h => h.toString()).join('');
  }

  getHeaderString() {
    let header = this.getOldPath() ? `--- a/${toGitPathSep(this.getOldPath())}` : '--- /dev/null';
    header += '\n';
    header += this.getNewPath() ? `+++ b/${toGitPathSep(this.getNewPath())}` : '+++ /dev/null';
    header += '\n';
    return header;
  }
}
