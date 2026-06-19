#!/bin/bash
# Full Auto Builder/Installer for X-DEV Projects
# Handles both X-DEV-LM-Studio and X-DEV-Obsidian

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LM_STUDIO_PATH="$PROJECT_ROOT/X-DEV-LM-Studio"
OBSIDIAN_PATH="$PROJECT_ROOT/X-DEV-Obsidian"

# Color codes
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

write_header() {
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}\n"
}

write_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

write_error() {
    echo -e "${RED}✗ $1${NC}"
}

install_project() {
    local name=$1
    local path=$2
    
    write_header "Installing $name"
    
    if [ ! -d "$path" ]; then
        write_error "$name directory not found at $path"
        return 1
    fi
    
    cd "$path"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install
        if [ $? -ne 0 ]; then
            write_error "Failed to install dependencies for $name"
            return 1
        fi
    else
        write_success "Dependencies already installed"
    fi
    
    write_success "$name dependencies ready"
    return 0
}

build_project() {
    local name=$1
    local path=$2
    
    echo -e "${YELLOW}Building $name...${NC}"
    
    cd "$path"
    npm run build
    if [ $? -ne 0 ]; then
        write_error "Failed to build $name"
        return 1
    fi
    write_success "$name built successfully"
    return 0
}

dev_project() {
    local name=$1
    local path=$2
    
    write_header "Starting $name in development mode"
    
    cd "$path"
    npm run dev
}

watch_project() {
    local name=$1
    local path=$2
    
    write_header "Starting $name in watch mode"
    
    cd "$path"
    npm run dev
}

start_lm_studio() {
    write_header "Starting LM Studio Server"
    
    cd "$LM_STUDIO_PATH"
    npm start
}

# Parse arguments
WATCH=false
START=false
PROJECT="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        --watch)
            WATCH=true
            shift
            ;;
        --start)
            START=true
            shift
            ;;
        --project)
            PROJECT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Main execution
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║         X-DEV Auto Builder/Installer                      ║
║         Supporting LM Studio + Obsidian Plugin            ║
╚═══════════════════════════════════════════════════════════╝
EOF

echo ""

# Determine which projects to build
PROJECTS=()
if [ "$PROJECT" = "all" ]; then
    PROJECTS=("lm-studio" "obsidian")
else
    PROJECTS=("$PROJECT")
fi

# Install and build phase
for proj in "${PROJECTS[@]}"; do
    if [ "$proj" = "lm-studio" ]; then
        install_project "LM Studio" "$LM_STUDIO_PATH" || exit 1
        build_project "LM Studio" "$LM_STUDIO_PATH" || exit 1
    elif [ "$proj" = "obsidian" ]; then
        install_project "Obsidian Plugin" "$OBSIDIAN_PATH" || exit 1
        build_project "Obsidian Plugin" "$OBSIDIAN_PATH" || exit 1
    fi
done

write_header "✓ All builds completed successfully!"

# Development phase
if [ "$WATCH" = true ]; then
    echo -e "${YELLOW}Entering watch mode. Press Ctrl+C to exit.${NC}\n"
    for proj in "${PROJECTS[@]}"; do
        if [ "$proj" = "lm-studio" ]; then
            watch_project "LM Studio" "$LM_STUDIO_PATH"
        elif [ "$proj" = "obsidian" ]; then
            watch_project "Obsidian Plugin" "$OBSIDIAN_PATH"
        fi
    done
elif [ "$START" = true ] && [[ " ${PROJECTS[@]} " =~ " lm-studio " ]]; then
    start_lm_studio
fi

echo -e "\n${GREEN}✓ Build process complete!${NC}\n"
