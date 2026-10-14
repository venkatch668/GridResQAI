import asyncio
import json
from typing import AsyncGenerator
from server.schemas.api import RealtimeEvent

class EventBroadcaster:
    def __init__(self):
        self._subscribers: list[asyncio.Queue] = []

    async def subscribe(self) -> AsyncGenerator[str, None]:
        queue = asyncio.Queue()
        self._subscribers.append(queue)
        try:
            while True:
                data = await queue.get()
                yield data
        except asyncio.CancelledError:
            pass
        finally:
            if queue in self._subscribers:
                self._subscribers.remove(queue)

    async def publish(self, event: RealtimeEvent):
        payload = f"data: {event.model_dump_json()}\n\n"
        for queue in list(self._subscribers):
            await queue.put(payload)

    async def broadcast(self, event_type: str, entity: str, data: any):
        event = RealtimeEvent(event_type=event_type, entity=entity, data=data)
        await self.publish(event)

broadcaster = EventBroadcaster()

