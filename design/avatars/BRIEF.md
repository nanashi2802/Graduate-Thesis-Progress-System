# Role avatars: brief for six-heads-tall characters (2D cut-out rig)

**Status:** Draft v0.3 (25 Nov 2026). The Student test images exist in `design/avatars/work/` (git-ignored, local only). The owner has not approved any art yet.
**Change from v0.2:** added "AI context" and the build plan (§0). Changes from v0.1: SpriteCast and the 3D model are dropped. The current avatar uses only flat 2D motion (§2), so a 3D model adds nothing. The new art keeps the current rig and replaces only its drawings.
**Replaces (when approved):** the chibi drawings in `src/app/_components/landing/chibi-rig.tsx`. DESIGN.md §5 "Avatars" and PRODUCT.md change only after the owner approves the result.

## 0. AI context and build plan

**Read this first.** This section is the short version. The sections after it hold the detail.

**What:** replace the four chibi role avatars on the landing page (`/`, section "Built for Everyone Involved") with adult characters about six heads tall. The roles are Student, Adviser, Panel Member and Coordinator.
**How:** keep the code rig. Swap only the drawings. The rig moves flat layers around pivot points with CSS (§2). Each new character comes apart into the same 8 layers (§3), as WebP images.
**Who:** the owner makes the images in ChatGPT from Claude's prompts (§6). Claude cuts, lines up and exports the layers, then changes the code (§8).
**Style source:** `design/avatars/source/character-sheet.png` (the owner's sheet, 24 Nov 2026). Use it for the look only, not for cut-outs (§5).
**Hard rules:** no PUP logo, seal or text on clothes (DESIGN.md P9). Fictional people only. Respect `prefers-reduced-motion`. Add no dependency.
**Do not touch:** the poses, acts, cursor tracking and mirror logic in `chibi-rig.tsx`, and the role switcher (`role-switcher.tsx`).

**Build plan** (tick each box when it is done):

| # | Step | Done when |
| :---- | :---- | :---- |
| 1 | Student: run prompts 1 to 3 (§6), then cut the 8 layers | - [ ] The layers stack on the base drawing with no gaps at the neck and shoulders |
| 2 | Student: put the layers in the rig on a test branch | - [ ] Breathe, blink, look, lift, the 5 acts and wave all look right at 360 px and at desktop width |
| 3 | Owner approves the Student | - [ ] The owner says yes. Stop here until then. |
| 4 | Adviser, Panel Member, Coordinator: steps 1 and 2 for each, with the approved Student base drawing attached | - [ ] All four match in line, shading and scale |
| 5 | Check the 13 props against the new art (§3) | - [ ] Each prop fits the hand. Redraw only the props that clash. |
| 6 | Code: `<image>` layers in `chibi-rig.tsx`, new pivots and arm angles in `landing.css`, pill icon from the `head` layer (§8) | - [ ] `pnpm lint`, `pnpm typecheck` and `tests/e2e/home.spec.ts` pass |
| 7 | Docs: DESIGN.md §5.7 "Avatars", PRODUCT.md "Role avatars", rename `ChibiRig` | - [ ] The docs name the new files and the new art |
| 8 | Close the open points (§9) | - [ ] Each `[CONFIRM]` has the owner's answer |

**Where things go:** layers in `public/landing/avatars/<role>/` (committed). ChatGPT sheets and test images in `design/avatars/work/` (git-ignored).

## 1. Goal

Four role characters, about six heads tall, drawn in an anime style with clean outlines and cel shading. All four are adults. They do everything the chibi figures do now, with the same code for pose, act and cursor tracking.

## 2. What the avatar does now (the rig to keep)

Source: `chibi-rig.tsx` and `.rig*` in `src/app/landing.css`. Every motion is a CSS move of one flat layer around a pivot point.

| Motion | Trigger | Layer that moves | How |
| :---- | :---- | :---- | :---- |
| Breathe | Always | Whole body | Rise of 2 px and a small vertical stretch, 3.6 s loop. Pivot: the feet. |
| Blink | Always (staggered for each role) | Eyes | Squash to 10% height for a moment, every 5.2 s |
| Head follows the cursor | Cursor moves (`lookX`, `lookY`) | Head | Rotate up to 5° plus a small shift. Pivot: the neck. |
| Eyes follow the cursor | Cursor moves | Pupils | Shift up to 3.5 px |
| Lift | Role is picked | Right arm + prop | Rotate -62°. Pivot: the right shoulder. |
| Present: `show` | Feature tour | Right arm + prop, head, pupils | Arm -40°, prop held out and larger |
| Present: `front` | Feature tour | Right arm + prop, head | Arm 26°, prop held in front |
| Present: `raise` | Feature tour | Right arm + prop | Arm -138°, prop overhead |
| Present: `hand-up` | Feature tour | Both arms | Right arm 26°, left arm 128°, happy mouth |
| Present: `cheer` | Feature tour | Both arms, whole body | Both arms up, hop of 14 px two times, happy mouth |
| Wave | Click | Left arm, mouth | Arm swings 118° to 150°, happy mouth, speech bubble |
| Mouth | Follows the pose | Mouth | Swap calm and happy |
| Face left or right | Card side | Whole figure | Mirror flip |
| Prop swap | Feature changes | Prop | Pop-in. 13 props: 4 tablets, 3 papers, 2 calendars, clipboard, notebook, book, people. |
| Pill icon | Always | Head only | Still crop |
| Reduced motion | `prefers-reduced-motion` | All | Nothing moves |

**Conclusion:** no motion turns the body in space. A 3D model is not needed. The new art must come apart into the same layers.

## 3. Layers for each character

All layers share one canvas and line up exactly when stacked. Back to front:

| # | Layer | Notes |
| :---- | :---- | :---- |
| 1 | `hair-back` | Long hair behind the body (Adviser, Coordinator only) |
| 2 | `arm-l` | Left arm (viewer's right), shoulder to open hand. It waves, so the hand is open, palm forward. |
| 3 | `body` | Neck, torso, legs, shoes. No arms, no head. The shirt and jacket are complete where the arms covered them. |
| 4 | `head` | Head with hair, face, eyes open, calm mouth. No neck. |
| 5 | `pupils` | Irises and pupils only, so they can move inside the eyes |
| 6 | `eyes-closed` | Closed-eye lines, placed over the eyes for the blink |
| 7 | `mouth-happy` | Open smile, placed over the calm mouth |
| 8 | `arm-r` | Right arm (viewer's left), shoulder to a loosely closed hand that grips the prop |

**Props:** keep the 13 SVG props in `chibi-rig.tsx`. They are generic objects in the same outline style. Scale them to the new hand. Check them against the new art, and redraw only those that clash `[CONFIRM]`.

**Pivots:** measure them again on the new art (neck, both shoulders, feet, prop grip) and update `landing.css`. At six heads tall the arms are longer, so check the `raise` and `cheer` angles.

## 4. Style rules (all four characters)

| Item | Rule |
| :---- | :---- |
| Proportion | About 6 heads tall. Adult build. No chibi, no super-deformed head. |
| Line | Dark outline, warm near-black `#2E2224`, even weight. The same line on every character. |
| Shading | Cel shading: one flat base tone and one hard-edged shade tone. No soft airbrush. No texture. |
| Face | Anime face for adults: eyes with two highlights each, small nose, calm and friendly. No blush marks. |
| Hair | Clumped hair with one hard shine band |
| Skin | Base `#F8D9C2`, shade `#EDBDA0` |
| Pose (base drawing) | Front view, standing straight, feet a little apart. Arms down and held about 15° away from the body, so each arm can be cut out cleanly. Nothing held. |
| Light | From the upper left on all four, so the shading matches when an arm rotates |
| Background | Transparent, or plain white |
| Branding | No PUP seal, no logo, no text on clothes or ID cards (DESIGN.md P9) |
| People | Fictional characters. Do not model them on a real person. |

## 5. Characters

**Source:** the owner's six-heads-tall character sheet (24 Nov 2026), `design/avatars/source/character-sheet.png`. It replaces the chibi colors in `LOOKS`. Ages are a proposal `[CONFIRM]`.

| Role | Look (from the sheet) |
| :---- | :---- |
| **Student** (man, about 25) | Messy black hair, no glasses. Dark charcoal zip jacket with a hood and elbow patches, over a dark grey tee. Black backpack, straps over both shoulders. Black slim trousers. Grey and white sneakers. |
| **Adviser** (woman, about 45) | Long straight black hair, behind the shoulders. Thin glasses. Black blazer over a white open-collar blouse. Black trousers. Black flats. |
| **Panel Member** (man, about 55) | Short neat black hair. Rectangular glasses. Navy blazer, blue shirt, no tie, belt. Black trousers. Black shoes. |
| **Coordinator** (woman, about 35) | Shoulder-length wavy dark brown hair. Dusty-rose blazer over a white blouse. Black trousers. Black flats. |

**Use of the sheet:** use it as the design and style reference only. Do not cut layers from it:

- It is 765 x 1024 px, so each figure is only about 230 px tall.
- It has errors. The Adviser's face parts show a man with short hair. The T-pose arms of the Adviser are grey placeholders. The labels are garbled text.
- Its props (backpack, clipboards, tablets) are a reference for the props check in §3.

## 6. Prompts and who does what

The owner makes the images in ChatGPT (free tier). Claude writes the prompts, then cuts and lines up the layers.

**Three prompts for each character, 12 in total:**

| # | Prompt | Attach | Gives |
| :---- | :---- | :---- | :---- |
| 1 | Base drawing: the full character in the pose of §4 | The owner's chibi character sheet. For roles 2 to 4, also the approved Student base drawing (it fixes the style). | The base drawing. It is also the guide for lining up all layers. |
| 2 | Parts sheet: the same character in separate parts, spaced apart: head, body without arms (complete clothes), right arm, left arm, hair-back | The base drawing from prompt 1 | Layers 1 to 4 and 8 |
| 3 | Face sheet: eyes closed, open smile, and the eyes without irises plus the irises alone, at the head's scale | The head from prompt 2 | Layers 5 to 7 |

**Lessons from the Student (24 Nov 2026):**

- Prompt 3 asks for 3 full heads (eyes closed, happy, empty eyes) plus the irises alone. ChatGPT redraws the head a little differently from prompt 2. So the **empty-eyes head is the master `head` layer**, and the closed eyes and the smile are cut from the other two heads on the same sheet. Then the skin and hair match exactly.
- Scale the irises to about 1.6 times the eye-white height and clip them to the eye whites. Smaller irises look surprised.
- The rig's `rig-arm-r` (the prop arm) is on the **viewer's** right. Mirror the arms from prompt 2, or ask for the gripping hand on the viewer's right.
- The arms go behind the body, so the body's shoulder hides the arm's top. For the acts `front` and `hand-up`, show the prop arm in front of the body.

**Order:** do the Student first. Do the other three only after the owner approves the Student.

**Claude's steps after the images arrive:**

1. Cut each part from its sheet, and scale and place it over the base drawing.
2. Fix small gaps at the shoulders and neck, or ask for one prompt again.
3. Export each layer as WebP at 2x the stage size, on one canvas.
4. Measure the pivots and update the rig.

## 7. Output into the repository

`public/landing/avatars/<role>/` holds the layers of §3 as WebP files. The base drawing and the ChatGPT sheets stay out of the repository (`design/avatars/work/`, git-ignored).

## 8. Changes in the app (after the art is approved)

1. In `chibi-rig.tsx`, replace the SVG shapes of each layer with an `<image>` of the same layer. Keep the class names (`rig-head`, `rig-arm-r`, `rig-eye` and so on), so `landing.css` keeps working.
2. Update the pivots and arm angles in `landing.css`.
3. The pill icon uses the `head` layer.
4. Nothing else changes: cursor tracking, poses, acts, mirror and reduced motion all stay.
5. Update DESIGN.md §5 "Avatars" and PRODUCT.md "Role avatars". Rename the component from `ChibiRig` when the art lands.

## 9. Open points

- `[CONFIRM]` Ages in §5.
- `[CONFIRM]` Keep the SVG props, or redraw some to match the new art.
- `[CONFIRM]` Pupil tracking: at six heads tall the eyes are small. If the irises do not cut cleanly, keep the head turn and drop the pupil move.
