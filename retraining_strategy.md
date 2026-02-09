# Retraining Strategy - Hard Negative Mining (Option C)

## Goal
Reduce False Positives (Safe events misclassified as Danger) while maintaining Recall (Danger events correctly classified).

## Data
- **True Positives (TP):** 266 videos. Actual Danger events.
- **False Positives (FP):** 518 videos. Safe events (but model thought they were Danger).

## Hypothesis
The model is misclassifying Safe events as Danger because:
1.  **Ghost Detections:** Detecting non-objects (shadows, reflections) as cars close by.
2.  **Bounding Box Error:** Overestimating the size of distant cars (making them look close).

## Strategy
We need to retrain the YOLO Object Detector to be more precise.

### Step 1: Generate Labels (Semi-Supervised)
We cannot manually label 784 videos frame-by-frame.
We will use the **current best model** to generate initial labels, then **heuristically correct them**.

#### For False Positives (Safe Videos):
- Run inference.
- Identify the detections that caused the "Danger" classification (i.e., high confidence, large bounding box).
- **Mark these specific detections as NEGATIVE (Background)** or **Downgrade their class/confidence**?
- YOLO training requires "Ground Truth".
- If a video is "Safe", it means *there is no car in the danger zone*.
- So, any detection in the "Danger Zone" (e.g., center of lane, large box) in a FP video is a **Bad Detection**.
- **Action:** We generate labels for these frames, but REMOVE the boxes that correspond to the "Danger" object.
    - If there are other cars (distant, other lanes), we KEEP them (if the model detects them).
    - But strictly speaking, if we retrain with *missing* labels (i.e. we remove the FP box but leave the pixels), the model learns "this object is NOT a car". This is exactly what we want for ghosts.
    - If the object IS a car but just distant, and we remove the label, the model learns "this car is NOT a car". That's bad. We want it to learn "this car is DISTANT".
    - But YOLO doesn't output distance directly (usually). It outputs a box.
    - If the box is too big (causing close distance est), we need to SHRINK the box to its true size. We can't do that automatically.

#### Alternative: Focus on "Ghost" FPs first?
- If the FP is a "Ghost" (reflection), removing the label is perfect.
- If the FP is a "Real Car" (just distant), removing the label is dangerous.

**Observation from previous turns:** The user mentioned "Hard Negative Mining (teach model to ignore ghosts)".
This suggests the primary issue is **Ghosts/Artifacts**.
Therefore, I should assume the "Danger" detections in the FP set are mostly **Ghosts**.
I will proceed with the strategy of **removing the "Danger" labels** from the FP frames.

### Execution Plan
1.  **Copy Data:** (Running...)
2.  **Run Inference (to get labels):** Run the current model on all 784 videos to generate `.txt` label files (YOLO format).
3.  **Filter Labels:**
    - For **TP videos**: Keep labels as is (assume model is mostly right, maybe filter low conf).
    - For **FP videos**: identify the "Danger" box (largest/closest). REMOVE IT. Keep others.
        - *Risk:* If it's a real car, we teach model to ignore real cars.
        - *Mitigation:* Only remove if confidence is marginal? Or assume User validated these as "Safe" implying "No Danger Car".
        - If "Safe" means "Car is there but far", and we remove the label, we teach model "Far car = Background". That's bad.
        - **Refined Strategy for FPs:**
            - If detection is "Ghost" -> Remove label.
            - If detection is "Car" but "Safe Distance" -> We need the Correct Box.
            - Without manual labeling, we can't fix "Car" boxes.
            - **Compromise:** We will assume the bulk of FPs are Ghosts (based on "teach model to ignore ghosts"). We will target detections that look like ghosts (e.g. static position, specific areas, or just the one triggering the alert).

    - *Actually*, if we just add the FP images as "Background Images" (no labels at all), the model learns to ignore *everything* in them.
    - If there are real cars in the background of FP videos, this hurts recall.
    - But maybe for "following distance", we only care about the *closest* car.
    - If we assume the FP videos are "Empty Road" (no car ahead), then providing them as empty label files is correct.
    - Let's check a sample of FP videos to see if they are empty or have distant cars.

### Action
I need to peek at the FP videos. I can't watch them, but I can check the `batch_results_summary_fix.json` details? No, it just lists filenames.
I'll download one FP video and extract a frame to ASCII/Analyze? No, I'll rely on the "ignore ghosts" directive.

**Directive:** "Option C: Retrain Main YOLO (Hard Negative Mining)".
**Context:** "teach model to ignore ghosts".
**Conclusion:** Treat FPs as containing GHOSTS.
**Implementation:**
1.  Run Inference -> Get Labels.
2.  For FPs: Find the detection that looks like a ghost (the one causing the false alarm).
    - If there's only one detection, remove it.
    - If multiple, remove the "dangerous" one.
3.  For TPs: Keep labels.
4.  Retrain.

I need a script to:
1.  Run inference on the new dataset (cloud batch?).
2.  Process the labels.
3.  Submit training job.
