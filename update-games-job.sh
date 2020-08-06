#!/bin/bash

source ".env.sh"

# PATH="$ENV_PATH"

readonly SCRIPT_PATH="$ENV_SCRIPT_PATH"
readonly FILES_ARRAY=(
    "all.json"
)

CHANGES_ARRAY=()
FILES_FOUND=0

function ctrl_c() {
    # echo "Trapped CTRL-C"
    echo >&2
    echo >&2
    echo "Cancelled by the user!" >&2
    echo >&2
    echo "Unstash changes ..." >&2
    echo >&2
    git stash pop
    exit 1
}

echo
echo "---- START ----"
echo
echo "$(date "+%Y-%m-%d %H:%M")"
echo
eval ssh-add -K "$ENV_SSH_PRIVATE_KEY_PATH"
echo

cd "$SCRIPT_PATH"

echo "Stash changes ..."
echo
git stash
echo

trap ctrl_c TERM INT
node update-games.js &
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
        echo "Pulling from 'develop' ..."
        echo
        git pull
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

echo
echo "Unstash changes ..."
echo
git stash pop
echo
echo "---- END ----"
echo
