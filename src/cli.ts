#!/usr/bin/env node
import { GitForensicAnalyzer } from './analyzer.ts';

const analyzer = new GitForensicAnalyzer();
const report = analyzer.analyze(process.cwd());

console.log(JSON.stringify(report, null, 2));
