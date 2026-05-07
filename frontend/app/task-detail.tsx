import { getTask } from "@/src/api/taskApi";
import { Task } from "@/src/types/task";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    const loadTask = async () => {
      if (!id) return;

      try {
        const backendTask = await getTask(id);
        setTask(backendTask);
      } catch (error) {
        console.error(error);
        setTask(null);
      }
    };

    loadTask();
  }, [id]);

    

  const getPriorityText = (priority?: "high" | "medium" | "low") => {
    if (priority === "high") return "높음";
    if (priority === "medium") return "보통";
    if (priority === "low") return "낮음";
    return "없음";
  };

  if (!task) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>과제를 찾을 수 없습니다</Text>
        <Text style={styles.subtitle}>
          삭제되었거나 저장되지 않은 과제일 수 있습니다.
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.backButtonText}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{task.title}</Text>
      <Text style={styles.subtitle}>AI가 정리한 과제 정보를 확인해보세요.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>마감일</Text>
        <Text style={styles.mainInfo}>{task.dueDate}</Text>

        <Text style={styles.sectionLabel}>제출 방식</Text>
        <Text style={styles.infoText}>{task.submitType}</Text>

        <Text style={styles.sectionLabel}>우선순위</Text>
        <Text style={styles.infoText}>{getPriorityText(task.priority)}</Text>

        <Text style={styles.sectionLabel}>상태</Text>
        <Text style={styles.infoText}>
          {task.status === "done" ? "완료" : "미완료"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>중요 키워드</Text>
        <View style={styles.keywordRow}>
          {task.keywords.map((keyword) => (
            <View key={keyword} style={styles.keywordBadge}>
              <Text style={styles.keywordText}>#{keyword}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>요약</Text>
        <Text style={styles.summaryText}>
          {task.summary || "요약 내용이 없습니다."}
        </Text>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>홈으로 돌아가기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 72,
    backgroundColor: "#F7F7F7",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#222",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
  },
  card: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },
  sectionLabel: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "800",
    color: "#555",
  },
  mainInfo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#222",
  },
  infoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  keywordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  keywordBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F0F0F0",
  },
  keywordText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 23,
    color: "#444",
  },
  backButton: {
    marginTop: 8,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "#222",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});