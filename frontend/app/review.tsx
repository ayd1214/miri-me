import { createTask, updateTask } from "@/src/api/taskApi";
import {
  AnalyzeTaskResult,
  CreateTaskInput,
  Task,
  TaskPriority,
} from "@/src/types/task";
import { formatDueDateForDisplay } from "@/src/utils/date";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const defaultReviewValues: AnalyzeTaskResult = {
  title: "운영체제 과제 1",
  dueDate: "2026-05-10 23:59",
  submitType: "LMS 제출",
  keywords: ["필수 제출", "PDF", "지각 감점"],
  summary: "운영체제 과제 1을 PDF 형식으로 LMS에 제출해야 합니다.",
  priority: "high",
};

const emptyReviewValues: AnalyzeTaskResult = {
  title: "",
  dueDate: "",
  submitType: "",
  keywords: [],
  summary: "",
  priority: "medium",
};

const normalizeDueDateInput = (value: string): string | null => {
  const trimmed = value.trim();
  const match = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (!match) {
    return null;
  }

  const [, datePart, hourText, minuteText, secondText = "00"] = match;
  const [year, month, day] = datePart.split("-").map(Number);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const date = new Date(year, month - 1, day, hour, minute, second);

  const isValidDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute &&
    date.getSeconds() === second;

  if (!isValidDate) {
    return null;
  }

  return `${datePart}T${hourText}:${minuteText}:${secondText}`;
};

const parseAnalysisResult = (
  rawResult: string | string[] | undefined
): AnalyzeTaskResult | null => {
  const value = Array.isArray(rawResult) ? rawResult[0] : rawResult;

  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<AnalyzeTaskResult>;

    return {
      title: parsed.title || defaultReviewValues.title,
      dueDate: parsed.dueDate
        ? formatDueDateForDisplay(parsed.dueDate)
        : defaultReviewValues.dueDate,
      submitType: parsed.submitType || defaultReviewValues.submitType,
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords
        : defaultReviewValues.keywords,
      summary: parsed.summary || defaultReviewValues.summary,
      priority:
        parsed.priority === "high" ||
        parsed.priority === "medium" ||
        parsed.priority === "low"
          ? parsed.priority
          : defaultReviewValues.priority,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

const parseTask = (rawTask: string | string[] | undefined): Task | null => {
  const value = Array.isArray(rawTask) ? rawTask[0] : rawTask;

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Task;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default function ReviewScreen() {
  const { analysisResult, mode, task, taskId } = useLocalSearchParams<{
    analysisResult?: string;
    mode?: string;
    task?: string;
    taskId?: string;
  }>();
  const isManualMode = mode === "manual";
  const isEditMode = mode === "edit";
  const editingTask = useMemo(() => parseTask(task), [task]);
  const initialValues = useMemo(
    () => {
      if (isEditMode && editingTask) {
        return {
          title: editingTask.title,
          dueDate: formatDueDateForDisplay(editingTask.dueDate),
          submitType: editingTask.submitType,
          keywords: editingTask.keywords,
          summary: editingTask.summary || "",
          priority: editingTask.priority || "medium",
        };
      }

      return isManualMode
        ? emptyReviewValues
        : parseAnalysisResult(analysisResult) || defaultReviewValues;
    },
    [analysisResult, editingTask, isEditMode, isManualMode]
  );

  const [title, setTitle] = useState(initialValues.title);
  const [dueDate, setDueDate] = useState(initialValues.dueDate);
  const [submitType, setSubmitType] = useState(initialValues.submitType);
  const [keywords, setKeywords] = useState(initialValues.keywords.join(", "));
  const [summary, setSummary] = useState(initialValues.summary || "");
  const [priority, setPriority] = useState<TaskPriority>(
    initialValues.priority || "high"
  );

  const saveTask = async () => {
    if (!title.trim()) {
      Alert.alert("과제명을 입력해주세요.");
      return;
    }

    const normalizedDueDate = normalizeDueDateInput(dueDate);

    if (!normalizedDueDate) {
      Alert.alert(
        "마감일을 확인해주세요.",
        "마감일은 2026-05-10 23:59 형식으로 입력해주세요."
      );
      return;
    }

    const newTask: CreateTaskInput = {
      title: title.trim(),
      dueDate: normalizedDueDate,
      submitType: submitType.trim(),
      keywords: keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0),
      summary: summary.trim(),
      priority,
      status: "todo",
    };

    try {
      if (isEditMode && taskId) {
        await updateTask(taskId, newTask);

        Alert.alert("수정 완료", "과제 정보가 수정되었습니다.", [
          {
            text: "확인",
            onPress: () =>
              router.replace({
                pathname: "/task-detail",
                params: { id: taskId },
              }),
          },
        ]);
        return;
      }

      await createTask(newTask);

      Alert.alert("저장 완료", "To-do에 과제가 추가되었습니다.", [
        {
          text: "확인",
          onPress: () => router.replace("/"),
        },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("저장 실패", "과제를 저장하는 중 문제가 발생했습니다.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.title}>
        {isEditMode
          ? "과제 수정"
          : isManualMode
          ? "과제 직접 등록"
          : "AI 분석 결과 확인"}
      </Text>
      <Text style={styles.subtitle}>
        {isEditMode
          ? "변경할 내용을 수정한 뒤 저장하세요."
          : isManualMode
          ? "과제 정보를 직접 입력해서 To-do에 추가하세요."
          : "AI가 추출한 내용을 확인하고, 틀린 부분이 있으면 직접 수정해주세요."}
      </Text>

      <Text style={styles.label}>과제명</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="과제명을 입력하세요"
        placeholderTextColor="#8A8A8A"
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>마감일</Text>
      <TextInput
        style={styles.input}
        value={dueDate}
        onChangeText={setDueDate}
        placeholder="예: 2026-05-10 23:59"
        placeholderTextColor="#8A8A8A"
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>제출 방식</Text>
      <TextInput
        style={styles.input}
        value={submitType}
        onChangeText={setSubmitType}
        placeholder="예: LMS 제출"
        placeholderTextColor="#8A8A8A"
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>중요 키워드</Text>
      <TextInput
        style={styles.input}
        value={keywords}
        onChangeText={setKeywords}
        placeholder="예: 필수 제출, PDF, 지각 감점"
        placeholderTextColor="#8A8A8A"
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>요약</Text>
      <TextInput
        style={[styles.input, styles.summaryInput]}
        value={summary}
        onChangeText={setSummary}
        placeholder="공지 내용을 간단히 요약하세요"
        placeholderTextColor="#8A8A8A"
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>우선순위</Text>
      <View style={styles.priorityRow}>
        <TouchableOpacity
          style={[
            styles.priorityButton,
            priority === "high" && styles.selectedPriorityButton,
          ]}
          onPress={() => setPriority("high")}
        >
          <Text
            style={[
              styles.priorityButtonText,
              priority === "high" && styles.selectedPriorityButtonText,
            ]}
          >
            높음
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.priorityButton,
            priority === "medium" && styles.selectedPriorityButton,
          ]}
          onPress={() => setPriority("medium")}
        >
          <Text
            style={[
              styles.priorityButtonText,
              priority === "medium" && styles.selectedPriorityButtonText,
            ]}
          >
            보통
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.priorityButton,
            priority === "low" && styles.selectedPriorityButton,
          ]}
          onPress={() => setPriority("low")}
        >
          <Text
            style={[
              styles.priorityButtonText,
              priority === "low" && styles.selectedPriorityButtonText,
            ]}
          >
            낮음
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveTask}>
        <Text style={styles.saveButtonText}>
          {isEditMode ? "수정 저장하기" : "To-do로 저장하기"}
        </Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  contentContainer: {
    padding: 24,
    paddingTop: 72,
    paddingBottom: 140,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#222",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
  },
  label: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "800",
    color: "#444",
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    lineHeight: 21,
    color: "#222",
  },
  summaryInput: {
    height: 110,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedPriorityButton: {
    backgroundColor: "#222",
    borderColor: "#222",
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#555",
  },
  selectedPriorityButtonText: {
    color: "#FFFFFF",
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "#222",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
