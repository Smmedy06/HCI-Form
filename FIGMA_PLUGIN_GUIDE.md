# Figma Plugin Guide - URL Parameters

This guide explains how to use URL parameters to access different sections of the form for the Figma "HTML to Design" plugin.

## How It Works

The form now supports URL parameters that allow you to directly access any section. This is perfect for the Figma plugin, which can only see the initially visible content.

## URL Format

```
https://your-domain.com/index.html?section=N
```

Where `N` is the section number (1-5).

## Section URLs

### Section 1: Personal Information
```
https://your-domain.com/index.html?section=1
```
- Progress: 20% (1/5)
- Shows: Child's Name, Date of Birth, Gender fields

### Section 2: Contact Details
```
https://your-domain.com/index.html?section=2
```
- Progress: 40% (2/5)
- Shows: Parent Name, Email, Phone, Password fields

### Section 3: Learning Preferences
```
https://your-domain.com/index.html?section=3
```
- Progress: 60% (3/5)
- Shows: Interests checkboxes, Country dropdown, Message textarea

### Section 4: Location Information
```
https://your-domain.com/index.html?section=4
```
- Progress: 80% (4/5)
- Shows: Address field, Map, Get Location button

### Section 5: Review & Submit
```
https://your-domain.com/index.html?section=5
```
- Progress: 100% (5/5)
- Shows: Review summary, Submit button

## Default (No Parameter)

If no `section` parameter is provided, the form defaults to Section 1:
```
https://your-domain.com/index.html
```

## Features When Using URL Parameters

1. **Automatic Progress Bar**: The progress bar automatically updates to show the correct percentage for that section
2. **Active Step Highlighting**: The progress steps are highlighted up to and including the current section
3. **All Fields Enabled**: In preview mode (when using URL parameters), all fields in the target section are enabled for easy viewing in Figma
4. **Header Preserved**: The header and progress bar remain consistent across all sections

## For GitHub Pages

If you're using GitHub Pages, your URLs will be:
```
https://smmedy06.github.io/HCI-Form/?section=1
https://smmedy06.github.io/HCI-Form/?section=2
https://smmedy06.github.io/HCI-Form/?section=3
https://smmedy06.github.io/HCI-Form/?section=4
https://smmedy06.github.io/HCI-Form/?section=5
```

## Workflow for Figma Plugin

1. **Push your code to GitHub** (one time)
2. **Access each section via URL parameter** in the Figma plugin:
   - Enter the URL with `?section=1` for Personal Information
   - Enter the URL with `?section=2` for Contact Details
   - Continue for all 5 sections
3. **No need to push multiple times** - just change the URL parameter!

## Tips

- The form automatically enables all fields in preview mode, so you can see the complete design
- The progress bar and header stay consistent, showing the correct progress for each section
- You can still navigate between sections using Next/Previous buttons if needed
- All validation and dependencies still work normally when not in preview mode

