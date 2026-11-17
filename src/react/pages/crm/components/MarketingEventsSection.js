import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import {api} from '@controleonline/ui-common/src/api';
import {colors} from '@controleonline/../../src/styles/colors';
import {
  EVENT_LABELS,
  normalizePeopleIri,
  extractCollection,
  buildUtmSummary,
} from '../marketingEventsHelpers';
import styles from './MarketingEventsSection.styles';

const formatEventAt = value => {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  } catch {
    return String(value);
  }
};

/**
 * Timeline of marketing conversion events for a People (lead) in CRM context.
 * Consumes GET /marketing_events?people=/people/{id}&order[eventAt]=desc
 */
export default function MarketingEventsSection({peopleRef, peopleName}) {
  const peopleIri = useMemo(() => normalizePeopleIri(peopleRef), [peopleRef]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);

  const loadEvents = useCallback(async () => {
    if (!peopleIri) {
      setEvents([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.fetch('/marketing_events', {
        params: {
          people: peopleIri,
          'order[eventAt]': 'desc',
          itemsPerPage: 50,
        },
      });
      setEvents(extractCollection(response));
    } catch (err) {
      const message =
        err?.response?.data?.['hydra:description'] ||
        err?.message ||
        'Failed to load marketing events';
      setError(String(message));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [peopleIri]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  if (!peopleIri) {
    return null;
  }

  return (
    <View style={styles.container} testID="marketing-events-section">
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(prev => !prev)}
        accessibilityRole="button">
        <Text style={styles.title}>
          Marketing / conversão
          {peopleName ? ` · ${peopleName}` : ''}
        </Text>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.body}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : null}

          {!loading && error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={loadEvents} style={styles.retryButton}>
                <Text style={styles.retryText}>Tentar de novo</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!loading && !error && events.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhum evento de marketing registrado para este lead.
            </Text>
          ) : null}

          {!loading &&
            !error &&
            events.map(event => {
              const key =
                event?.id ?? event?.['@id'] ?? `${event?.eventName}-${event?.eventAt}`;
              const label = EVENT_LABELS[event?.eventName] || event?.eventName || 'event';
              const utm = buildUtmSummary(event);
              return (
                <View key={String(key)} style={styles.eventCard} testID="marketing-event-item">
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventName}>{label}</Text>
                    <Text style={styles.eventAt}>{formatEventAt(event?.eventAt)}</Text>
                  </View>
                  {utm ? <Text style={styles.utmLine}>{utm}</Text> : null}
                  {event?.pageUrl ? (
                    <Text style={styles.pageUrl} numberOfLines={2}>
                      {event.pageUrl}
                    </Text>
                  ) : null}
                  {event?.referrer ? (
                    <Text style={styles.metaLine} numberOfLines={1}>
                      ref: {event.referrer}
                    </Text>
                  ) : null}
                  {event?.visitorId ? (
                    <Text style={styles.metaLine} numberOfLines={1}>
                      visitor: {event.visitorId}
                    </Text>
                  ) : null}
                </View>
              );
            })}
        </View>
      ) : null}
    </View>
  );
}
