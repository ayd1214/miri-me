import { analyzeImage } from "@/src/api/taskApi";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function UploadScreen() {
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const imageUri = selectedImage?.uri ?? null;

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("권한 필요", "이미지를 선택하려면 사진 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const analyzeSelectedImage = async () => {
    if (!selectedImage) {
      return;
    }

    try {
      setIsAnalyzing(true);
      const analysisResult = await analyzeImage({
        uri: selectedImage.uri,
        fileName: selectedImage.fileName,
        mimeType: selectedImage.mimeType,
      });

      router.push({
        pathname: "/review",
        params: {
          analysisResult: JSON.stringify(analysisResult),
        },
      });
    } catch (error) {
      console.error(error);
      Alert.alert(
        "분석 실패",
        "이미지를 분석하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>공지 캡처 업로드</Text>
      <Text style={styles.subtitle}>
        과제 공지, 카카오톡 공지, LMS 화면을 캡처해서 등록해보세요.
      </Text>

      <View style={styles.uploadBox}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <>
            <Text style={styles.uploadIcon}>📷</Text>
            <Text style={styles.uploadTitle}>이미지를 선택해주세요</Text>
            <Text style={styles.uploadText}>
              AI가 마감일, 제출 방식, 중요 키워드를 자동으로 추출합니다.
            </Text>
          </>
        )}

        <TouchableOpacity style={styles.selectButton} onPress={pickImage}>
          <Text style={styles.selectButtonText}>
            {imageUri ? "다른 이미지 선택하기" : "이미지 선택하기"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.analyzeButton,
          imageUri && !isAnalyzing
            ? styles.activeAnalyzeButton
            : styles.disabledAnalyzeButton,
        ]}
        disabled={!imageUri || isAnalyzing}
        onPress={analyzeSelectedImage}
      >
        {isAnalyzing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.analyzeButtonText}>AI로 분석하기</Text>
        )}
      </TouchableOpacity>
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
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#222",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
  },
  uploadBox: {
    marginTop: 32,
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  uploadIcon: {
    fontSize: 42,
    marginBottom: 14,
  },
  uploadTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#222",
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#777",
    textAlign: "center",
  },
  previewImage: {
    width: "100%",
    height: 360,
    borderRadius: 18,
    resizeMode: "cover",
    marginBottom: 18,
  },
  selectButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: "#222",
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  analyzeButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  disabledAnalyzeButton: {
    backgroundColor: "#CFCFCF",
  },
  activeAnalyzeButton: {
    backgroundColor: "#222",
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
