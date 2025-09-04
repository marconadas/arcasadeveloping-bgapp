from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
from typing import Optional

import openeo


def main(argv: Optional[list[str]] = None) -> None:
    parser = argparse.ArgumentParser(description="CDSE Sentinel downloader via openEO")
    parser.add_argument("--collection", default="SENTINEL2_L2A")
    parser.add_argument("--bands", nargs="+", default=["B04", "B08"])  # Red, NIR for NDVI
    parser.add_argument("--bbox", nargs=4, type=float, default=[-10.0, 36.5, -6.0, 42.5])
    parser.add_argument("--start", default="2024-06-01")
    parser.add_argument("--end", default="2024-06-30")
    parser.add_argument("--out", type=Path, default=Path(f"cdse_s2_{datetime.utcnow().strftime('%Y%m%d')}.tif"))
    args = parser.parse_args(argv)

    # Placeholder implementation (requires CDSE credentials)
    try:
        conn = openeo.connect("openeo.dataspace.copernicus.eu")
        # conn.authenticate_oidc()  # Requires CDSE account
        
        cube = conn.load_collection(
            args.collection,
            spatial_extent={"west": args.bbox[0], "south": args.bbox[1], 
                          "east": args.bbox[2], "north": args.bbox[3]},
            temporal_extent=[args.start, args.end],
            bands=args.bands
        )
        
        # Simple NDVI calculation if Red/NIR bands
        if "B04" in args.bands and "B08" in args.bands:
            red = cube.band("B04")
            nir = cube.band("B08") 
            ndvi = (nir - red) / (nir + red)
            cube = ndvi
        
        # Download (requires authentication)
        # cube.download(str(args.out))
        print(f"CDSE openEO cube prepared. Would download to {args.out}")
        print("Note: Requires CDSE authentication for actual download")
        
    except Exception as e:
        print(f"CDSE connection failed (expected without credentials): {e}")
        # Create placeholder
        args.out.write_bytes(b"")
        print(f"Created placeholder {args.out}")


if __name__ == "__main__":
    main()
