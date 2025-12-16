# CodeI18n VSCode Extension

VSCode extension for [CodeI18n](https://github.com/studyzy/codei18n), enabling real-time translation of source code comments.

## Features

- **Auto Translation**: Automatically translates English comments to your native language (e.g., Chinese) in real-time.
- **Non-Destructive**: Visual replacement only; source files are never modified.
- **Hover to View Original**: Hover over translated comments to see the original English text.

## Requirements

You must have the `codei18n` CLI tool installed and available on your system.

### Installing CodeI18n CLI

```bash
go install github.com/studyzy/codei18n/cmd/codei18n@latest
```

Ensure `codei18n` is in your system PATH.

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `codei18n.enable` | `true` | Enable/Disable the extension. |
| `codei18n.cliPath` | `codei18n` | Path to the `codei18n` executable (absolute path recommended if not in PATH). |

## Usage

1. Open any Go (`.go`) file.
2. Comments will be automatically translated.
3. Hover over a translation to view the original text.

## Commands

- `CodeI18n: Toggle Translation`: Quickly enable/disable translation.

## Troubleshooting

- **Error: codei18n process exited**: This usually means the CLI tool is not found or crashed. Check your `codei18n.cliPath` setting.
- **No translations**: Ensure your `codei18n` configuration (mappings) is set up correctly in the project root (`.codei18n/`).

## License

MIT
