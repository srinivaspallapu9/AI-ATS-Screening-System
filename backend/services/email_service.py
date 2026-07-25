import datetime

def generate_email_content(email_type: str, candidate_name: str, job_title: str, custom_message: str = None) -> dict:
    """
    Generates subject and body content for candidate emails.
    """
    if email_type == "ACKNOWLEDGMENT":
        subject = f"Application Received: {job_title} at TechCorp"
        body = f"Dear {candidate_name},\n\nThank you for submitting your application for the {job_title} position. Our automated AI screening system has received your resume and is processing your background.\n\nWe will update you shortly regarding your application status.\n\nBest regards,\nRecruitment Team"
    
    elif email_type == "SHORTLIST":
        subject = f"Congratulations! Shortlisted for {job_title}"
        body = f"Dear {candidate_name},\n\nGreat news! Your profile and resume scored exceptionally well during our automated screening for the {job_title} role.\n\nOur hiring team will reach out soon with next steps and interview scheduling.\n\nBest regards,\nRecruitment Team"
        
    elif email_type == "INTERVIEW":
        subject = f"Interview Invitation: {job_title}"
        custom_note = f"\nNote from Hiring Manager: {custom_message}\n" if custom_message else ""
        body = f"Dear {candidate_name},\n\nYou are invited for an interview for the position of {job_title}.{custom_note}\n\nPlease let us know your availability for the coming week to confirm the interview slot.\n\nBest regards,\nTalent Acquisition Team"
        
    elif email_type == "REJECTION":
        subject = f"Update regarding your application for {job_title}"
        reason_note = f"\nFeedback: {custom_message}" if custom_message else ""
        body = f"Dear {candidate_name},\n\nThank you for your interest in the {job_title} position. After reviewing your application against our current job criteria, we regret to inform you that we will not be moving forward with your candidacy at this time.{reason_note}\n\nWe wish you the best in your career pursuits.\n\nBest regards,\nRecruitment Team"
        
    else:
        subject = f"Update regarding {job_title}"
        body = custom_message or f"Hello {candidate_name}, regarding your application for {job_title}."

    return {
        "subject": subject,
        "body": body
    }

def send_candidate_email(recipient_email: str, email_type: str, candidate_name: str, job_title: str, custom_message: str = None) -> dict:
    """
    Sends/logs email notification to candidate.
    """
    content = generate_email_content(email_type, candidate_name, job_title, custom_message)
    
    # Log simulated SMTP delivery
    print(f"================ EMAIL SENT ================")
    print(f"TO: {recipient_email}")
    print(f"SUBJECT: {content['subject']}")
    print(f"BODY:\n{content['body']}")
    print(f"============================================")
    
    return {
        "recipient": recipient_email,
        "subject": content["subject"],
        "body": content["body"],
        "status": "SENT",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
