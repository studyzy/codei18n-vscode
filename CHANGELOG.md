# Change Log

All notable changes to the "codei18n-vscode" extension will be documented in this file.

## [Unreleased]

### Added
- JavaScript and TypeScript comment translation support.
  - Full support for line comments (`//`) and block comments (`/* */`).
  - Consistent user experience with Go and Rust support.
  - Automatic activation when opening `.js`, `.ts`, `.jsx`, or `.tsx` files.
  - Hover provider for viewing original comments in JavaScript/TypeScript files.

## [0.2.0] - 2025-12-17

### Added
- Rust source code comment translation support.
  - Supports all Rust comment types: line (`//`), block (`/* */`), doc (`///`, `//!`), and external doc (`/** */`, `/*! */`).
  - Consistent user experience with Go language support.
  - Independent Hover Provider for Rust files.
  - Isolated caching for multi-language workspaces.

### Changed
- Parameterized language support logic to facilitate future language extensions.
- Improved logging to distinguish between different language files.
