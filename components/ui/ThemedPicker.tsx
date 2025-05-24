import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React from "react";
import {
  ActionSheetIOS,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";

import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface Option<T> {
  label: string;
  value: T;
}

interface ThemedPickerProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
}

export function ThemedPicker<T extends string>({
  label,
  value,
  onChange,
  options,
}: ThemedPickerProps<T>) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const handlePress = () => {
    if (Platform.OS === "ios") {
      const optionLabels = options.map((opt) => opt.label);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...optionLabels, "Cancel"],
          cancelButtonIndex: optionLabels.length,
        },
        (buttonIndex) => {
          if (buttonIndex < optionLabels.length) {
            onChange(options[buttonIndex].value);
          }
        },
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">{label}</ThemedText>

      {Platform.OS === "ios" ? (
        <Pressable
          style={[
            styles.pickerContainer,
            {
              backgroundColor: isDark ? "#1c1c1e" : "#f2f2f7",
              borderColor: isDark ? "#3a3a3c" : "#ccc",
            },
          ]}
          onPress={handlePress}
        >
          <ThemedText
            style={[styles.pickerText, { color: isDark ? "#fff" : "#000" }]}
          >
            {options.find((opt) => opt.value === value)?.label}
          </ThemedText>
          <Ionicons
            name="chevron-down"
            size={16}
            color={isDark ? "#fff" : "#000"}
          />
        </Pressable>
      ) : (
        <View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: isDark ? "#1c1c1e" : "#f2f2f7",
              borderColor: isDark ? "#3a3a3c" : "#ccc",
            },
          ]}
        >
          <Picker
            selectedValue={value}
            onValueChange={(v) => onChange(v as T)}
            style={[styles.picker, { color: isDark ? "#fff" : "#000" }]}
            dropdownIconColor={isDark ? "#fff" : "#000"}
            mode="dropdown"
          >
            {options.map((opt) => (
              <Picker.Item
                key={opt.value}
                label={opt.label}
                value={opt.value}
              />
            ))}
          </Picker>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 16,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  pickerText: {
    fontSize: 16,
  },
  picker: {
    flex: 1,
    height: 44,
  },
});
