# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x     | ✅         |
| 1.x     | ❌         |

## Reporting a Vulnerability

This package ships documentation and a small Node CLI that copies files into your project — it executes no remote code and collects no data. If you nonetheless find a security issue (for example in the installer's file handling):

1. **Do not** open a public issue.
2. Report it privately via GitHub's [**Report a vulnerability**](https://github.com/jeffrey2423/coding-standards/security/advisories/new) (Security → Advisories).

You can expect an initial response within a few days. Once fixed, a patched version will be published to npm and the advisory disclosed.

## Scope

- ✅ The installer (`bin/cli.js`) and published package contents.
- ❌ The third-party libraries *recommended* in the standards — report those to their respective maintainers.
