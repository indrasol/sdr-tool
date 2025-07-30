"""IR → View emitter registry.

Each emitter converts an ``IRGraph`` into a concrete *view payload*.
Currently supported: React-Flow JSON (default), D2 text, C4-Context diagram.

Emitters should **not** perform layout – they merely translate structure.
If a view requires spatial information, feed the IR through a dedicated
layout engine first and pass the positioned graph to the emitter.
"""

from __future__ import annotations

from typing import Dict, Type

from core.ir.ir_types import IRGraph
from utils.logger import log_info, log_error

# ---------------------------------------------------------------------------
#  Base interface
# ---------------------------------------------------------------------------

class ViewEmitter:
    view_id: str  # human-friendly identifier, e.g. "reactflow"

    def emit(self, graph: IRGraph):  # noqa: D401
        """Return a serialisable view payload (dict or str)."""
        raise NotImplementedError


# ---------------------------------------------------------------------------
#  Concrete emitters – imported lazily to avoid heavy deps
# ---------------------------------------------------------------------------

from .reactflow_emitter import ReactFlowEmitter  # noqa: E402
from .d2_emitter import D2Emitter  # noqa: E402
from .c4_emitter import C4ContextEmitter  # noqa: E402

_EMITTERS: Dict[str, ViewEmitter] = {
    ReactFlowEmitter.view_id: ReactFlowEmitter(),
    D2Emitter.view_id: D2Emitter(),
    C4ContextEmitter.view_id: C4ContextEmitter(),
}


def get_emitter(view: str) -> ViewEmitter:
    """Get a view emitter by its ID, with error checking."""
    log_info(f"IR view: Requested emitter for view '{view}'")
    
    try:
        emitter = _EMITTERS[view]
        log_info(f"IR view: Found emitter for view '{view}'")
        return emitter
    except KeyError:  # pragma: no cover
        available_views = list(_EMITTERS.keys())
        log_error(f"IR view: Unknown view '{view}' - available views are {available_views}")
        raise ValueError(f"Unknown view '{view}' – available: {available_views}") 