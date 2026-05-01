import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Task = {
  id: string;
  title: string;
  dueDate: string;
  submitType: string;
  keywords: string[];
  summary?: string;
  status: "todo" | "done";
};

const dummyTasks: Task[] = [
  {
    id: "dummy-1",
    title: "운영체제 과제 1",
    dueDate: "5월 10일 23:59",
    submitType: "LMS 제출",
    keywords: ["필수 제출", "PDF", "지각 감점"],
    status: "todo",
  },
  {
    id: "dummy-2",
    title: "NEXT 기획서 수정",
    dueDate: "5월 12일 18:00",
    submitType: "GitHub / 발표자료",
    keywords: ["MVP", "기능 정리"],
    status: "todo",
  },
  {
    id: "dummy-3",
    title: "컴퓨터네트워크 퀴즈 준비",
    dueDate: "5월 15일 09:00",
    submitType: "수업 전 확인",
    keywords: ["TCP", "UDP", "HTTP"],
    status: "done",
  },
];

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>(dummyTasks);

  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem("tasks");

      if (savedTasks) {
        const parsedTasks: Task[] = JSON.parse(savedTasks);

        if (parsedTasks.length > 0) {
          setTasks(parsedTasks);
          return;
        }
      }

      setTasks(dummyTasks);
    } catch (error) {
      console.error(error);
      setTasks(dummyTasks);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const todoCount = tasks.filter((task) => task.status === "todo").length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>미리me</Text>
          <Text style={styles.subtitle}>캡처 한 장으로 끝내는 일정 관리</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/upload")}
        >
          <Text style={styles.addButtonText}>＋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>오늘 확인할 일</Text>
        <Text style={styles.summaryNumber}>{todoCount}개</Text>
        <Text style={styles.summaryText}>
          마감이 가까운 과제를 먼저 확인해보세요.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>다가오는 과제</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {tasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskTopRow}>
              <Text style={styles.taskTitle}>{task.title}</Text>

              <View
                style={[
                  styles.statusBadge,
                  task.status === "done" ? styles.doneBadge : styles.todoBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    task.status === "done" ? styles.doneText : styles.todoText,
                  ]}
                >
                  {task.status === "done" ? "완료" : "미완료"}
                </Text>
              </View>
            </View>

            <Text style={styles.taskInfo}>마감: {task.dueDate}</Text>
            <Text style={styles.taskInfo}>제출: {task.submitType}</Text>

            <View style={styles.keywordRow}>
              {task.keywords.map((keyword) => (
                <View key={keyword} style={styles.keywordBadge}>
                  <Text style={styles.keywordText}>#{keyword}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 72,
    backgroundColor: "#F7F7F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontSize: 34,
    fontWeight: "800",
    color: "#222",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#666",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 28,
    color: "#FFFFFF",
    marginTop: -2,
  },
  summaryCard: {
    marginTop: 28,
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#444",
  },
  summaryNumber: {
    marginTop: 8,
    fontSize: 34,
    fontWeight: "800",
    color: "#222",
  },
  summaryText: {
    marginTop: 6,
    fontSize: 14,
    color: "#777",
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 14,
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
  },
  taskCard: {
    marginBottom: 14,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  taskTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#222",
  },
  taskInfo: {
    marginTop: 8,
    fontSize: 14,
    color: "#555",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  todoBadge: {
    backgroundColor: "#FFF0D6",
  },
  doneBadge: {
    backgroundColor: "#E7F6E7",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  todoText: {
    color: "#A76400",
  },
  doneText: {
    color: "#2E7D32",
  },
  keywordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  keywordBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F0F0F0",
  },
  keywordText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },
});