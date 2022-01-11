#!/bin/bash

source ".env"

readonly SCRIPT_PATH="$ENV_SCRIPT_PATH"
readonly FILES_ARRAY=(
    "all.json"
    "graphs/images/number-of-games-by-platform.jpg"
    "graphs/images/top-authors-by-game-count.jpg"
)

CHANGES_ARRAY=()
FILES_FOUND=0
DIRTY_FILES=0

function ctrl_c() {
    echo >&2
    echo >&2
    echo "Cancelled by the user!" >&2
    echo >&2
    echo "Unstash changes ..." >&2
    echo >&2
    if [[ "$DIRTY_FILES" -eq 1 ]]; then
        echo
        echo "Unstash changes ..." >&2
        echo
        git stash pop
    fi
    exit 1
}

echo
echo "---- START ----"
echo
echo "$(date "+%Y-%m-%d %H:%M")"
echo
eval "$(ssh-agent)"
eval ssh-add -K "$ENV_SSH_PRIVATE_KEY_PATH"
echo

cd "$SCRIPT_PATH"

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
fi
echo

trap ctrl_c TERM INT
eval "$ENV_NODE_PATH" update-games.js &
PID="$!"
wait $PID
trap - TERM INT
wait $PID
EXIT_STATUS="$?"

git update-index -q --refresh
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
        echo
        echo "Checking out to 'develop' ..."
        echo
        git checkout develop
        echo
        echo "Pulling and rebasing from 'develop' ..."
        echo
        git pull --rebase
        echo
        echo "Pushing to 'develop' ..."
        echo
        git push
        echo
        echo "Checking out to 'master' ..."
        echo
        git checkout master
        echo
        echo "Pulling from 'master' ..."
        echo
        git pull
        echo
        echo "Merging 'develop' into 'master' ..."
        echo
        git merge --no-edit develop
        echo
        echo "Pushing to 'master' ..."
        echo
        git push
        echo
        echo "Checking out to 'develop' ..."
        echo
        git checkout develop
    fi
else
    echo
    echo "No modified files detected ... Nothing to do here."
fi

if [[ "$DIRTY_FILES" -eq 1 ]]; then
    echo
    echo "Unstash changes ..."
    echo
    git stash pop
fi
echo
echo "---- END ----"
echo
