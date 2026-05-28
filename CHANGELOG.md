# Changelog

All notable changes to **NicoNico Auto Set Language** are documented in this file.

The format follows the principles of
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and the project
roughly adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.10.0] - 2026-05-24

### Changed

- **Codebase rebuilt**: Complete refactoring for simplicity and consistency — reduced to single-file 140-line userscript with zero runtime dependencies.
- **Infrastructure modernization**: Migrated to pnpm 11.2.2, Node.js 26.x, TypeScript 6.0.3, Biome 2.4.x, Terser 5.x.

### Added

- **CI/CD pipeline**: Added CI workflow (quality gate + build on push/PR) and release workflow (tag-triggered build, `@version` sync, `@downloadURL`/`@updateURL` sync, GitHub Release, release branch deployment).
- **Security hardening**: Added Dependabot with auto-merge, pinned all GitHub Actions to commit SHAs, hardened pnpm workspace configuration.
- **Developer documentation**: Added `README.md`, `CODE_STANDARDS.md`, `CONTRIBUTING.md`, `AGENTS.md`, and `TESTING.md`.
- **Security scanning**: Added automated security scanning workflow (CodeQL).

### Fixed

- **CI workflow**: Removed redundant `pnpm/action-setup` guard, standardized Node.js version enforcement across workflows, simplified build commands.
- **Build output**: Fixed TypeScript 6 deprecation warnings in tsconfig.
- **Dependencies**: Bumped `minimatch` for security audit fix; updated `lru-cache` to 11.x.

## [0.9.2] - 2025-12-17

### Changed

- **Documentation**: Updated README with development instructions and workflow details.
