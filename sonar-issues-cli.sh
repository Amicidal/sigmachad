#!/bin/bash

# SonarQube Issues CLI Viewer
# Usage: ./sonar-issues-cli.sh [project_key] [severity] [status]

set -e

# Configuration - adjust these for your setup
SONAR_HOST="http://localhost:9000"
SONAR_TOKEN="squ_5bccbc30d7bdc8eda20bf09b93b6cad47884280c"
PROJECT_KEY="${1:-sigmachad}"
SEVERITY="${2:-all}"  # all, BLOCKER, CRITICAL, MAJOR, MINOR, INFO
STATUS="${3:-all}"    # all, OPEN, CONFIRMED, REOPENED, RESOLVED, CLOSED

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Build API URL
API_URL="$SONAR_HOST/api/issues/search"
PARAMS="componentKeys=$PROJECT_KEY&ps=500"  # ps = page size

if [ "$SEVERITY" != "all" ]; then
    PARAMS="$PARAMS&severities=$SEVERITY"
fi

if [ "$STATUS" != "all" ]; then
    PARAMS="$PARAMS&statuses=$STATUS"
fi

FULL_URL="$API_URL?$PARAMS"

echo -e "${BLUE}Fetching SonarQube issues for project: $PROJECT_KEY${NC}"
echo -e "${BLUE}Severity filter: $SEVERITY${NC}"
echo -e "${BLUE}Status filter: $STATUS${NC}"
echo -e "${BLUE}URL: $FULL_URL${NC}"
echo

# Make API call
RESPONSE=$(curl -s -u "$SONAR_TOKEN:" "$FULL_URL")

# Check if response is valid JSON
if ! echo "$RESPONSE" | jq empty 2>/dev/null; then
    echo -e "${RED}Error: Invalid response from SonarQube API${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi

# Extract total count
TOTAL=$(echo "$RESPONSE" | jq -r '.total // 0')

if [ "$TOTAL" -eq 0 ]; then
    echo -e "${GREEN}No issues found matching the criteria.${NC}"
    exit 0
fi

echo -e "${YELLOW}Found $TOTAL issues:${NC}"
echo "========================================"

# Process each issue
echo "$RESPONSE" | jq -r '.issues[] | "\(.severity)|\(.status)|\(.component)|\(.line // "N/A")|\(.message)"' | while IFS='|' read -r severity status component line message; do
    # Color code severity
    case $severity in
        "BLOCKER")
            severity_color=$RED
            ;;
        "CRITICAL")
            severity_color=$RED
            ;;
        "MAJOR")
            severity_color=$YELLOW
            ;;
        "MINOR")
            severity_color=$BLUE
            ;;
        "INFO")
            severity_color=$GREEN
            ;;
        *)
            severity_color=$NC
            ;;
    esac

    # Color code status
    case $status in
        "OPEN")
            status_color=$RED
            ;;
        "CONFIRMED")
            status_color=$YELLOW
            ;;
        "REOPENED")
            status_color=$RED
            ;;
        "RESOLVED")
            status_color=$GREEN
            ;;
        "CLOSED")
            status_color=$GREEN
            ;;
        *)
            status_color=$NC
            ;;
    esac

    echo -e "${severity_color}[$severity]${NC} ${status_color}[$status]${NC} $component:$line"
    echo -e "  $message"
    echo
done

echo "========================================"
echo -e "${YELLOW}Total issues: $TOTAL${NC}"
