from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
from typing import Optional

from erddapy import ERDDAP


def main(argv: Optional[list[str]] = None) -> None:
    parser = argparse.ArgumentParser(description="ERDDAP SST downloader")
    parser.add_argument("--server", default="https://www.ncei.noaa.gov/erddap")
    parser.add_argument("--dataset", default="ncdcOwTemperatures")
    parser.add_argument("--bbox", nargs=4, type=float, default=[8.5, -18.2, 17.5, -4.2])  # Angola ZEE corrigida
    parser.add_argument("--start", default="2024-06-01T00:00:00Z")
    parser.add_argument("--end", default="2024-06-30T23:59:59Z")
    parser.add_argument("--out", type=Path, default=Path(f"erddap_sst_{datetime.utcnow().strftime('%Y%m%d')}.csv"))
    args = parser.parse_args(argv)

    try:
        e = ERDDAP(server=args.server)
        e.dataset_id = args.dataset
        e.response = "csv"
        e.constraints = {
            "time>=": args.start,
            "time<=": args.end,
            "longitude>=": args.bbox[0],
            "longitude<=": args.bbox[2], 
            "latitude>=": args.bbox[1],
            "latitude<=": args.bbox[3],
        }
        df = e.to_pandas()
        df.to_csv(args.out, index=False)
        print(f"Downloaded {len(df)} records to {args.out}")
    except Exception as e:
        print(f"ERDDAP download failed: {e}")
        # Create placeholder
        args.out.write_text("time,latitude,longitude,sea_surface_temperature\n")
        print(f"Created placeholder {args.out}")


if __name__ == "__main__":
    main()
