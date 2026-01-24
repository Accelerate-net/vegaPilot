#!/bin/bash

# Script to add scroll-fix.css to all HTML files that use the static-sidebar layout
# This fixes the scrolling issue where sidebar and content scroll together

# Array of HTML files to update (excluding index.html and verify-token.html as they don't have sidebar)
files=(
    "batch.html"
    "bunny-admin.html"
    "candidate-detail.html"
    "catalog.html"
    "course-management.html"
    "course-view.html"
    "courses-list.html"
    "exam-attempt-report.html"
    "exam-creation-wizard.html"
    "exam-listing.html"
    "instructor-portfolio.html"
    "mentor-profiles.html"
    "orders.html"
    "practice-questions.html"
    "question-bank.html"
    "quiz-attempt-report.html"
    "quiz-creation.html"
    "quiz-listing.html"
    "test-series-list.html"
    "video-content.html"
    "web-content-manager.html"
)

# CSS line to add
css_line='      <link type="text/css" href="assets/css/scroll-fix.css" rel="stylesheet">'

# Counter for modified files
count=0

echo "Adding scroll-fix.css to HTML files..."
echo "========================================"

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        # Check if the file already has scroll-fix.css
        if grep -q "scroll-fix.css" "$file"; then
            echo "✓ $file - Already has scroll-fix.css (skipped)"
        else
            # Check if the file has styles.css
            if grep -q "assets/css/styles.css" "$file"; then
                # Add scroll-fix.css right after styles.css
                sed -i '' '/assets\/css\/styles.css/a\
'"$css_line"'
' "$file"
                echo "✓ $file - Added scroll-fix.css"
                ((count++))
            else
                echo "⚠ $file - No styles.css found (skipped)"
            fi
        fi
    else
        echo "✗ $file - File not found"
    fi
done

echo "========================================"
echo "Modified $count file(s)"
echo "Done!"
