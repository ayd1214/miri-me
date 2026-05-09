import { deleteTask as deleteTaskApi, getTasks, updateTaskStatus } from "@/src/api/taskApi";
import { useAuth } from "@/src/context/AuthContext";
import { Task } from "@/src/types/task";
import { formatDueDateForDisplay } from "@/src/utils/date";

import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const { logout, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadTasks = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const backendTasks = await getTasks();
      setTasks(backendTasks);
    } catch (error) {
      console.error(error);
      Alert.alert("불러오기 실패", "과제 목록을 불러오는 중 문제가 발생했습니다.");
      setTasks([]);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const toggleTaskStatus = async (taskId: string) => {
    const targetTask = tasks.find((task) => task.id === taskId);

    if (!targetTask) return;

    const nextStatus = targetTask.status === "done" ? "todo" : "done";

    const updatedTasks: Task[] = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: nextStatus,
          }
        : task
    );

    setTasks(updatedTasks);

    try {
      await updateTaskStatus(taskId, nextStatus);
    } catch (error) {
      console.error(error);
      Alert.alert("상태 변경 실패", "과제 상태를 저장하는 중 문제가 발생했습니다.");
      loadTasks();
    }
  };

  const deleteTask = (taskId: string) => {
    Alert.alert("과제 삭제", "이 과제를 삭제할까요?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          const updatedTasks = tasks.filter((task) => task.id !== taskId);
          setTasks(updatedTasks);

          try {
            await deleteTaskApi(taskId);
          } catch (error) {
            console.error(error);
            Alert.alert("삭제 실패", "과제를 삭제하는 중 문제가 발생했습니다.");
            loadTasks();
          }
        },
      },
    ]);
  };

  const todoCount = tasks.filter((task) => task.status === "todo").length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>미리me</Text>
          <Text style={styles.subtitle}>캡처 한 장으로 끝내는 일정 관리</Text>
          <Text style={styles.userText}>{user?.email}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>로그아웃</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/upload")}
          >
            <Text style={styles.addButtonText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>오늘 확인할 일</Text>
        <Text style={styles.summaryNumber}>{todoCount}개</Text>
        <Text style={styles.summaryText}>
          마감이 가까운 과제를 먼저 확인해보세요.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>다가오는 과제</Text>

      {tasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📌</Text>
          <Text style={styles.emptyTitle}>아직 등록된 과제가 없습니다</Text>
          <Text style={styles.emptyText}>
            오른쪽 위 + 버튼을 눌러 공지 캡처를 추가해보세요.
          </Text>

          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push("/upload")}
          >
            <Text style={styles.emptyButtonText}>첫 과제 등록하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/task-detail",
                  params: { id: task.id },
                })
              }
            >
              <View style={styles.taskTopRow}>
                <Text
                  style={[
                    styles.taskTitle,
                    task.status === "done" && styles.doneTaskTitle,
                  ]}
                >
                  {task.title}
                </Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[
                      styles.checkButton,
                      task.status === "done" && styles.checkedButton,
                    ]}
                    onPress={(event) => {
                      event.stopPropagation();
                      toggleTaskStatus(task.id);
                    }}
                  >
                    {task.status === "done" && (
                      <Text style={styles.checkButtonText}>✓</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      deleteTask(task.id);
                    }}
                  >
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.taskInfo}>
                마감: {formatDueDateForDisplay(task.dueDate)}
              </Text>
              <Text style={styles.taskInfo}>제출: {task.submitType}</Text>

              {task.priority && (
                <Text style={styles.taskInfo}>
                  우선순위:{" "}
                  {task.priority === "high"
                    ? "높음"
                    : task.priority === "medium"
                    ? "보통"
                    : "낮음"}
                </Text>
              )}

              <View style={styles.keywordRow}>
                {task.keywords.map((keyword) => (
                  <View key={keyword} style={styles.keywordBadge}>
                    <Text style={styles.keywordText}>#{keyword}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  userText: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#555",
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


  emptyCard: {
    marginTop: 12,
    padding: 28,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#777",
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 22,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: "#222",
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
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
  doneTaskTitle: {
    color: "#999",
    textDecorationLine: "line-through",
  },
  taskInfo: {
    marginTop: 8,
    fontSize: 14,
    color: "#555",
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#F2F2F2",
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#777",
  },
  checkButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#D8D8D8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkedButton: {
    borderColor: "#222222",
    backgroundColor: "#222222",
  },
  checkButtonText: {
    marginTop: -1,
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
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
