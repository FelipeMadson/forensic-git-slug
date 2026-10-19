# forensic-git-slug

> Deterministic Git repository forensic auditing and Directed Acyclic Graph (DAG) integrity analysis engine.

[![CI Verification](https://github.com/FelipeMadson/forensic-git-slug/actions/workflows/ci.yml/badge.svg)](https://github.com/FelipeMadson/forensic-git-slug/actions/workflows/ci.yml)
[![Node.js 22](https://img.shields.io/badge/node-22.x-blue.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*Read this in [Português](README.pt-BR.md).*

---

## Overview

`forensic-git-slug` is a specialized engineering toolkit designed to verify the integrity and provenance of Git commit graphs and object trees. It analyzes commit lineage, tree modes, chronologies, and connectivity to detect corruption, anachronisms, disconnected root heads, and tampering.

### Audited Invariants

1. **Acyclicity & DAG Topology**: Detects directed cycles (`CYCLE_DETECTED`) that violate Git graph constraints.
2. **Chronological Validity**: Identifies commits with future timestamps (`TIMESTAMP_FUTURE`) or parent-child inversions (`TIMESTAMP_ANACHRONISM`).
3. **File Mode Enforcement**: Validates that all tree entries adhere to valid Git modes (`100644`, `100755`, `040000`, `120000`, `160000`), flagging malicious or corrupted octal modes (`INVALID_FILE_MODE`).
4. **Graph Coherence**: Identifies disconnected root commits (`DISCONNECTED_HEAD`) and orphaned branches.

---

## Installation & Usage

### Requirements

- Node.js 22.0.0 or higher

### Installation

```bash
git clone https://github.com/FelipeMadson/forensic-git-slug.git
cd forensic-git-slug
npm install
```

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run typecheck
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.
