#!/usr/bin/env bash
# 双击/执行即可：启动本机 Jupyter 内核并打印可粘贴的连接串。
# 不需要手敲任何命令；装依赖、生成证书、选端口都在 start.py 里做。
set -e
cd "$(dirname "$0")"
exec python3 start.py "$@"
