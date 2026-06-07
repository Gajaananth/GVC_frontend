// src/utils/faceDetection.ts
// Face detection validation using face-api.js or similar

export interface FaceDetectionResult {
  face_detected: boolean;
  face_count: number;
  face_quality_score: number; // 0 to 1
  is_valid: boolean;
  validation_notes: string;
  is_clear: boolean;
  is_cropped: boolean;
  is_bright: boolean;
  is_dark: boolean;
  is_hidden: boolean;
}

// Placeholder function - would use face-api.js in production
export async function validateFacePhoto(imageFile: File): Promise<FaceDetectionResult> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const img = new Image();
          img.onload = () => {
            // Basic image validation
            const width = img.width;
            const height = img.height;
            const aspectRatio = width / height;

            // Check if image is too cropped (very elongated)
            const is_cropped = aspectRatio < 0.5 || aspectRatio > 2;

            // Placeholder: would use face-api.js to detect faces
            // For now, we'll return a mock result that needs server-side validation
            const result: FaceDetectionResult = {
              face_detected: true, // This should be detected by face-api.js
              face_count: 1,
              face_quality_score: 0.85,
              is_valid: !is_cropped,
              validation_notes: is_cropped ? 'Image appears cropped' : 'Image validation passed (client-side)',
              is_clear: true,
              is_cropped,
              is_bright: false,
              is_dark: false,
              is_hidden: false,
            };

            resolve(result);
          };
          img.src = e.target?.result as string;
        } catch (error) {
          reject(new Error('Failed to load image'));
        }
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      reject(new Error('Failed to read file'));
    }
  });
}

export function isValidFacePhoto(result: FaceDetectionResult): boolean {
  return (
    result.face_detected &&
    result.face_count === 1 &&
    result.face_quality_score >= 0.6 &&
    !result.is_cropped &&
    !result.is_dark &&
    !result.is_bright &&
    !result.is_hidden
  );
}

export function getFaceValidationErrorMessage(result: FaceDetectionResult): string {
  if (!result.face_detected) {
    return 'No face detected in the image. Please upload a clear customer face photo.';
  }
  if (result.face_count > 1) {
    return 'Multiple faces detected. Please upload a photo with only one face.';
  }
  if (result.face_count === 0) {
    return 'No face detected. Please upload a clear customer face photo.';
  }
  if (result.is_cropped) {
    return 'The face appears cropped or cut off. Please upload a clearer image.';
  }
  if (result.is_dark) {
    return 'The image is too dark. Please upload a clearer, well-lit photo.';
  }
  if (result.is_bright) {
    return 'The image is too bright or washed out. Please upload a clearer photo.';
  }
  if (result.is_hidden) {
    return 'The face is partially hidden. Please upload a photo where the entire face is visible.';
  }
  if (result.face_quality_score < 0.6) {
    return 'Image quality is too low. Please upload a clear customer face photo.';
  }
  return 'Please upload a clear customer face photo.';
}
