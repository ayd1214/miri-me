import { getTasks, updateTaskStatus } from "@/src/api/taskApi";
import { useAuth } from "@/src/context/AuthContext";
import { Task } from "@/src/types/task";
import {
  formatDueDateForDisplay,
  getDateKey,
  getDueDateKey,
  getMonthKey,
  getMonthTitle,
} from "@/src/utils/date";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type CalendarDay = {
  date: Date;
  key: string;
  isCurrentMonth: boolean;
};

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

const buildCalendarDays = (monthDate: Date): CalendarDay[] => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      key: getDateKey(date),
      isCurrentMonth: date.getMonth() === month,
    };
  });
};

const getPriorityColor = (priority?: Task["priority"]) => {
  if (priority === "high") return "#D9534F";
  if (priority === "medium") return "#D8A31A";
  return "#777777";
};

export default function CalendarScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState(getDateKey(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setIsLoading(true);
      const backendTasks = await getTasks();
      setTasks(backendTasks);
    } catch (error) {
      console.error(error);
      Alert.alert("불러오기 실패", "캘린더 과제를 불러오는 중 문제가 발생했습니다.");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const tasksByDate = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      const dateKey = getDueDateKey(task.dueDate);

      if (!dateKey) {
        return acc;
      }

      acc[dateKey] = [...(acc[dateKey] || []), task];
      return acc;
    }, {});
  }, [tasks]);

  const calendarDays = useMemo(() => {
    return buildCalendarDays(visibleMonth);
  }, [visibleMonth]);

  const selectedTasks = useMemo(() => {
    return [...(tasksByDate[selectedDateKey] || [])].sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate)
    );
  }, [selectedDateKey, tasksByDate]);

  const moveMonth = (offset: number) => {
    setVisibleMonth((currentMonth) => {
      const nextMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + offset,
        1
      );

      if (getMonthKey(nextMonth) !== getMonthKey(currentMonth)) {
        setSelectedDateKey(getDateKey(nextMonth));
      }

      return nextMonth;
    });
  };

  const toggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    const previousTasks = tasks;

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              status: nextStatus,
            }
          : currentTask
      )
    );

    try {
      await updateTaskStatus(task.id, nextStatus);
    } catch (error) {
      console.error(error);
      setTasks(previousTasks);
      Alert.alert("상태 변경 실패", "과제 상태를 저장하는 중 문제가 발생했습니다.");
    }
  };

  const selectedDateLabel = selectedDateKey.replace(/-/g, ".");
  const monthTaskCount = tasks.filter((task) => {
    const dateKey = getDueDateKey(task.dueDate);
    return dateKey?.startsWith(getMonthKey(visibleMonth));
  }).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>캘린더</Text>
          <Text style={styles.subtitle}>마감일 기준으로 과제를 한눈에 확인하세요.</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/upload")}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>＋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => moveMonth(-1)} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.monthTitleGroup}>
          <Text style={styles.monthTitle}>{getMonthTitle(visibleMonth)}</Text>
          <Text style={styles.monthSubtitle}>이번 달 과제 {monthTaskCount}개</Text>
        </View>
        <TouchableOpacity onPress={() => moveMonth(1)} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarPanel}>
        <View style={styles.weekRow}>
          {weekDays.map((day) => (
            <Text key={day} style={styles.weekDay}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.dayGrid}>
          {calendarDays.map((calendarDay) => {
            const dayTasks = tasksByDate[calendarDay.key] || [];
            const isSelected = calendarDay.key === selectedDateKey;
            const isToday = calendarDay.key === getDateKey(new Date());

            return (
              <TouchableOpacity
                activeOpacity={0.76}
                key={calendarDay.key}
                onPress={() => setSelectedDateKey(calendarDay.key)}
                style={[
                  styles.dayCell,
                  !calendarDay.isCurrentMonth && styles.outsideMonthDayCell,
                ]}
              >
                <View
                  style={[
                    styles.dayInner,
                    isSelected && styles.selectedDayInner,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !calendarDay.isCurrentMonth && styles.outsideMonthText,
                      isSelected && styles.selectedDayText,
                      isToday && !isSelected && styles.todayText,
                    ]}
                  >
                    {calendarDay.date.getDate()}
                  </Text>
                </View>

                <View style={styles.dotRow}>
                  {dayTasks.slice(0, 3).map((task) => (
                    <View
                      key={task.id}
                      style={[
                        styles.taskDot,
                        { backgroundColor: getPriorityColor(task.priority) },
                        task.status === "done" && styles.doneDot,
                      ]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{selectedDateLabel}</Text>
        <Text style={styles.listCount}>{selectedTasks.length}개</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#222222" />
        </View>
      ) : selectedTasks.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>이 날 마감인 과제가 없습니다</Text>
          <Text style={styles.emptyText}>
            다른 날짜를 선택하거나 새 공지 캡처를 등록해보세요.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.taskList}>
          {selectedTasks.map((task) => (
            <TouchableOpacity
              activeOpacity={0.82}
              key={task.id}
              onPress={() =>
                router.push({
                  pathname: "/task-detail",
                  params: { id: task.id },
                })
              }
              style={styles.taskItem}
            >
              <View
                style={[
                  styles.priorityBar,
                  { backgroundColor: getPriorityColor(task.priority) },
                  task.status === "done" && styles.donePriorityBar,
                ]}
              />
              <View style={styles.taskContent}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.taskTitle,
                    task.status === "done" && styles.doneTaskTitle,
                  ]}
                >
                  {task.title}
                </Text>
                <Text style={styles.taskMeta}>
                  {formatDueDateForDisplay(task.dueDate)}
                </Text>
                <Text numberOfLines={1} style={styles.taskMeta}>
                  제출: {task.submitType}
                </Text>
              </View>
              <TouchableOpacity
                onPress={(event) => {
                  event.stopPropagation();
                  toggleTaskStatus(task);
                }}
                style={[
                  styles.statusButton,
                  task.status === "done"
                    ? styles.doneStatusButton
                    : styles.todoStatusButton,
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
              </TouchableOpacity>
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
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#222222",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#666666",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222222",
  },
  addButtonText: {
    marginTop: -2,
    fontSize: 28,
    color: "#FFFFFF",
  },
  monthHeader: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  monthButtonText: {
    marginTop: -2,
    fontSize: 30,
    fontWeight: "700",
    color: "#333333",
  },
  monthTitleGroup: {
    alignItems: "center",
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#222222",
  },
  monthSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#888888",
  },
  calendarPanel: {
    marginTop: 18,
    paddingTop: 14,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E4E4E4",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
    color: "#777777",
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  outsideMonthDayCell: {
    opacity: 0.72,
  },
  dayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDayInner: {
    backgroundColor: "#222222",
  },
  dayText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#555555",
  },
  outsideMonthText: {
    color: "#BBBBBB",
  },
  selectedDayText: {
    color: "#FFFFFF",
  },
  todayText: {
    color: "#111111",
    textDecorationLine: "underline",
  },
  dotRow: {
    position: "absolute",
    bottom: 4,
    flexDirection: "row",
    gap: 3,
  },
  taskDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  doneDot: {
    opacity: 0.35,
  },
  listHeader: {
    marginTop: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222222",
  },
  listCount: {
    fontSize: 13,
    fontWeight: "800",
    color: "#777777",
  },
  loadingBox: {
    paddingVertical: 42,
    alignItems: "center",
  },
  emptyBox: {
    paddingVertical: 34,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E8E8E8",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333333",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#777777",
  },
  taskList: {
    marginBottom: 12,
  },
  taskItem: {
    minHeight: 76,
    marginBottom: 10,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  priorityBar: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 2,
    marginRight: 12,
  },
  donePriorityBar: {
    opacity: 0.35,
  },
  taskContent: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222222",
  },
  doneTaskTitle: {
    color: "#999999",
    textDecorationLine: "line-through",
  },
  taskMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#777777",
  },
  statusButton: {
    minWidth: 62,
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
  },
  todoStatusButton: {
    backgroundColor: "#FFF1F1",
  },
  doneStatusButton: {
    backgroundColor: "#F1F1F1",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  todoText: {
    color: "#D9534F",
  },
  doneText: {
    color: "#888888",
  },
});
