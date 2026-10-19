import test from 'node:test';
import assert from 'node:assert/strict';
import { GitForensicAnalyzer, type GitCommitNode, type GitTreeEntry } from '../src/index.ts';

test('1. Grafo linear limpo sem anomalias', () => {
  const analyzer = new GitForensicAnalyzer();

  const c1: GitCommitNode = {
    sha: '1111111111111111111111111111111111111111',
    parents: [],
    tree: 't1',
    author: { name: 'Alice', email: 'alice@example.com', timestamp: 1700000000, timezone: '+0000' },
    committer: { name: 'Alice', email: 'alice@example.com', timestamp: 1700000000, timezone: '+0000' },
    message: 'Initial commit'
  };

  const c2: GitCommitNode = {
    sha: '2222222222222222222222222222222222222222',
    parents: ['1111111111111111111111111111111111111111'],
    tree: 't2',
    author: { name: 'Bob', email: 'bob@example.com', timestamp: 1700001000, timezone: '+0000' },
    committer: { name: 'Bob', email: 'bob@example.com', timestamp: 1700001000, timezone: '+0000' },
    message: 'Feature B'
  };

  const trees: GitTreeEntry[] = [
    { mode: '100644', path: 'README.md', sha: 'b1', type: 'blob' },
    { mode: '100755', path: 'run.sh', sha: 'b2', type: 'blob' }
  ];

  analyzer.addCommit(c1);
  analyzer.addCommit(c2);
  analyzer.addTree('t1', trees);
  analyzer.addTree('t2', trees);

  const report = analyzer.analyze('test-repo', 1700002000000);
  assert.equal(report.isAcyclic, true);
  assert.equal(report.graphConnected, true);
  assert.equal(report.totalCommits, 2);
  assert.equal(report.rootCommitShas.length, 1);
  assert.equal(report.rootCommitShas[0], c1.sha);
  assert.equal(report.tipCommitShas.length, 1);
  assert.equal(report.tipCommitShas[0], c2.sha);
  assert.equal(report.anomalies.length, 0);
});

test('2. Detecção de modos de arquivo inválidos', () => {
  const analyzer = new GitForensicAnalyzer();

  analyzer.addTree('t-bad', [
    { mode: '100777', path: 'unsafe.sh', sha: 'b-bad', type: 'blob' } // 100777 é inválido no Git!
  ]);

  const report = analyzer.analyze('test-modes');
  assert.equal(report.anomalies.some(a => a.code === 'INVALID_FILE_MODE'), true);
});

test('3. Detecção de anacronismo temporal pai -> filho', () => {
  const analyzer = new GitForensicAnalyzer();

  const c1: GitCommitNode = {
    sha: 'c1',
    parents: [],
    tree: 't1',
    author: { name: 'Dev', email: 'dev@test.com', timestamp: 1700005000, timezone: '+0000' },
    committer: { name: 'Dev', email: 'dev@test.com', timestamp: 1700005000, timezone: '+0000' },
    message: 'Newer parent'
  };

  const c2: GitCommitNode = {
    sha: 'c2',
    parents: ['c1'],
    tree: 't2',
    author: { name: 'Dev', email: 'dev@test.com', timestamp: 1700001000, timezone: '+0000' }, // Mais antigo que o pai!
    committer: { name: 'Dev', email: 'dev@test.com', timestamp: 1700001000, timezone: '+0000' },
    message: 'Older child'
  };

  analyzer.addCommit(c1);
  analyzer.addCommit(c2);

  const report = analyzer.analyze('test-anachronism', 1700010000000);
  assert.equal(report.anomalies.some(a => a.code === 'TIMESTAMP_ANACHRONISM'), true);
});

test('4. Detecção de ciclo no histórico git', () => {
  const analyzer = new GitForensicAnalyzer();

  const c1: GitCommitNode = {
    sha: 'cycle-1',
    parents: ['cycle-2'], // Ciclo 1 -> 2 -> 1
    tree: 't1',
    author: { name: 'Dev', email: 'dev@test.com', timestamp: 1700000000, timezone: '+0000' },
    committer: { name: 'Dev', email: 'dev@test.com', timestamp: 1700000000, timezone: '+0000' },
    message: 'Cycle 1'
  };

  const c2: GitCommitNode = {
    sha: 'cycle-2',
    parents: ['cycle-1'],
    tree: 't2',
    author: { name: 'Dev', email: 'dev@test.com', timestamp: 1700000001, timezone: '+0000' },
    committer: { name: 'Dev', email: 'dev@test.com', timestamp: 1700000001, timezone: '+0000' },
    message: 'Cycle 2'
  };

  analyzer.addCommit(c1);
  analyzer.addCommit(c2);

  const report = analyzer.analyze('test-cycle');
  assert.equal(report.isAcyclic, false);
  assert.equal(report.anomalies.some(a => a.code === 'CYCLE_DETECTED'), true);
});
