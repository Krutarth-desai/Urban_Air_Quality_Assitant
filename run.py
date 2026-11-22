#!/usr/bin/env python3
"""
SmogShield — Direct Application Runner
Starts the Next.js Urban Air Quality & Low-Emission Assistant with automatic
environment setup, dependency verification, and browser launching.
"""

import argparse
import os
import shutil
import socket
import subprocess
import sys
import time
import urllib.request
import webbrowser
from pathlib import Path
from threading import Thread

BANNER = r"""
========================================================================
   ____                             ____  __     _      __    __
  / __/___ ___  ___  ___ _ ___  ___/ / / / /    (_)___ / /___/ /
 _\ \ / _ ` _ \/ _ \/ _ `// _ \(_-</ _ \/ /__  / // -_) // _  / 
/___//_//_//_/\___/\_, // .__//___/_//_/____/ /_/ \__/_/ \_,_/  
                  /___//_/                                      
   Urban Air Quality & Low-Emission Lifestyle Assistant
========================================================================
"""

ROOT_DIR = Path(__file__).resolve().parent


def is_port_in_use(port: int) -> bool:
    """Check if a given local TCP port is already open."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0


def wait_for_server(url: str, timeout_sec: int = 45) -> bool:
    """Poll URL until server responds or timeout occurs."""
    start = time.time()
    while time.time() - start < timeout_sec:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "SmogShield-Runner"})
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(0.8)
    return False


def ensure_environment() -> None:
    """Verify Node.js, npm, environment file, and dependencies."""
    print("[1/4] Checking prerequisites...")

    node_bin = shutil.which("node")
    npm_bin = shutil.which("npm") or shutil.which("npm.cmd")

    if not node_bin or not npm_bin:
        print("\n[ERROR] Node.js and npm are required to run this application.")
        print("Please install Node.js (v18.18+ or v20+) from https://nodejs.org/\n")
        sys.exit(1)

    try:
        node_ver = subprocess.check_output([node_bin, "-v"], text=True).strip()
        print(f"  • Node.js version: {node_ver}")
    except Exception:
        pass

    # Ensure .env.local exists
    env_local = ROOT_DIR / ".env.local"
    env_example = ROOT_DIR / ".env.example"

    print("[2/4] Checking environment configuration...")
    if not env_local.exists():
        if env_example.exists():
            shutil.copy(env_example, env_local)
            print(f"  • Created .env.local from .env.example")
            print("  • Note: Add your GEMINI_API_KEY in .env.local to enable live AI coaching.")
            print("  • (Built-in deterministic fallback engine will run automatically if no key is provided).")
        else:
            with open(env_local, "w", encoding="utf-8") as f:
                f.write("GEMINI_API_KEY=your_google_ai_studio_api_key_here\nGEMINI_MODEL=gemini-2.5-flash\n")
            print("  • Created default .env.local")
    else:
        print("  • Found existing .env.local")

    # Ensure dependencies are installed
    node_modules = ROOT_DIR / "node_modules"
    print("[3/4] Checking project dependencies...")
    if not node_modules.exists():
        print("  • node_modules not detected. Running 'npm install'...")
        cmd = [npm_bin, "install"]
        ret = subprocess.call(cmd, cwd=str(ROOT_DIR), shell=(os.name == "nt"))
        if ret != 0:
            print("\n[ERROR] npm install failed. Please inspect the output above.\n")
            sys.exit(ret)
    else:
        print("  • Dependencies already installed.")


def run_app(port: int = 3000, production: bool = False, open_browser: bool = True) -> None:
    """Launch the Next.js development or production server."""
    npm_bin = shutil.which("npm") or shutil.which("npm.cmd")
    if not npm_bin:
        print("[ERROR] Cannot find npm executable.")
        sys.exit(1)

    server_url = f"http://localhost:{port}"

    if open_browser:
        def launch_browser():
            if wait_for_server(server_url, timeout_sec=60):
                print(f"\n[INFO] Server ready! Opening {server_url} in your default browser...")
                webbrowser.open(server_url)

        thread = Thread(target=launch_browser, daemon=True)
        thread.start()

    print(f"[4/4] Starting SmogShield {'production' if production else 'development'} server...")
    print(f"  • Local URL: {server_url}")
    print("  • Press Ctrl+C at any time to stop the server.\n")

    cmd = (
        [npm_bin, "run", "start", "--", "-p", str(port)]
        if production
        else [npm_bin, "run", "dev", "--", "-p", str(port)]
    )

    try:
        proc = subprocess.Popen(cmd, cwd=str(ROOT_DIR), shell=(os.name == "nt"))
        proc.wait()
    except KeyboardInterrupt:
        print("\n[INFO] Shutting down SmogShield server gracefully...")
        try:
            proc.terminate()
            proc.wait(timeout=3)
        except Exception:
            proc.kill()
        print("[INFO] Server stopped. Have a clean-air day!")


def main():
    parser = argparse.ArgumentParser(
        description="Run SmogShield — Urban Air Quality & Low-Emission Lifestyle Assistant"
    )
    parser.add_argument(
        "--port",
        "-p",
        type=int,
        default=3000,
        help="Port number to listen on (default: 3000)",
    )
    parser.add_argument(
        "--prod",
        "--production",
        action="store_true",
        help="Run in production mode (requires previous 'npm run build')",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not automatically open the web browser on startup",
    )

    args = parser.parse_args()

    print(BANNER)
    ensure_environment()
    run_app(
        port=args.port,
        production=args.prod,
        open_browser=not args.no_browser,
    )


if __name__ == "__main__":
    main()
