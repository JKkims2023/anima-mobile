#!/bin/bash

# react-native-iap v12.10.7 Kotlin compatibility patch
# Fixes: ObjectAlreadyConsumedException internal access error in RN 0.79.2

PATCH_FILE="node_modules/react-native-iap/android/src/main/java/com/dooboolab/rniap/PromiseUtlis.kt"

if [ ! -f "$PATCH_FILE" ]; then
  echo "❌ react-native-iap not found. Please run yarn install first."
  exit 1
fi

echo "🔧 Applying react-native-iap patch..."

# Backup original file
cp "$PATCH_FILE" "$PATCH_FILE.backup"

# Apply patch using sed
sed -i.tmp '
  # Remove ObjectAlreadyConsumedException import
  /import com.facebook.react.bridge.ObjectAlreadyConsumedException/d
  
  # Replace ObjectAlreadyConsumedException with Exception
  s/catch (oce: ObjectAlreadyConsumedException)/catch (e: Exception)/g
  s/\${oce.message}/\${e.message}/g
  
  # Fix reject call with null code
  s/this\.reject(code, message, throwable)/this.reject(code ?: "ERROR", message, throwable)/g
' "$PATCH_FILE"

# Remove temporary file
rm -f "$PATCH_FILE.tmp"

echo "✅ Patch applied successfully!"
