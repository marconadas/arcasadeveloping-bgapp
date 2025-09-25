from __future__ import annotations

from prefect import flow, task
import subprocess


@task
def collect_metrics_task() -> None:
    subprocess.run(["python", "scripts/collect_metrics.py"], check=True)


@flow(name="bgapp-metrics-demo")
def metrics_flow() -> None:
    collect_metrics_task()


if __name__ == "__main__":
    metrics_flow()
