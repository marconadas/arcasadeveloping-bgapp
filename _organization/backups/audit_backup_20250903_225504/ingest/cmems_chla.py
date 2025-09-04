from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
from typing import Optional

from copernicusmarine import subset  # type: ignore


def main(argv: Optional[list[str]] = None) -> None:
    parser = argparse.ArgumentParser(description="CMEMS chl-a subset via Marine Toolbox")
    parser.add_argument("--dataset-id", default="GLOBAL_ANALYSISFORECAST_BGC_001_028")
    parser.add_argument("--variable", default="chl")
    parser.add_argument("--min-lon", type=float, default=-20)
    parser.add_argument("--max-lon", type=float, default=20)
    parser.add_argument("--min-lat", type=float, default=-30)
    parser.add_argument("--max-lat", type=float, default=12)
    parser.add_argument("--start", type=str, default="2024-06-01")
    parser.add_argument("--end", type=str, default="2024-06-30")
    parser.add_argument("--out", type=Path, default=Path(f"cmems_chla_{datetime.utcnow().strftime('%Y%m%d')}.nc"))
    args = parser.parse_args(argv)

    subset(
        dataset_id=args.dataset_id,
        variables=[args.variable],
        minimum_longitude=args.min_lon,
        maximum_longitude=args.max_lon,
        minimum_latitude=args.min_lat,
        maximum_latitude=args.max_lat,
        start_datetime=args.start,
        end_datetime=args.end,
        output_filename=str(args.out),
    )
    print(f"Saved {args.out}")


if __name__ == "__main__":
    main()
