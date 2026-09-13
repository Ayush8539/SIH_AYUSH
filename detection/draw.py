import cv2

from detection.detector import Detection

CATEGORY_COLORS = {
    "person": (0, 220, 0),
    "vehicle": (255, 140, 0),
    "animal": (0, 200, 255),
}


def draw_detections(frame, detections: list[Detection]) -> None:
    for det in detections:
        x1, y1, x2, y2 = det.box
        color = CATEGORY_COLORS.get(det.category(), (0, 220, 0))
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

        # Show only ID and confidence
        obj_id = det.person_id if det.person_id is not None else det.track_id
        if obj_id is not None:
            label = f"ID: {obj_id} ({det.confidence:.2f})"
        else:
            label = f"ID: - ({det.confidence:.2f})"

        # Clean background tag for maximum readability
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        lbl_y = max(y1 - 6, th + 4)
        cv2.rectangle(frame, (x1, lbl_y - th - 4), (x1 + tw + 6, lbl_y + 2), color, -1)
        cv2.putText(
            frame, label, (x1 + 3, lbl_y - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA
        )
