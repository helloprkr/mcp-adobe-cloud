#!/bin/bash

# Session Management Utility for DotAI Boiler
# Helps manage AI coding sessions

SESSION_DIR=".ai/session"
TEMPLATE_PATH="$SESSION_DIR/template.md"

# Function to display help
show_help() {
  echo "Session Management Utility for DotAI Boiler"
  echo ""
  echo "Usage:"
  echo "  ./session.sh create <session-name> [description]  Create a new session"
  echo "  ./session.sh list                               List all active sessions"
  echo "  ./session.sh open <session-name>                Open a session in your editor"
  echo "  ./session.sh archive <session-name>             Archive a completed session"
  echo "  ./session.sh help                               Display this help message"
  echo ""
  echo "Examples:"
  echo "  ./session.sh create auth-feature \"Implementing user authentication\""
  echo "  ./session.sh open auth-feature"
}

# Function to create a new session
create_session() {
  local name=$1
  local description=$2
  local filename="$SESSION_DIR/$name.md"
  
  if [ -f "$filename" ]; then
    echo "Error: Session '$name' already exists."
    exit 1
  fi
  
  if [ ! -f "$TEMPLATE_PATH" ]; then
    echo "Error: Template file not found at $TEMPLATE_PATH"
    exit 1
  fi
  
  # Create session directory if it doesn't exist
  mkdir -p "$SESSION_DIR"
  
  # Copy template and replace placeholders
  cp "$TEMPLATE_PATH" "$filename"
  
  # Replace placeholders with real values
  sed -i.bak "s/\[Task Name\]/$name/" "$filename"
  if [ -n "$description" ]; then
    sed -i.bak "s/\[Brief description of what you're trying to accomplish in this session\]/$description/" "$filename"
  fi
  
  # Remove backup file created by sed
  rm -f "$filename.bak"
  
  echo "Session '$name' created at $filename"
  echo "Open it with: ./session.sh open $name"
}

# Function to list all active sessions
list_sessions() {
  echo "Active Sessions:"
  echo "----------------"
  
  if [ ! -d "$SESSION_DIR" ] || [ -z "$(ls -A $SESSION_DIR/*.md 2>/dev/null)" ]; then
    echo "No active sessions found."
    return
  fi
  
  for file in $SESSION_DIR/*.md; do
    if [ "$file" != "$TEMPLATE_PATH" ]; then
      session_name=$(basename "$file" .md)
      
      # Extract the first line to get the title
      title=$(head -n 1 "$file" | sed 's/# Session: //')
      
      # Extract the goal if it exists
      goal=$(grep -A 1 "## Goal" "$file" | tail -n 1)
      
      echo "- $session_name: $title"
      if [ "$goal" != "## Goal" ] && [ -n "$goal" ]; then
        echo "  $goal"
      fi
      echo ""
    fi
  done
}

# Function to open a session in the default editor
open_session() {
  local name=$1
  local filename="$SESSION_DIR/$name.md"
  
  if [ ! -f "$filename" ]; then
    echo "Error: Session '$name' not found."
    exit 1
  fi
  
  # Try to detect the editor
  if [ -n "$EDITOR" ]; then
    $EDITOR "$filename"
  elif command -v code >/dev/null 2>&1; then
    code "$filename"
  elif command -v vim >/dev/null 2>&1; then
    vim "$filename"
  elif command -v nano >/dev/null 2>&1; then
    nano "$filename"
  else
    echo "No editor found. Please open manually: $filename"
  fi
}

# Function to archive a session
archive_session() {
  local name=$1
  local filename="$SESSION_DIR/$name.md"
  local archive_dir="$SESSION_DIR/archive"
  
  if [ ! -f "$filename" ]; then
    echo "Error: Session '$name' not found."
    exit 1
  fi
  
  # Create archive directory if it doesn't exist
  mkdir -p "$archive_dir"
  
  # Move file to archive with timestamp
  local timestamp=$(date +"%Y%m%d%H%M%S")
  mv "$filename" "$archive_dir/${name}_${timestamp}.md"
  
  echo "Session '$name' archived."
}

# Main command processing
case "$1" in
  create)
    if [ -z "$2" ]; then
      echo "Error: Session name is required."
      echo "Usage: ./session.sh create <session-name> [description]"
      exit 1
    fi
    create_session "$2" "$3"
    ;;
  list)
    list_sessions
    ;;
  open)
    if [ -z "$2" ]; then
      echo "Error: Session name is required."
      echo "Usage: ./session.sh open <session-name>"
      exit 1
    fi
    open_session "$2"
    ;;
  archive)
    if [ -z "$2" ]; then
      echo "Error: Session name is required."
      echo "Usage: ./session.sh archive <session-name>"
      exit 1
    fi
    archive_session "$2"
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo "Unknown command: $1"
    show_help
    exit 1
    ;;
esac