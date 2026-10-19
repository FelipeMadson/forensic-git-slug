# forensic-git-slug — Auditoria Forense e Integridade de Repositórios Git

> Motor determinístico para auditoria forense de repositórios Git, análise de integridade de DAG (Grafo Acíclico Direcionado) e detecção de anomalias estruturais.

[![Verificação CI](https://github.com/FelipeMadson/forensic-git-slug/actions/workflows/ci.yml/badge.svg)](https://github.com/FelipeMadson/forensic-git-slug/actions/workflows/ci.yml)
[![Node.js 22](https://img.shields.io/badge/node-22.x-blue.svg)](https://nodejs.org/)
[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-yellow.svg)](LICENSE)

*Read this in [English](README.md).*

---

## Visão Geral

O `forensic-git-slug` fornece uma suíte de análise forense e validação topológica de repositórios Git. A ferramenta examina árvores de objetos e sequências de commits para auditar a proveniência do código e atestar a ausência de adulterações no histórico.

### Verificações Executadas

- **Aciclicidade**: Varredura profunda com DFS para comprovar que o grafo de commits é estritamente acíclico (`CYCLE_DETECTED`).
- **Validação Cronológica**: Identificação de anacronismos temporais onde um commit filho possui timestamp anterior ao pai (`TIMESTAMP_ANACHRONISM`) ou datas no futuro (`TIMESTAMP_FUTURE`).
- **Conformidade de Modos de Arquivo**: Bloqueio de modos octais corrompidos ou não reconhecidos pelo Git (`INVALID_FILE_MODE`).
- **Conectividade do Histórico**: Detecção de raízes órfãs e commits desvinculados (`DISCONNECTED_HEAD`).

---

## Instalação e Testes

### Requisitos

- Node.js 22.0.0 ou superior

### Instalação

```bash
git clone https://github.com/FelipeMadson/forensic-git-slug.git
cd forensic-git-slug
npm install
```

### Executar Testes Automatizados

```bash
npm test
```

### Verificação Estática de Tipos

```bash
npm run typecheck
```

---

## Licença

Distribuído sob a licença [MIT](LICENSE).
