"""Alias for send_morning_digests — per-tenant local clock."""

from scripts.send_morning_digests import run
import asyncio
import logging

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run())
