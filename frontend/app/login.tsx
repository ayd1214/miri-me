import { useAuth } from "@/src/context/AuthContext";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type AuthMode = "login" | "signup";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes("auth/invalid-credential")) {
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    }

    if (error.message.includes("auth/email-already-in-use")) {
      return "이미 가입된 이메일입니다.";
    }

    if (error.message.includes("auth/weak-password")) {
      return "비밀번호는 6자 이상이어야 합니다.";
    }

    if (error.message.includes("native OAuth setup")) {
      return "앱에서 구글 로그인을 쓰려면 Firebase OAuth 설정과 네이티브 리다이렉트 설정이 추가로 필요합니다.";
    }
  }

  return "인증 처리 중 문제가 발생했습니다.";
};

export default function LoginScreen() {
  const { login, loginWithGoogle, signup } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      Alert.alert("입력 필요", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await login(cleanEmail, password);
      } else {
        await signup(cleanEmail, password);
      }
    } catch (error) {
      Alert.alert(mode === "login" ? "로그인 실패" : "회원가입 실패", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const submitGoogle = async () => {
    setLoading(true);

    try {
      await loginWithGoogle();
    } catch (error) {
      Alert.alert("구글 로그인 실패", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>미리me</Text>
        <Text style={styles.subtitle}>로그인하면 내 과제만 안전하게 불러옵니다.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeButton, mode === "login" && styles.selectedModeButton]}
            onPress={() => setMode("login")}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === "login" && styles.selectedModeButtonText,
              ]}
            >
              로그인
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === "signup" && styles.selectedModeButton]}
            onPress={() => setMode("signup")}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === "signup" && styles.selectedModeButtonText,
              ]}
            >
              회원가입
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>이메일</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@example.com"
          style={styles.input}
          value={email}
        />

        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={setPassword}
          placeholder="6자 이상"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        <TouchableOpacity
          disabled={loading}
          onPress={submit}
          style={[styles.primaryButton, loading && styles.disabledButton]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === "login" ? "로그인하기" : "회원가입하기"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          disabled={loading}
          onPress={submitGoogle}
          style={styles.googleButton}
        >
          <Text style={styles.googleButtonText}>Google로 계속하기</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F7F7F7",
  },
  header: {
    marginBottom: 28,
  },
  logo: {
    fontSize: 36,
    fontWeight: "800",
    color: "#222",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
  },
  form: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#F1F1F1",
  },
  selectedModeButton: {
    backgroundColor: "#222",
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#555",
  },
  selectedModeButtonText: {
    color: "#FFFFFF",
  },
  label: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "800",
    color: "#444",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#F7F7F7",
    fontSize: 15,
    color: "#222",
  },
  primaryButton: {
    marginTop: 22,
    minHeight: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222",
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  googleButton: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#333",
  },
});
