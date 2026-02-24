import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme/theme';
import { formatPrice } from '../utils/format';
import type { AdvancedFilterState } from '../types/filters';

type AdvancedFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  value: AdvancedFilterState;
  onChange: (next: AdvancedFilterState) => void;
  onReset: () => void;
  onApply: () => void;
  showCategoryFilter?: boolean;
};

const categoryOptions = ['Tools', 'Electrical', 'Plumbing', 'Paint'];

const parsePriceInput = (text: string): number | null => {
  if (!text.trim()) return null;
  const parsed = Number.parseFloat(text);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, parsed);
};

const AdvancedFilterSheet: React.FC<AdvancedFilterSheetProps> = ({
  visible,
  onClose,
  value,
  onChange,
  onReset,
  onApply,
  showCategoryFilter = false,
}) => {
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');
  const topInset = StatusBar.currentHeight ?? 0;

  useEffect(() => {
    setMinInput(typeof value.minPrice === 'number' ? String(value.minPrice) : '');
    setMaxInput(typeof value.maxPrice === 'number' ? String(value.maxPrice) : '');
  }, [value.minPrice, value.maxPrice, visible]);

  const minRatingChips = useMemo(() => [3, 4, 4.5], []);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'flex-end', paddingTop: topInset }}>
        <TouchableOpacity style={{ ...StyleSheet.absoluteFillObject }} activeOpacity={1} onPress={onClose} />

        <View
          style={{
            maxHeight: '84%',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: colors.white,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>Filter</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={18} color={colors.dark} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>Price Range</Text>
              <View style={{ marginTop: 8, flexDirection: 'row', gap: 10 }}>
                <TextInput
                  value={minInput}
                  onChangeText={(text) => {
                    setMinInput(text);
                    onChange({ ...value, minPrice: parsePriceInput(text) });
                  }}
                  placeholder={`${formatPrice(0)} min`}
                  keyboardType="numeric"
                  placeholderTextColor={colors.gray500}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.gray300,
                    borderRadius: radii.md,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontFamily: typography.fonts.regular,
                    color: colors.dark,
                  }}
                />
                <TextInput
                  value={maxInput}
                  onChangeText={(text) => {
                    setMaxInput(text);
                    onChange({ ...value, maxPrice: parsePriceInput(text) });
                  }}
                  placeholder={`${formatPrice(0)} max`}
                  keyboardType="numeric"
                  placeholderTextColor={colors.gray500}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.gray300,
                    borderRadius: radii.md,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontFamily: typography.fonts.regular,
                    color: colors.dark,
                  }}
                />
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>Minimum Rating</Text>
              <View style={{ marginTop: 8, flexDirection: 'row', gap: 10 }}>
                {minRatingChips.map((chip) => {
                  const active = value.minRating === chip;
                  return (
                    <TouchableOpacity
                      key={chip}
                      onPress={() => onChange({ ...value, minRating: active ? null : chip })}
                      style={{
                        borderRadius: 18,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        backgroundColor: active ? colors.dark : colors.gray100,
                      }}
                    >
                      <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: active ? colors.white : colors.dark }}>
                        {chip}+
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ marginTop: 16, gap: 10 }}>
              <TouchableOpacity
                onPress={() => onChange({ ...value, codOnly: !value.codOnly })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <Ionicons name={value.codOnly ? 'checkbox' : 'square-outline'} size={20} color={value.codOnly ? colors.dark : colors.gray600} />
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 13, color: colors.dark }}>COD only</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onChange({ ...value, inStockOnly: !value.inStockOnly })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <Ionicons name={value.inStockOnly ? 'checkbox' : 'square-outline'} size={20} color={value.inStockOnly ? colors.dark : colors.gray600} />
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 13, color: colors.dark }}>In stock only</Text>
              </TouchableOpacity>
            </View>

            {showCategoryFilter ? (
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>Category</Text>
                <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {categoryOptions.map((category) => {
                    const selected = value.categories?.includes(category);
                    return (
                      <TouchableOpacity
                        key={category}
                        onPress={() => {
                          const existing = value.categories ?? [];
                          const next = selected
                            ? existing.filter((item) => item !== category)
                            : [...existing, category];
                          onChange({ ...value, categories: next });
                        }}
                        style={{
                          borderRadius: 18,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          backgroundColor: selected ? colors.dark : colors.gray100,
                        }}
                      >
                        <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: selected ? colors.white : colors.dark }}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={{ marginTop: 16 }}>
              <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>Sort</Text>
              <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { key: 'chip', label: 'Use top chips' },
                  { key: 'best_match', label: 'Best Match' },
                  { key: 'best_seller', label: 'Best Seller' },
                  { key: 'price_asc', label: 'Price ↑' },
                  { key: 'price_desc', label: 'Price ↓' },
                ].map((item) => {
                  const selected = (value.sortOverride ?? 'chip') === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() =>
                        onChange({
                          ...value,
                          sortOverride: item.key as AdvancedFilterState['sortOverride'],
                        })
                      }
                      style={{
                        borderRadius: 18,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        backgroundColor: selected ? colors.dark : colors.gray100,
                      }}
                    >
                      <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: selected ? colors.white : colors.dark }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={onReset}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.gray300,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onApply}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 12,
                backgroundColor: colors.dark,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: typography.fonts.medium, color: colors.white }}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const StyleSheet = {
  absoluteFillObject: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
};

export default AdvancedFilterSheet;
