import yagmail
import os
from loguru import logger
from backend.config import settings

def send_violation_email_sync(detection_id: str, violations: list, image_path: str = None):
    """
    Sends an email alert for traffic violations synchronously.
    Intended to be run in a FastAPI BackgroundTask.
    """
    if not settings.ENABLE_EMAIL_ALERTS:
        logger.info("Email alerts are disabled. Skipping email notification.")
        return

    if not settings.SENDER_EMAIL or not settings.SENDER_PASSWORD or not settings.RECEIVER_EMAIL:
        logger.warning("Email credentials missing. Cannot send email alert.")
        return

    try:
        yag = yagmail.SMTP(settings.SENDER_EMAIL, settings.SENDER_PASSWORD)
        
        subject = f"⚠️ SHIELD AI Alert: Traffic Violation Detected [{detection_id}]"
        
        # Build email body
        body = ["<h2>Traffic Violation Alert</h2>"]
        body.append(f"<p><strong>Detection ID:</strong> {detection_id}</p>")
        body.append("<h3>Detected Violations:</h3><ul>")
        
        for v in violations:
            v_type = str(v.get('type', 'Unknown')).replace('_', ' ').title()
            severity = str(v.get('severity', 'Unknown')).upper()
            details = v.get('details', '')
            body.append(f"<li><strong>{v_type}</strong> ({severity}): {details}</li>")
            
        body.append("</ul>")
        
        # Determine attachments
        attachments = []
        if image_path:
            # Note: image_path from DB is like /files/outputs/results/result_...jpg
            # We need to map it to local disk path
            local_path = image_path.replace("/files/", "data/")
            if os.path.exists(local_path):
                attachments.append(local_path)
            else:
                body.append(f"<p><em>Note: Annotated image not found locally at {local_path}</em></p>")

        yag.send(
            to=settings.RECEIVER_EMAIL,
            subject=subject,
            contents=body,
            attachments=attachments if attachments else None
        )
        logger.info(f"✅ Violation email sent successfully to {settings.RECEIVER_EMAIL}")
        
    except Exception as e:
        logger.error(f"Failed to send email alert: {e}")
