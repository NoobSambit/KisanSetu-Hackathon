# UI Revamp Plan

## Objective
Revamp the AI Assistant page and Navigation bar to be "top notch and clean" with a "rich aesthetic".

## 1. Navbar (`components/layout/Navigation.tsx`)
- **Desktop**:
    - Implement a "floating" glass effect navbar.
    - Improve hover effects on links (pill shape background transition).
    - Enhance Logo presentation.
- **Mobile**:
    - Refine the Bottom Navigation Bar:
        - Cleaner icons.
        - Better active state indication (e.g., glowing indicator).
        - Ensure "safe area" padding is handled correctly.
    - Refine Mobile Top Bar:
        - Minimalist and clean.

## 2. AI Assistant Page (`app/assistant/page.tsx`)
- **Layout**:
    - Full-height chat container (minus navbars).
    - Scrollable message area with hidden scrollbar.
    - Fixed bottom input area.
- **Message Bubbles**:
    - **User**: Primary color background, white text, rounded corners (maybe distinct shape).
    - **Assistant**: Neutral background (white/gray), dark text, shadow, avatar icon.
- **Input Area**:
    - Floating pill design or clean bottom bar.
    - Integrated Mic button with pulsing animation when recording.
    - Auto-growing textarea.
- **Voice Panel**:
    - If `showVoicePanel` is true, display a modern overlay/sheet.
    - "Listening" animations (waveforms or pulsing circles).
    - Clear "Stop" and "Send" controls.
- **Empty State**:
    - Show "Preset Queries" as suggestion chips/cards when no messages exist.
- **Animations**:
    - `framer-motion` is likely not installed, so I will use CSS animations/classes (`animate-in`, `fade-in`, `slide-up`).

## 3. Global Styles (`app/globals.css`)
- Ensure `glass` utility is top-notch.
- Add specific animations if needed.

## Execution Order
1.  Refine `Navigation.tsx`.
2.  Refine `app/assistant/page.tsx` (Major overhaul).
