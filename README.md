# 📧 Email Organizer for Gmail

Organize your Gmail inbox effectively and never miss an important email! The primary aim of this tool is to help you identify emails that are **exclusively sent to you** within your organization, ensuring they stand out from the clutter. By doing so, the tool helps users separate the human-sent, direct emails from transactional or promotional emails.

## 🌟 Features

- **Human-Sent, Direct Email Highlighting:** Recognizes emails sent by a human directly to you within the organization, and labels them for prominence.
- **Advanced Filtering:** Uses Gmail's native functions and the Gmail API for in-depth email inspection.
- **Configurable Exclusions:** Exclude emails based on content, sender, or other criteria to further refine your inbox.
- **Automatic Labeling:** Emails that fulfill the criteria are automatically labeled.

## 📂 How the Filter Works

1. **Return-Path Check:** Emails are first inspected for a match between the 'From' address and the 'Return-Path'. Mismatches often hint at promotional or bulk emails.
2. **Domain Focus:** The tool focuses on emails sent from within your domain. If you're the sole recipient, it's highlighted. Otherwise, different labels can be applied based on your configuration.
3. **Content Inspection:** Emails containing specified phrases (like "unsubscribe", "privacy policy", etc.) are excluded.
4. **Recipient Verification:** If an email has recipients from your domain other than you, it's labeled accordingly.

## 🚀 Setup Instructions

1. **Script Implementation:** 
   - Initiate a new Google Apps Script project.
   - Paste the provided script into this project.
   - Tweak the configuration constants in the script as per your requirements.

2. **API Configuration (Optional but Recommended):**
   - Opt to utilize the Gmail API for a deeper scrutiny of emails.
   - [Activate the Gmail API](https://developers.google.com/gmail/api/quickstart/apps-script) for your Google Cloud Platform project.
   - Incorporate the required scopes to your `appsscript.json`.
   - A comprehensive guide is available [here](https://developers.google.com/apps-script/guides/services/advanced).

3. **Script Execution:**
   - Run the `setup()` function within the Apps Script editor. This establishes the necessary triggers.
   - Post this, the script will autonomously function at pre-set intervals, organizing your emails.

4. **Fine-Tuning:**
   - For a more personalized experience, adjust labels, filter words, and more by modifying the configuration constants.

## 📘 Resources

- [Google Apps Script Official Documentation](https://developers.google.com/apps-script)
- [Advanced Usage of Gmail API in Apps Script](https://developers.google.com/apps-script/advanced/gmail)
- [OAuth2 Library for Apps Script](https://github.com/googlesamples/apps-script-oauth2)

## 🙌 Acknowledgments

Crafted with pride by the [Wetherington Law Firm](https://www.wfirm.com/) in Atlanta. At the Wetherington Law Firm, we staunchly believe in harnessing technology to bolster our efficiency and enhance our client service. If you're in the vicinity of Atlanta and are seeking legal expertise, we're here to assist!
