import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { eventsApi } from '../api/eventsApi';
import { useAuth } from './AuthContext';

const EventContext = createContext(null);

export const EventProvider = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(() => localStorage.getItem('clubops_selected_event') || null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventHealth, setEventHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await eventsApi.getEvents();
      if (res.success && res.events) {
        setEvents(res.events);
        // Default to first event if none selected or invalid
        if (!selectedEventId && res.events.length > 0) {
          setSelectedEventId(res.events[0]._id);
          localStorage.setItem('clubops_selected_event', res.events[0]._id);
        }
      }
    } catch (err) {
      console.error('[EventContext] Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedEventId]);

  const refreshEventHealth = useCallback(async () => {
    if (!selectedEventId) return;
    try {
      setHealthLoading(true);
      const res = await eventsApi.getEventHealth(selectedEventId);
      if (res.success) {
        setEventHealth(res.health);
      }
    } catch (err) {
      console.error('[EventContext] Error fetching health:', err);
    } finally {
      setHealthLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEventId && events.length > 0) {
      const found = events.find(e => e._id === selectedEventId);
      setCurrentEvent(found || events[0]);
      refreshEventHealth();
    }
  }, [selectedEventId, events, refreshEventHealth]);

  const selectEvent = (eventId) => {
    setSelectedEventId(eventId);
    localStorage.setItem('clubops_selected_event', eventId);
    const found = events.find(e => e._id === eventId);
    if (found) {
      setCurrentEvent(found);
    }
  };

  const createAndSelectEvent = async (eventData) => {
    const res = await eventsApi.createEvent(eventData);
    if (res.success && res.event) {
      const newEv = res.event;
      setEvents(prev => [newEv, ...prev]);
      setSelectedEventId(newEv._id);
      setCurrentEvent(newEv);
      localStorage.setItem('clubops_selected_event', newEv._id);
      await fetchEvents();
      return newEv;
    }
    throw new Error(res.message || 'Failed to create event');
  };

  return (
    <EventContext.Provider value={{
      events,
      selectedEventId,
      currentEvent,
      eventHealth,
      loading,
      healthLoading,
      selectEvent,
      fetchEvents,
      refreshEventHealth,
      createAndSelectEvent
    }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error('useEvent must be used within an EventProvider');
  return context;
};
