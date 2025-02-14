#!/bin/zsh

# Ensure exactly two parameters are provided.
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <old_filename> <new_filename>"
  exit 1
fi

# Assign command-line arguments to variables.
old_filename="$1"
new_filename="$2"
folder="vtable_docs"

# Build full paths for the source and destination files.
old_path="${folder}/${old_filename}"
new_path="${folder}/${new_filename}"

# Check if the source file exists in the vtable_docs folder.
if [ ! -f "$old_path" ]; then
  echo "Error: File '$old_path' does not exist."
  exit 1
fi

# Rename the file.
if mv "$old_path" "$new_path"; then
  echo "Renamed '$old_path' to '$new_path' successfully."
else
  echo "Error renaming file."
  exit 1
fi
