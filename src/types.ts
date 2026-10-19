export type GitObjectType = 'commit' | 'tree' | 'blob' | 'tag';

export interface GitCommitNode {
  sha: string;
  parents: string[];
  tree: string;
  author: {
    name: string;
    email: string;
    timestamp: number;
    timezone: string;
  };
  committer: {
    name: string;
    email: string;
    timestamp: number;
    timezone: string;
  };
  message: string;
  gpgSignature?: string;
}

export interface GitTreeEntry {
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  path: string;
}

export interface ForensicAnomaly {
  code: 'DISCONNECTED_HEAD' | 'CYCLE_DETECTED' | 'INVALID_FILE_MODE' | 'TIMESTAMP_FUTURE' | 'TIMESTAMP_ANACHRONISM' | 'AUTHOR_MISMATCH' | 'DANGLING_OBJECT' | 'UNUSUAL_EMPTY_COMMIT';
  severity: 'low' | 'medium' | 'high' | 'critical';
  targetSha: string;
  description: string;
}

export interface ForensicReport {
  repositoryId: string;
  analyzedAt: string;
  totalCommits: number;
  totalTrees: number;
  totalBlobs: number;
  graphConnected: boolean;
  isAcyclic: boolean;
  anomalies: ForensicAnomaly[];
  rootCommitShas: string[];
  tipCommitShas: string[];
}
