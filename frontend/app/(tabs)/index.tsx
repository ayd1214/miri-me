import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>미리me</Text>
      <Text style={styles.subtitle}>캡처 한 장으로 끝내는 일정 관리</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>오늘의 할 일</Text>
        <Text style={styles.taskTitle}>운영체제 과제 1</Text>
        <Text style={styles.taskInfo}>마감: 5월 10일 23:59</Text>
        <Text style={styles.taskInfo}>제출: LMS 제출</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    backgroundColor: "#F7F7F7",
  },
  logo: {
    fontSize: 34,
    fontWeight: "800",
    color: "#222",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
  },
  card: {
    marginTop: 32,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },
  taskInfo: {
    marginTop: 6,
    fontSize: 14,
    color: "#555",
  },
});