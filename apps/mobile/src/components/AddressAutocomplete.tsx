import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressAutocompleteProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect?: (result: { address: string; lat: number; lon: number }) => void;
  placeholder?: string;
}

const DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 3;

export function AddressAutocomplete({
  label,
  value,
  onChangeText,
  onSelect,
  placeholder = 'Search for an address...',
}: AddressAutocompleteProps) {
  const { colors } = useTheme();
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchAddress = useCallback(
    async (query: string) => {
      if (query.length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '5',
        });
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          {
            headers: {
              'User-Agent': 'SiteMap-Mobile/1.0',
              Accept: 'application/json',
            },
          },
        );
        const data: NominatimResult[] = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    },
    [],
  );

  const handleChangeText = (text: string) => {
    onChangeText(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddress(text);
    }, DEBOUNCE_MS);
  };

  const handleSelect = (result: NominatimResult) => {
    onChangeText(result.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    onSelect?.({
      address: result.display_name,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
    });
  };

  return (
    <View>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
        />
        {isSearching && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {showSuggestions && (
        <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.place_id}
              style={[styles.suggestion, { borderBottomColor: colors.border }]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <MapPin color={colors.textSecondary} size={14} />
              <Text
                style={[styles.suggestionText, { color: colors.text }]}
                numberOfLines={2}
              >
                {item.display_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingRight: 10,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  suggestionsContainer: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
