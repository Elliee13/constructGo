import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { colors, radii, typography } from '../theme/theme';

const cancelReasons = [
  'Changed my mind',
  'Ordered by mistake',
  'Found a better price',
  'Delivery is taking too long',
  'Wrong address/details',
  'Other',
] as const;

type CancelReasonModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string, details?: string) => void;
};

const CancelReasonModal = ({ visible, onClose, onConfirm }: CancelReasonModalProps) => {
  const [selected, setSelected] = useState<string>('');
  const [otherDetails, setOtherDetails] = useState('');

  useEffect(() => {
    if (visible) return;
    setSelected('');
    setOtherDetails('');
  }, [visible]);

  const isOther = selected === 'Other';
  const canConfirm = useMemo(() => {
    if (!selected) return false;
    if (!isOther) return true;
    return otherDetails.trim().length > 0;
  }, [selected, isOther, otherDetails]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback>
            <View
              style={{
                backgroundColor: colors.white,
                borderTopLeftRadius: radii.lg,
                borderTopRightRadius: radii.lg,
                paddingHorizontal: 16,
                paddingTop: 18,
                paddingBottom: 20,
              }}
            >
              <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>
                Cancel Order
              </Text>
              <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                Please select a reason
              </Text>

              <View style={{ marginTop: 14, gap: 10 }}>
                {cancelReasons.map((reason) => {
                  const isSelected = selected === reason;
                  return (
                    <TouchableOpacity
                      key={reason}
                      onPress={() => setSelected(reason)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: isSelected ? colors.dark : colors.gray400,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected ? (
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: colors.dark,
                            }}
                          />
                        ) : null}
                      </View>
                      <Text style={{ fontFamily: typography.fonts.regular, fontSize: 14, color: colors.dark }}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {isOther ? (
                <TextInput
                  value={otherDetails}
                  onChangeText={setOtherDetails}
                  placeholder="Please add details"
                  placeholderTextColor={colors.gray500}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={{
                    marginTop: 12,
                    minHeight: 80,
                    borderWidth: 1,
                    borderColor: colors.gray300,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontFamily: typography.fonts.regular,
                    fontSize: 13,
                    color: colors.dark,
                  }}
                />
              ) : null}

              <View style={{ marginTop: 16, flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.gray300,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.white,
                  }}
                >
                  <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!canConfirm}
                  onPress={() => onConfirm(selected, isOther ? otherDetails.trim() : '')}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: canConfirm ? colors.dark : colors.gray300,
                  }}
                >
                  <Text style={{ fontFamily: typography.fonts.medium, color: canConfirm ? colors.white : colors.gray600 }}>
                    Confirm Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CancelReasonModal;


