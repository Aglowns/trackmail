"""
Event Service for TrackMail
Handles application event tracking and management
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from supabase import Client


class EventService:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client

    async def get_events(self, application_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get events, optionally filtered by application_id"""
        try:
            query = self.supabase.table("application_events").select("*")
            
            if application_id:
                query = query.eq("application_id", application_id)
            
            result = query.order("created_at", desc=True).execute()
            return result.data or []
            
        except Exception as e:
            print(f"Error getting events: {e}")
            raise

    async def create_event(
        self, 
        application_id: str, 
        event_type: str, 
        event_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new application event"""
        try:
            event_record = {
                "application_id": application_id,
                "event_type": event_type,
                "event_data": event_data,
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table("application_events").insert(event_record).execute()
            return result.data[0] if result.data else {}
            
        except Exception as e:
            print(f"Error creating event: {e}")
            raise

    async def get_events_by_type(
        self, 
        event_type: str, 
        application_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get events by type, optionally filtered by application_id"""
        try:
            query = self.supabase.table("application_events").select("*").eq("event_type", event_type)
            
            if application_id:
                query = query.eq("application_id", application_id)
            
            result = query.order("created_at", desc=True).execute()
            return result.data or []
            
        except Exception as e:
            print(f"Error getting events by type: {e}")
            raise

    async def update_event(
        self, 
        event_id: str, 
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an existing event"""
        try:
            result = self.supabase.table("application_events").update(updates).eq("id", event_id).execute()
            return result.data[0] if result.data else {}
            
        except Exception as e:
            print(f"Error updating event: {e}")
            raise

    async def delete_event(self, event_id: str) -> bool:
        """Delete an event"""
        try:
            result = self.supabase.table("application_events").delete().eq("id", event_id).execute()
            return True
            
        except Exception as e:
            print(f"Error deleting event: {e}")
            raise
