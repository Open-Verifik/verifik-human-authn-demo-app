import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../../constants/tokens';

type Props = {
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  label?: string;
  hint?: string;
  required?: boolean;
};

export default function HumanIdJsonKeyValueField({ value, onChange, label, hint, required }: Props) {
  const entries = Object.entries(value);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  const updatePair = (key: string, val: string) => {
    onChange({ ...value, [key]: val });
  };

  const removePair = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const addPair = () => {
    const k = newKey.trim();
    if (!k) return;
    onChange({ ...value, [k]: newVal });
    setNewKey('');
    setNewVal('');
  };

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {entries.map(([k, v]) => (
        <View key={k} style={styles.row}>
          <TextInput
            style={[styles.input, styles.keyInput]}
            value={k}
            editable={false}
          />
          <TextInput
            style={[styles.input, styles.valInput]}
            value={v}
            onChangeText={(t) => updatePair(k, t)}
          />
          <TouchableOpacity onPress={() => removePair(k)}>
            <Text style={styles.remove}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.keyInput]}
          placeholder="key"
          placeholderTextColor={colors.outline}
          value={newKey}
          onChangeText={setNewKey}
        />
        <TextInput
          style={[styles.input, styles.valInput]}
          placeholder="value"
          placeholderTextColor={colors.outline}
          value={newVal}
          onChangeText={setNewVal}
        />
        <TouchableOpacity onPress={addPair} style={styles.addBtn}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: {
    color: colors.onSurface,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  required: { color: colors.error },
  hint: {
    color: colors.onSurfaceVariant,
    fontSize: typography.sizes.xs,
    marginBottom: spacing.xs,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
  },
  keyInput: { flex: 0.9 },
  valInput: { flex: 1.2 },
  remove: { color: colors.error, fontSize: 22, paddingHorizontal: spacing.xs },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: colors.primary, fontSize: 22, fontWeight: typography.weights.bold },
});
