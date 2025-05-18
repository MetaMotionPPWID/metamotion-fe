import { Image, StyleSheet } from "react-native";
import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Image } from "react-native";
import { NativeModules } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";

const { MetaWearModule } = NativeModules;

export default function HomeScreen() {
    const [mac, setMac] = useState("");
      const [result, setResult] = useState("");

      const runTest = async () => {
        setResult("Testing...");
        try {
          const res = await MetaWearModule.testFullConnectionCycle(mac);
          setResult(res);
        } catch (err) {
          setResult(`Error: ${err.message || err}`);
        }
      };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
          <View style={styles.container}>
            <Text style={styles.label}>MAC address:</Text>
            <TextInput
              value={mac}
              onChangeText={setMac}
              placeholder="XX:XX:XX:XX:XX:XX"
              style={styles.input}
            />
            <Button title="Test BLE" onPress={runTest} />
            <Text style={styles.result}>{result}</Text>
          </View>
        </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
