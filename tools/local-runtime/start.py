#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生命时序 Notebook 的本机内核启动器。

做四件事，全部封装在这里，用户不需要敲任何命令：
  1. 选一个空闲端口（默认 8888）；
  2. 复用/生成一个随机 token（存在 ~/.laup-runtime/token，不写进仓库）；
  3. 复用/生成自签证书（~/.laup-runtime/cert.pem / key.pem，SAN 含 127.0.0.1 与 localhost）；
  4. 启动 `jupyter lab --no-browser`（只监听 127.0.0.1），并打印可直接粘贴的连接串。

站点连的是 wss://127.0.0.1:<port>，所以必须开 TLS；浏览器第一次会提示
「您的连接不是私密连接」，点「高级 → 继续前往」信任一次即可（每个浏览器一次）。

用法（一般不用手敲）：
    python start.py [--port 8888] [--site https://额外的站点域名]
"""

import argparse
import datetime
import ipaddress
import json
import os
import platform
import secrets
import shutil
import socket
import ssl
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

HOME = Path.home() / ".laup-runtime"
CERT = HOME / "cert.pem"
KEY = HOME / "key.pem"
TOKEN_FILE = HOME / "token"
WORKSPACE = HOME / "workspace"
# 最近一次启动的完整输出：窗口一闪而过、或已经关掉时，靠它查发生了什么
LOG_FILE = HOME / "last-run.log"

# 允许访问内核的页面来源：本机任意端口（dev server 常换端口）+ 线上站点
DEFAULT_SITES = ["https://life_tree.xuling.tv", "https://life-tree.xuling.tv"]


def log(message=""):
    print(message, flush=True)
    try:
        HOME.mkdir(parents=True, exist_ok=True)
        with LOG_FILE.open("a", encoding="utf-8") as file:
            file.write(str(message) + "\n")
    except Exception:  # noqa: BLE001 - 日志写不了也不该影响启动
        pass


def fail(message, hint=""):
    log()
    log("✗ " + message)
    if hint:
        log("  " + hint)
    log()
    sys.exit(1)


def free_port(start):
    """从 start 开始找一个能绑的端口。"""
    for port in range(start, start + 30):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    fail(f"从 {start} 起的 30 个端口都被占用了。", "先关掉旧的 Jupyter，或用 --port 指定别的位置。")


def read_or_make_token():
    try:
        token = TOKEN_FILE.read_text(encoding="utf-8").strip()
        if token:
            return token
    except OSError:
        pass
    token = secrets.token_urlsafe(24)
    HOME.mkdir(parents=True, exist_ok=True)
    TOKEN_FILE.write_text(token, encoding="utf-8")
    return token


def cert_ok():
    """证书存在且还能用 7 天以上就复用（避免每次启动都重新信任）。"""
    try:
        info = ssl._ssl._test_decode_cert(str(CERT))  # 只解析，不校验信任链
        not_after = info.get("notAfter", "")
        expires = datetime.datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z").replace(
            tzinfo=datetime.timezone.utc,
        )
        return KEY.exists() and expires - datetime.datetime.now(datetime.timezone.utc) > datetime.timedelta(days=7)
    except Exception:
        return False


def make_cert_cryptography():
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.x509.oid import NameOID

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "127.0.0.1")])
    now = datetime.datetime.now(datetime.timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=1))
        .not_valid_after(now + datetime.timedelta(days=3650))
        .add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName("localhost"),
                x509.IPAddress(ipaddress.ip_address("127.0.0.1")),
            ]),
            critical=False,
        )
        .sign(key, hashes.SHA256())
    )
    KEY.write_bytes(key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.TraditionalOpenSSL,
        serialization.NoEncryption(),
    ))
    CERT.write_bytes(cert.public_bytes(serialization.Encoding.PEM))


def make_cert_trustme():
    import trustme

    ca = trustme.CA()
    cert = ca.issue_cert("127.0.0.1", "localhost")
    cert.cert_chain_pems[0].write_to_path(str(CERT))
    cert.private_key_pem.write_to_path(str(KEY))


def make_cert_openssl():
    # Windows 上 openssl 通常不在 PATH，但 Git for Windows 自带一份
    candidates = [
        shutil.which("openssl"),
        r"C:\Program Files\Git\usr\bin\openssl.exe",
        r"C:\Program Files\Git\mingw64\bin\openssl.exe",
        r"C:\Program Files (x86)\Git\usr\bin\openssl.exe",
    ]
    openssl = next((path for path in candidates if path and Path(path).exists()), None)
    if not openssl:
        raise FileNotFoundError("openssl")
    subprocess.run([
        openssl, "req", "-x509", "-newkey", "rsa:2048", "-nodes",
        "-keyout", str(KEY), "-out", str(CERT),
        "-days", "3650", "-subj", "/CN=127.0.0.1",
        "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1",
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def pip_install(packages, quiet=True):
    cmd = [sys.executable, "-m", "pip", "install", *packages]
    if quiet:
        cmd += ["--quiet", "--disable-pip-version-check"]
    log("  正在安装：" + " ".join(packages))
    try:
        subprocess.run(cmd, check=True)
        return True
    except Exception as error:  # noqa: BLE001 - 装不上就降级，不该直接崩
        log(f"  安装失败：{error}")
        return False


def has_jupyterlab():
    try:
        subprocess.run([sys.executable, "-m", "jupyter", "lab", "--version"],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except Exception:
        return False


def ensure_jupyter():
    """没有 JupyterLab 就问一句直接装 —— 用户不需要自己敲 pip。"""
    if has_jupyterlab():
        return
    log()
    log("没找到 JupyterLab（代码格要真的执行，需要它）。")
    if not sys.stdin.isatty():
        fail("缺少 JupyterLab。", f"装一次：\n  {sys.executable} -m pip install jupyterlab ipykernel")
    try:
        answer = input("现在自动安装吗？约几十 MB，只需一次 [Y/n] ").strip().lower()
    except EOFError:
        answer = "n"
    if answer not in ("", "y", "yes"):
        fail("已取消。", f"需要时执行：{sys.executable} -m pip install jupyterlab ipykernel")
    if not pip_install(["jupyterlab", "ipykernel"], quiet=False) or not has_jupyterlab():
        fail("JupyterLab 安装失败。", "检查网络 / 代理后重试，或手动执行上面的 pip 命令。")
    log("✓ JupyterLab 安装完成。")


def ensure_cert():
    """能开 TLS 就开；实在装不出证书就退回 http（本机 http 页面照样能用）。"""
    if cert_ok():
        return True
    HOME.mkdir(parents=True, exist_ok=True)
    errors = []
    for maker in (make_cert_cryptography, make_cert_trustme, make_cert_openssl):
        try:
            maker()
            return True
        except Exception as error:  # noqa: BLE001 - 换下一种方式再试
            errors.append(f"{maker.__name__}: {error}")
    log()
    log("首次运行：安装证书依赖 cryptography（约几 MB，只需一次）…")
    if pip_install(["cryptography"]):
        try:
            make_cert_cryptography()
            return True
        except Exception as error:  # noqa: BLE001
            errors.append(f"make_cert_cryptography: {error}")
    log()
    log("⚠ 没能生成自签证书，改为不加密的 http（本机 http 页面可以正常连）。")
    log("  线上 https 页面会被浏览器按「混合内容」拦掉，装好 cryptography 再重启即可启用 TLS。")
    log(f"  手动装：{sys.executable} -m pip install cryptography")
    log("  细节：" + "；".join(errors))
    return False


def origin_pattern(sites):
    """tornado 的 allow_origin_pat：本机任意端口 + 给定的线上站点。"""
    local = r"https?://(127\.0\.0\.1|localhost|\[::1\])(:\d+)?"
    others = [site.replace(".", r"\.") for site in sites if site]
    return "^(" + "|".join([local] + others) + ")$"


def jupyter_cmd(port, token, origin_pat, tls=True):
    cmd = [
        sys.executable, "-m", "jupyter", "lab",
        "--no-browser",
        "--ip=127.0.0.1",
        f"--port={port}",
        f"--ServerApp.token={token}",
        "--ServerApp.password=",
        f"--ServerApp.allow_origin_pat={origin_pat}",
        # 本机单用户 + 随机 token：跨站请求带不了 cookie，关掉 xsrf 只为少一类 403
        "--ServerApp.disable_check_xsrf=True",
        "--ServerApp.open_browser=False",
        f"--ServerApp.root_dir={WORKSPACE}",
        "--ServerApp.log_level=WARN",
    ]
    if tls:
        cmd += [f"--ServerApp.certfile={CERT}", f"--ServerApp.keyfile={KEY}"]
    return cmd


def wait_ready(port, token, child=None, timeout=45, tls=True):
    """等 /api/status 返回 started（自签证书不校验）；子进程提前退出就立刻失败。
    jupyter_server 的 /api/status 也要鉴权，所以必须带上 token。"""
    scheme = "https" if tls else "http"
    context = ssl._create_unverified_context() if tls else None
    url = f"{scheme}://127.0.0.1:{port}/api/status"
    request = urllib.request.Request(url, headers={"Authorization": f"token {token}"})
    deadline = time.time() + timeout
    while time.time() < deadline:
        if child is not None and child.poll() is not None:
            return False
        try:
            with urllib.request.urlopen(request, timeout=2, context=context) as response:
                data = json.loads(response.read().decode("utf-8"))
                if data.get("started"):
                    return True
        except Exception:
            time.sleep(0.5)
    return False


def copy_to_clipboard(text):
    try:
        if platform.system() == "Windows":
            subprocess.run("clip", input=text.encode("utf-16le"), check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif platform.system() == "Darwin":
            subprocess.run("pbcopy", input=text.encode("utf-8"), check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            if shutil.which("xclip"):
                subprocess.run(["xclip", "-selection", "clipboard"], input=text.encode("utf-8"),
                               check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser(description="启动生命时序 Notebook 的本机 Jupyter 内核")
    parser.add_argument("--port", type=int, default=8888, help="首选端口（被占用会自动往后找）")
    parser.add_argument("--site", action="append", default=[], help="额外允许的页面来源（可多次给）")
    args = parser.parse_args()

    # 每次启动重写日志：出问题时只看最近这一次
    try:
        HOME.mkdir(parents=True, exist_ok=True)
        LOG_FILE.write_text(
            f"=== {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===\n", encoding="utf-8"
        )
    except Exception:  # noqa: BLE001
        pass

    try:
        subprocess.run([sys.executable, "-m", "jupyter", "lab", "--version"],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass
    ensure_jupyter()

    requested = args.port
    port = free_port(requested)
    token = read_or_make_token()
    tls = ensure_cert()
    WORKSPACE.mkdir(parents=True, exist_ok=True)

    scheme = "https" if tls else "http"
    url = f"{scheme}://127.0.0.1:{port}/?token={token}"
    origin_pat = origin_pattern(DEFAULT_SITES + args.site)

    log("生命时序 Notebook · 本机内核")
    log("=" * 56)
    log(f"端口    {port}")
    log(f"工作区  {WORKSPACE}")
    if port != requested:
        log(f"注意：{requested} 被别的程序占用了，这次改用 {port}。")
        log("      请用窗口里打印的地址，旧地址会提示「拒绝连接」。")
    log("正在启动 Jupyter Lab，请稍候…")

    child = subprocess.Popen(jupyter_cmd(port, token, origin_pat, tls), cwd=str(WORKSPACE))

    try:
        if not wait_ready(port, token, child, tls=tls):
            log("✗ Jupyter 没有就绪（进程可能已退出），请看上方它的报错输出。")
            child.terminate()
            try:
                child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                child.kill()
            sys.exit(1)

        copy_to_clipboard(url)
        log()
        log("✓ 就绪。把下面这一整行粘贴到 Notebook 的「内核」对话框（已尝试复制到剪贴板）：")
        log()
        log("  " + url)
        log()
        log("第一次使用（每个浏览器一次）：")
        log("  1) 在浏览器里打开上面的地址；")
        if tls:
            log("  2) 若提示「您的连接不是私密连接」，点「高级 → 继续前往」。")
        log(f"  {'3' if tls else '2'}) 回到 Notebook 页面点「连接」。")
        log()
        log("⚠ 这个窗口要一直开着。关掉窗口 = 停止服务，那个地址会变成「拒绝连接」。")
        log("=" * 56)
        log()

        # 前台等子进程；Ctrl+C 时把它一起收掉，避免留下孤儿内核
        child.wait()
    except KeyboardInterrupt:
        log("\n正在停止…")
        child.terminate()
        try:
            child.wait(timeout=8)
        except subprocess.TimeoutExpired:
            child.kill()
    finally:
        if child.poll() is None:
            child.terminate()


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:  # noqa: BLE001 - 双击运行时窗口可能一闪而过，把堆栈留在日志里
        import traceback

        log(traceback.format_exc())
        log("启动器异常退出。日志：" + str(LOG_FILE))
        raise
