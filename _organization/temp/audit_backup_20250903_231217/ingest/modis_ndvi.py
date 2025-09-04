from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
from typing import Optional

import requests

# Placeholder simples para ilustração (download real requer autenticação/LP DAAC APIs)

def main(argv: Optional[list[str]] = None) -> None:
    parser = argparse.ArgumentParser(description="MODIS NDVI downloader (placeholder)")
    parser.add_argument("--product", default="MOD13Q1")
    parser.add_argument("--start", type=str, default="2024-06-01")
    parser.add_argument("--end", type=str, default="2024-06-30")
    parser.add_argument("--out", type=Path, default=Path(f"modis_ndvi_{datetime.utcnow().strftime('%Y%m%d')}.tif"))
    args = parser.parse_args(argv)

    # Apenas cria um ficheiro de placeholder para pipeline
    args.out.write_bytes(b"")
    print(f"Created placeholder {args.out}. Implementar download via LP DAAC/earthdata.")


if __name__ == "__main__":
    main()
