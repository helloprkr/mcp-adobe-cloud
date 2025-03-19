# Start Session Instructions

1. Locate and analyze the most recent status update file in the `.ai/status/` directory (format: `YYYY-MM-DD.md`).

2. Understand the current project state, recent decisions, and prepare to assist with outlined next steps.

3. Create a new status file for the current session in `.ai/status/` with format `YYYY-MM-DD.md` that includes:
   
   ```markdown
   # Session Update: YYYY-MM-DD
   
   ## Timestamp
   - **Creation Time**: YYYY-MM-DD HH:MM:SS UTC
   - **Last Updated**: YYYY-MM-DD HH:MM:SS UTC
   - **Session Duration**: In progress
   - **Contributors**: [list of contributors]
   - **Related Sessions**: [link to most recent status file]
   ```
   
   Use the current UTC time: `date -u +"%Y-%m-%d %H:%M:%S UTC"` for "Creation Time" and "Last Updated".

4. If no specific task is requested:

   - List all next steps from the latest session.
   - Suggest which step to take first, providing a brief rationale.
   - Be ready to address any challenges or blockers mentioned.

5. Provide context-aware assistance throughout the session, referencing the status update when discussing project status or next steps.

6. Be prepared to help implement tasks and features listed in the Next Steps section, recalling relevant details for specific components or code areas.

7. Throughout the session, periodically update the "Last Updated" timestamp in the current session file.

8. At the end of the session, create a new status update using the guidelines in `end-session.md`.

9. Refer to `.ai/status/timestamp-template.md` for the complete timestamp procedure guidelines.

10. HIPAA Compliance and Accessibility Considerations:

    - This application must be accessible to users with physical limitations who may only be able to double-click the application.
    - All recommended implementations must comply with HIPAA requirements for protected health information (PHI).
    - Be prepared to provide solutions for one-click launching that bypass typical security restrictions for physically limited users.
    - When suggesting code changes, prioritize:
      - Automated security permission handling
      - Simplified launch procedures
      - Voice command capabilities
      - Auto-save functionality
      - PHI data protection and encryption
    
    Refer to the HIPAA-Compliant Accessibility Instructions section in the latest status update for comprehensive guidelines.

11. For macOS Application Launch Instructions:

    - Keep instructions simple and focused on double-click functionality
    - Include workarounds for Gatekeeper restrictions
    - Specify steps to remove quarantine attributes automatically
    - Document voice command capabilities if available
    - Ensure all file permissions are properly set for accessibility
    - Provide fallback instructions for caregivers who can perform one-time terminal commands
