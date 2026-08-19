"""Pagination helper used by every list endpoint."""
from __future__ import annotations

from typing import Any, Iterable
from urllib.parse import urlencode

from django.http import HttpRequest


MAX_PAGE_SIZE = 100
DEFAULT_PAGE_SIZE = 20


def paginate(
    request: HttpRequest,
    queryset: Iterable[Any],
    serializer,
    *,
    page: int | None = None,
    page_size: int | None = None,
) -> dict:
    """Return ``{count, next, previous, results}`` shaped per TechSpecs §6."""
    try:
        page = int(page or request.GET.get("page", 1))
    except (TypeError, ValueError):
        page = 1
    try:
        page_size = int(page_size or request.GET.get("page_size", DEFAULT_PAGE_SIZE))
    except (TypeError, ValueError):
        page_size = DEFAULT_PAGE_SIZE

    page = max(page, 1)
    page_size = max(min(page_size, MAX_PAGE_SIZE), 1)

    if hasattr(queryset, "count"):
        count = queryset.count()
    else:  # pragma: no cover - lists/iterables.
        queryset = list(queryset)
        count = len(queryset)
    start = (page - 1) * page_size
    end = start + page_size
    page_qs = queryset[start:end]

    base = request.build_absolute_uri(request.path)
    qd = request.GET.copy() if request.GET else {}

    def with_page(p: int) -> str:
        params = {**qd, "page": p, "page_size": page_size}
        return f"{base}?{urlencode(params, doseq=True)}"

    has_next = end < count
    has_prev = page > 1

    results = [serializer(item) for item in page_qs]
    return {
        "count": count,
        "next": with_page(page + 1) if has_next else None,
        "previous": with_page(page - 1) if has_prev else None,
        "results": results,
    }
