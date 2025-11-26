# Workflow Execution Animation - Visual Guide

## 🎨 Node States Visual Reference

### State 1: Idle (Default)
```
┌─────────────────────────┐
│  [icon] Action          │  ← Clean white background
│                         │  ← Default colored border (indigo/green/amber)
│  Node Name              │
│                         │
└─────────────────────────┘
```
**Appearance:**
- White background
- Default border color (indigo for actions, green for triggers, amber for controls)
- No badge
- No animation

---

### State 2: Pending (Waiting)
```
     ⏰ Pending
┌─────────────────────────┐
│  [icon] Action          │  ← White background, 60% opacity (dimmed)
│                         │  ← Gray border
│  Node Name              │
│                         │
└─────────────────────────┘
```
**Appearance:**
- Gray badge with clock icon (top-left)
- Dimmed/faded appearance (opacity: 60%)
- Gray border
- No animation (static)

**When?** Node is in queue, waiting to execute

---

### State 3: Running (Active)
```
     🔵 Running ⚡
█████████████████████████████  ← Animated progress bar
┌─────────────────────────┐
│  [icon] Action          │  ← Blue gradient background (pulsing)
│ ⚡⚡⚡                    │  ← Icon pulsing/animated
│  Node Name              │  ← Blue text
│                         │  ← Blue glowing shadow
└─────────────────────────┘
```
**Appearance:**
- Blue pulsing badge with spinning play icon (top-left)
- Animated progress bar sliding across top
- Blue gradient background (light blue to lighter blue)
- Blue glowing border with shadow
- Icon pulses with animation
- Text turns blue

**Animations:**
1. **Badge pulse** - Fades in/out
2. **Progress bar** - Slides left to right continuously
3. **Icon pulse** - Size/opacity animation
4. **Glow effect** - Blue shadow around border

**When?** Node is currently executing

---

### State 4: Completed (Success)
```
     ✅ Done
┌─────────────────────────┐
│  [icon] Action          │  ← Green gradient background
│                         │  ← Green border
│  Node Name              │  ← Green text
│                         │
└─────────────────────────┘
```
**Appearance:**
- Green badge with checkmark icon (top-left)
- Green gradient background (light green)
- Green border
- Icon and text in green
- No animation (static)

**When?** Node executed successfully

---

### State 5: Failed (Error)
```
     ❌ Failed ⚠️
┌─────────────────────────┐
│  [icon] Action          │  ← Red gradient background (pulsing)
│ ⚠️⚠️⚠️                 │  ← Red glowing shadow
│  Node Name              │  ← Red text
│                         │
└─────────────────────────┘
```
**Appearance:**
- Red pulsing badge with X icon (top-left)
- Red gradient background (light red)
- Red glowing border with shadow
- Icon and text in red
- Badge pulses to draw attention

**Animations:**
1. **Badge pulse** - Draws attention to error
2. **Glow effect** - Red shadow around border

**When?** Node execution failed with error

---

## 🌊 Edge Animations

### Inactive Edge (Default)
```
Node A ────────────────→ Node B
       (solid gray line)
```

### Active Edge (Data Flowing)
```
Node A ═══════════════⚡⚡⚡═══→ Node B
       (animated blue dashes, flowing)
```
**Animation:** Dashed line with moving pattern (left to right)

---

## 🎬 Execution Sequence Example

### Workflow: Trigger → Action 1 → Action 2 → Action 3

#### T=0s - Start Execution
```
✅ Trigger (Done)  ═══⚡⚡⚡═══→  🔵 Action 1 (Running)  ────→  ⏰ Action 2 (Pending)  ────→  ⏰ Action 3 (Pending)
  [Green]                            [Blue, Pulsing]             [Gray, Dimmed]                [Gray, Dimmed]
```

#### T=2s - Action 1 Complete
```
✅ Trigger (Done)  ─────→  ✅ Action 1 (Done)  ═══⚡⚡⚡═══→  🔵 Action 2 (Running)  ────→  ⏰ Action 3 (Pending)
  [Green]                   [Green]                             [Blue, Pulsing]              [Gray, Dimmed]
```

#### T=4s - Action 2 Complete
```
✅ Trigger (Done)  ─────→  ✅ Action 1 (Done)  ─────→  ✅ Action 2 (Done)  ═══⚡⚡⚡═══→  🔵 Action 3 (Running)
  [Green]                   [Green]                     [Green]                             [Blue, Pulsing]
```

#### T=6s - All Complete
```
✅ Trigger (Done)  ─────→  ✅ Action 1 (Done)  ─────→  ✅ Action 2 (Done)  ─────→  ✅ Action 3 (Done)
  [Green]                   [Green]                     [Green]                     [Green]
```

---

## 🔀 Parallel Execution Example

### Workflow with Parallel Branches

#### T=0s - Start
```
                    ┌──────→  🔵 HTTP 1 (Running)
                    │           [Blue, Pulsing]
✅ Trigger (Done) ──┼──────→  🔵 HTTP 2 (Running)
  [Green]           │           [Blue, Pulsing]
                    └──────→  🔵 HTTP 3 (Running)
                                [Blue, Pulsing]
```
**Note:** All three HTTP nodes pulse simultaneously! This is the parallel execution in action.

#### T=2s - All Complete
```
                    ┌──────→  ✅ HTTP 1 (Done)
                    │           [Green]
✅ Trigger (Done) ──┼──────→  ✅ HTTP 2 (Done)
  [Green]           │           [Green]
                    └──────→  ✅ HTTP 3 (Done)
                                [Green]
```

---

## 🎨 Color Palette Reference

### Status Colors

| Status | Badge BG | Badge Text | Border | Background Gradient | Shadow | Text Color |
|--------|----------|------------|--------|---------------------|--------|------------|
| **Idle** | - | - | Default | White | None | Default |
| **Pending** | Gray-400 | White | Gray-300 | White (60% opacity) | None | Gray |
| **Running** | Blue-500 | White | Blue-400 | Blue-50 → Blue-100 | Blue-200 | Blue-700 |
| **Completed** | Green-500 | White | Green-400 | Green-50 → Green-100 | None | Green-700 |
| **Failed** | Red-500 | White | Red-400 | Red-50 → Red-100 | Red-200 | Red-700 |

### Hex Values (Tailwind Default)

```
Blue-500:   #3b82f6  (Badge background - Running)
Blue-400:   #60a5fa  (Border - Running)
Blue-200:   #bfdbfe  (Shadow glow - Running)
Blue-100:   #dbeafe  (Background end - Running)
Blue-50:    #eff6ff  (Background start - Running)
Blue-700:   #1d4ed8  (Text/Icon - Running)

Green-500:  #22c55e  (Badge background - Completed)
Green-400:  #4ade80  (Border - Completed)
Green-100:  #dcfce7  (Background end - Completed)
Green-50:   #f0fdf4  (Background start - Completed)
Green-700:  #15803d  (Text/Icon - Completed)

Red-500:    #ef4444  (Badge background - Failed)
Red-400:    #f87171  (Border - Failed)
Red-200:    #fecaca  (Shadow glow - Failed)
Red-100:    #fee2e2  (Background end - Failed)
Red-50:     #fef2f2  (Background start - Failed)
Red-700:    #b91c1c  (Text/Icon - Failed)

Gray-400:   #9ca3af  (Badge background - Pending)
Gray-300:   #d1d5db  (Border - Pending)
```

---

## 📐 Layout Specifications

### Badge Position
```
     ← 8px from left, 8px from top (absolute positioning)
     🔵 Running
┌─────────────────────────┐
│                         │
│                         │
└─────────────────────────┘
```

### Progress Bar
```
█████████████████████████████  ← Height: 4px (1 Tailwind unit)
┌─────────────────────────┐   ← Position: Absolute top
│                         │   ← Full width with rounded corners
```

### Border & Shadow
```
┌─────────────────────────┐
│   2px border             │  ← border-2 class
│   with ring-2 class     │  ← Additional 2px ring for glow
│   + shadow-lg           │  ← Large shadow for running/failed
└─────────────────────────┘
```

---

## 🎬 Animation Specifications

### 1. Badge Pulse (Running & Failed)
```css
Animation: pulse
Duration: 2s
Timing: ease-in-out
Infinite: yes
Effect: opacity 1 → 0.7 → 1
```

### 2. Progress Bar Slide
```css
Animation: progress
Duration: 1.5s
Timing: linear
Infinite: yes
Effect: translateX(-100%) → translateX(100%)
```

### 3. Icon Spin (Running badge icon)
```css
Animation: spin
Duration: 1s
Timing: linear
Infinite: yes
Effect: rotate(0deg) → rotate(360deg)
```

### 4. Icon Pulse (Node icon when running)
```css
Animation: pulse
Duration: 1s
Timing: ease-in-out
Infinite: yes
Effect: opacity/scale variation
```

### 5. Edge Flow
```css
Animation: flow
Duration: 1s
Timing: linear
Infinite: yes
Effect: stroke-dashoffset animation
```

---

## 🎯 Node Type Variations

All node types follow the same status pattern but with different base colors:

### Trigger Nodes
- **Base Color:** Green (green-500, green-300)
- **Icon:** Play, Clock, Webhook, Zap
- **Example:** Manual Trigger, Schedule Trigger

### Action Nodes
- **Base Color:** Indigo (indigo-500, indigo-300)
- **Icon:** Bot, Wrench, Send, Mail, Database, Code
- **Example:** HTTP Call, Email Send, Agent Action

### Control Nodes (Condition, Delay, Loop, Merge)
- **Base Color:** Amber (amber-500, amber-300)
- **Icon:** GitBranch, Timer, Repeat, Merge
- **Example:** If/Else, Wait 5 seconds, Loop 3 times

### Status Override
When a node has an execution status, the status color **overrides** the base color:
- Running → Always Blue
- Completed → Always Green
- Failed → Always Red
- Pending → Always Gray

---

## 💡 Tips for Best Visual Experience

### For Developers
1. **Test with Multiple States** - Ensure all status transitions work smoothly
2. **Check Contrast** - Verify text is readable on all backgrounds
3. **Performance** - Monitor animation performance with many nodes
4. **Accessibility** - Status is visible, not just color-dependent (icons help)

### For Users
1. **Watch the Flow** - Follow the blue pulse to see execution progress
2. **Identify Errors Fast** - Red pulsing nodes indicate failures
3. **Understand Parallel** - Multiple blue nodes = parallel execution
4. **Review History** - Green checkmarks show completed path

---

## 🔍 State Comparison Grid

```
┌──────────┬─────────┬──────────┬────────────┬─────────┬───────────┐
│ State    │ Badge   │ Border   │ Background │ Shadow  │ Animation │
├──────────┼─────────┼──────────┼────────────┼─────────┼───────────┤
│ Idle     │ None    │ Default  │ White      │ None    │ None      │
│ Pending  │ Gray    │ Gray     │ White 60%  │ None    │ None      │
│ Running  │ Blue    │ Blue     │ Blue Grad  │ Blue    │ YES       │
│ Complete │ Green   │ Green    │ Green Grad │ None    │ None      │
│ Failed   │ Red     │ Red      │ Red Grad   │ Red     │ Pulse     │
└──────────┴─────────┴──────────┴────────────┴─────────┴───────────┘
```

---

## 🎨 Dark Mode Considerations (Future)

For future dark mode support, suggested color adjustments:

| Element | Light Mode | Dark Mode Suggestion |
|---------|------------|---------------------|
| Background | White/Gradient | Dark gray/Darker gradient |
| Text | Dark gray | Light gray |
| Borders | Colored | Brighter colored |
| Shadows | Subtle | More pronounced |
| Badge | Solid colors | Slightly muted |

---

## 🚀 Quick Reference Card

```
Status    │ Visual              │ Meaning
──────────┼─────────────────────┼──────────────────────
Idle      │ ⚪ Clean white      │ Not executed yet
Pending   │ ⏰ Gray dimmed      │ Waiting in queue
Running   │ 🔵 Blue pulsing     │ Currently executing
Completed │ ✅ Green checkmark  │ Successfully done
Failed    │ ❌ Red pulsing      │ Error occurred
```

**Edge Animation:**
- `────→` Static = No data flow
- `═══⚡⚡⚡═══→` Animated = Data flowing

---

**Visual guide complete! Use this as a reference for understanding and implementing workflow execution animations.** 🎨✨
