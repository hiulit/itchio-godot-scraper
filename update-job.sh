#!/bin/bash

source ".env"

if [[ -z "$ENV_REPO_PATH" ]]; then
    echo >&2
    echo "ERROR: 'ENV_REPO_PATH' is empty!" >&2
    echo >&2
    exit 1
fi

CURRENT_BRANCH="$(git symbolic-ref --short HEAD)"

readonly REPO_PATH="$ENV_REPO_PATH"
readonly FILES_ARRAY=(
    "all.json"
)

CHANGES_ARRAY=()
FILES_FOUND=0
DIRTY_FILES=0

function ctrl_c() {
    echo >&2
    echo >&2
    echo "Cancelled by the user!" >&2
    echo >&2
    if [[ "$DIRTY_FILES" -eq 1 ]]; then
        echo "Unstash changes ..." >&2
        echo >&2
        git stash pop
    fi
    exit 1
}

function node() {
    if [[ -z "$1" ]]; then
        echo >&2
        echo "ERROR: 'node' function needs an argument!" >&2
        echo >&2
        exit 1
    fi

    "$ENV_NODE_PATH" "$1" &
    PID="$!"
    wait $PID
    trap - TERM INT
    wait $PID
    EXIT_STATUS="$?"
}

if [[ -f "update-job.log" ]]; then
    rm "update-job.log"
fi

echo
echo "---- START ----"
echo
echo "$(date "+%Y-%m-%d %H:%M")"
echo

if [[ -n "$ENV_SSH_PRIVATE_KEY_PATH" ]] && command -v ssh-agent &> /dev/null && command -v ssh-add &> /dev/null; then
    eval "$(ssh-agent)"
    platform="$(uname)"
    echo "$platform"
    if [[ "$platform" == "Darwin" ]]; then
        eval ssh-add -K "$ENV_SSH_PRIVATE_KEY_PATH"
    elif [[ "$platform" == "Linux" ]]; then
        eval ssh-add -k "$ENV_SSH_PRIVATE_KEY_PATH"
    fi
    echo
fi

cd "$REPO_PATH"

if [[ "$CURRENT_BRANCH" != "master" ]]; then
    echo
    echo "Checking out to 'master' ..."
    echo
    git checkout master
    echo
fi

# Check for unstaged files.
git update-index -q --refresh 
git diff-index --quiet HEAD --
return_value="$?"
if [[ "$return_value" -eq 1 ]]; then
    DIRTY_FILES=1
fi

if [[ "$DIRTY_FILES" -eq 1 ]]; then
    echo "Stash changes ..."
    echo
    git stash
    echo
fi

trap ctrl_c TERM INT

node "update-games.js"
node "twitter-bot"

git update-index -q --refresh
git pull
while IFS= read -r line; do
    CHANGES_ARRAY+=("${line}")
done < <(git diff-index --name-only HEAD --)
if [[ -n "${CHANGES_ARRAY[@]}" ]]; then
    for changed_file in "${CHANGES_ARRAY[@]}"; do
        for file in "${FILES_ARRAY[@]}"; do
            if [[ "$file" == "$changed_file" ]]; then
                ((FILES_FOUND++))
                file_name="$(basename "$file")"
                echo
                echo "- '$file' found!"
                echo
                git add "$file"
                git commit -m "Updated $file_name"
            fi
        done
    done
    if [[ "$FILES_FOUND" -eq 0 ]]; then
        echo
        echo "All the files in 'FILES_ARRAY' look the same ... Nothing to do here."
    else
        git push
    fi
else
    echo
    echo "No modified files detected ... Nothing to do here."
    echo
fi

if [[ "$DIRTY_FILES" -eq 1 ]]; then
    echo "Unstash changes ..."
    echo
    git stash pop
    echo
fi

echo
echo "$(date "+%Y-%m-%d %H:%M")"
echo
echo "---- END ----"
echo
