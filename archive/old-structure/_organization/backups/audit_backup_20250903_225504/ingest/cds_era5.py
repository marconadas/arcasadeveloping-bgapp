from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
from typing import Optional

import cdsapi


def main(argv: Optional[list[str]] = None) -> None:
    parser = argparse.ArgumentParser(description="CDS ERA5 downloader")
    parser.add_argument("--dataset", default="reanalysis-era5-single-levels")
    parser.add_argument("--variables", nargs="+", default=["10m_u_component_of_wind", "10m_v_component_of_wind"])
    parser.add_argument("--area", nargs=4, type=float, default=[42.5, -10.0, 36.5, -6.0])  # N, W, S, E
    parser.add_argument("--year", default="2024")
    parser.add_argument("--month", default="06")
    parser.add_argument("--day", default="01")
    parser.add_argument("--time", nargs="+", default=["00:00", "06:00", "12:00", "18:00"])
    parser.add_argument("--out", type=Path, default=Path(f"era5_{datetime.utcnow().strftime('%Y%m%d')}.nc"))
    args = parser.parse_args(argv)

    try:
        c = cdsapi.Client()
        c.retrieve(
            args.dataset,
            {
                "variable": args.variables,
                "product_type": "reanalysis",
                "year": args.year,
                "month": args.month,
                "day": args.day,
                "time": args.time,
                "area": args.area,
                "format": "netcdf",
            },
            str(args.out)
        )
        print(f"Downloaded {args.out}")
    except Exception as e:
        print(f"CDS download failed (expected without API key): {e}")
        # Create placeholder
        args.out.write_bytes(b"")
        print(f"Created placeholder {args.out}")


if __name__ == "__main__":
    main()
