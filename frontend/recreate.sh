#!/bin/bash
# recreate_project.sh
# Usage: ./recreate_project.sh combined_files_two.txt [output_dir]

INPUT_FILE="${1:-combined_files_two.txt}"
OUTPUT_DIR="${2:-.}"

if [[ ! -f "$INPUT_FILE" ]]; then
  echo "❌ Error: Input file '$INPUT_FILE' not found"
  echo "Usage: $0 <combined_file> [output_directory]"
  exit 1
fi

echo "📁 Reconstructing project from '$INPUT_FILE' into '$OUTPUT_DIR'..."

# Clean output dir of any previous partial runs (optional safety)
# rm -rf "$OUTPUT_DIR"/*

mkdir -p "$OUTPUT_DIR"

CURRENT_FILE=""
LINE_NUM=0
TOTAL_FILES=0

while IFS= read -r line || [[ -n "$line" ]]; do
  ((LINE_NUM++))
  
  # Match marker format: "=== ./path ===" (handles spaces before/after)
  if [[ "$line" =~ ^===\ [^[:space:]]+.*[^[:space:]]+\ ===$ ]]; then
    # Close previous file if open
    if [[ -n "$CURRENT_FILE" ]]; then
      exec 3>&-
    fi
    
    # Extract path between "=== " and " ==="
    FILE_PATH="${line#=== }"
    FILE_PATH="${FILE_PATH% ===}"
    FILE_PATH="${FILE_PATH#./}"  # Remove leading ./
    
    # Skip if path is empty
    if [[ -z "$FILE_PATH" ]]; then
      continue
    fi
    
    # Create full path
    FULL_PATH="$OUTPUT_DIR/$FILE_PATH"
    mkdir -p "$(dirname "$FULL_PATH")"
    
    # Open file for writing
    exec 3>"$FULL_PATH"
    CURRENT_FILE="$FULL_PATH"
    ((TOTAL_FILES++))
    
    echo "✅ Created: $FILE_PATH"
    continue
  fi
  
  # Write content to current file
  if [[ -n "$CURRENT_FILE" ]]; then
    echo "$line" >&3
  fi
done < <(sed 's/\r$//' "$INPUT_FILE")  # Handle Windows line endings

# Close last file
if [[ -n "$CURRENT_FILE" ]]; then
  exec 3>&-
fi

echo ""
echo "✨ Done! Created $TOTAL_FILES files in '$OUTPUT_DIR'"
echo ""
echo "Next steps:"
echo "  cd $OUTPUT_DIR"
echo "  npm install"
echo "  npm run dev"
