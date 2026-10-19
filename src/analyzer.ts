import type { GitCommitNode, GitTreeEntry, ForensicAnomaly, ForensicReport } from './types.ts';

export class GitForensicAnalyzer {
  private commits = new Map<string, GitCommitNode>();
  private trees = new Map<string, GitTreeEntry[]>();
  private blobs = new Set<string>();

  addCommit(commit: GitCommitNode): void {
    this.commits.set(commit.sha, { ...commit });
  }

  addTree(sha: string, entries: GitTreeEntry[]): void {
    this.trees.set(sha, entries.map(e => ({ ...e })));
    for (const ent of entries) {
      if (ent.type === 'blob') {
        this.blobs.add(ent.sha);
      }
    }
  }

  analyze(repositoryId: string, referenceTimestamp = Date.now()): ForensicReport {
    const anomalies: ForensicAnomaly[] = [];
    const parentToChildren = new Map<string, string[]>();
    const childToParents = new Map<string, string[]>();

    // 1. Validar modos de árvores
    const validModes = new Set(['100644', '100755', '040000', '120000', '160000']);
    for (const [treeSha, entries] of this.trees.entries()) {
      for (const entry of entries) {
        if (!validModes.has(entry.mode)) {
          anomalies.push({
            code: 'INVALID_FILE_MODE',
            severity: 'high',
            targetSha: treeSha,
            description: `Entrada "${entry.path}" possui modo inválido "${entry.mode}" (esperado: 100644, 100755, 040000, 120000 ou 160000).`
          });
        }
      }
    }

    // 2. Construir grafo de commits e validar cronologia
    for (const commit of this.commits.values()) {
      childToParents.set(commit.sha, [...commit.parents]);

      // Verificar timestamp no futuro
      if (commit.committer.timestamp * 1000 > referenceTimestamp + 300000) { // tolerância de 5 min
        anomalies.push({
          code: 'TIMESTAMP_FUTURE',
          severity: 'medium',
          targetSha: commit.sha,
          description: `Commit registrado com timestamp no futuro: ${new Date(commit.committer.timestamp * 1000).toISOString()}.`
        });
      }

      // Verificar anacronismo pai -> filho
      for (const parentSha of commit.parents) {
        const parent = this.commits.get(parentSha);
        if (parent && parent.committer.timestamp > commit.committer.timestamp) {
          anomalies.push({
            code: 'TIMESTAMP_ANACHRONISM',
            severity: 'high',
            targetSha: commit.sha,
            description: `Commit ${commit.sha.slice(0, 7)} é mais antigo que seu commit pai ${parentSha.slice(0, 7)} (${commit.committer.timestamp} < ${parent.committer.timestamp}).`
          });
        }

        const children = parentToChildren.get(parentSha) || [];
        children.push(commit.sha);
        parentToChildren.set(parentSha, children);
      }
    }

    // 3. Detectar raízes e pontas (tips)
    const rootCommitShas: string[] = [];
    const tipCommitShas: string[] = [];

    for (const commit of this.commits.values()) {
      if (commit.parents.length === 0) {
        rootCommitShas.push(commit.sha);
      }
      const children = parentToChildren.get(commit.sha) || [];
      if (children.length === 0) {
        tipCommitShas.push(commit.sha);
      }
    }

    // 4. Detecção de ciclos (Tarjan / DFS)
    let isAcyclic = true;
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const checkCycle = (currSha: string): boolean => {
      visited.add(currSha);
      recStack.add(currSha);

      const parents = childToParents.get(currSha) || [];
      for (const pSha of parents) {
        if (!visited.has(pSha)) {
          if (checkCycle(pSha)) return true;
        } else if (recStack.has(pSha)) {
          return true; // Ciclo detectado!
        }
      }

      recStack.delete(currSha);
      return false;
    };

    for (const sha of this.commits.keys()) {
      if (!visited.has(sha)) {
        if (checkCycle(sha)) {
          isAcyclic = false;
          anomalies.push({
            code: 'CYCLE_DETECTED',
            severity: 'critical',
            targetSha: sha,
            description: `Ciclo direcionado identificado no grafo de histórico a partir de ${sha.slice(0, 7)}.`
          });
          break;
        }
      }
    }

    // 5. Conectividade do grafo
    const graphConnected = rootCommitShas.length <= 1;
    if (rootCommitShas.length > 1) {
      anomalies.push({
        code: 'DISCONNECTED_HEAD',
        severity: 'medium',
        targetSha: rootCommitShas[1],
        description: `Múltiplos commits raiz desconectados encontrados (${rootCommitShas.length} raízes órfãs).`
      });
    }

    return {
      repositoryId,
      analyzedAt: new Date(referenceTimestamp).toISOString(),
      totalCommits: this.commits.size,
      totalTrees: this.trees.size,
      totalBlobs: this.blobs.size,
      graphConnected,
      isAcyclic,
      anomalies,
      rootCommitShas,
      tipCommitShas
    };
  }
}
